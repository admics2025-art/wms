import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import {
  adminDb,
  adminStorage,
  verifyTenantRequestAuth,
} from '@/lib/firebase/admin';
import { extractClientIp, logActivity } from '@/lib/audit';
import { OrderPdfDocument } from '@/components/documents/order-pdf-template';
import {
  Order,
  Tenant,
  WhatsAppChat,
  WhatsAppMessage,
} from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SendPdfRequestBody {
  customMessage?: string;
  overridePhone?: string;
}

interface EvolutionSendMediaResponse {
  key?: {
    id?: string;
    remoteJid?: string;
    fromMe?: boolean;
  };
  status?: string;
}

function normalizeWhatsAppNumber(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

async function dispatchDocumentViaEvolutionApi(params: {
  baseUrl: string;
  instanceName: string;
  apiKey: string;
  recipientNumber: string;
  fileName: string;
  caption: string;
  pdfBase64: string;
}): Promise<{ providerMessageId: string; remoteJid: string }> {
  const cleanBaseUrl = params.baseUrl.replace(/\/+$/, '');
  const endpoint = `${cleanBaseUrl}/message/sendMedia/${encodeURIComponent(
    params.instanceName
  )}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: params.apiKey,
    },
    body: JSON.stringify({
      number: params.recipientNumber,
      mediatype: 'document',
      mimetype: 'application/pdf',
      caption: params.caption,
      media: params.pdfBase64,
      fileName: params.fileName,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Falha no gateway WhatsApp (HTTP ${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as EvolutionSendMediaResponse;
  const providerMessageId = data?.key?.id || `evo_${Date.now()}`;
  const remoteJid =
    data?.key?.remoteJid || `${params.recipientNumber}@s.whatsapp.net`;

  return { providerMessageId, remoteJid };
}

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const ipAddress = extractClientIp(request.headers);
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const authUser = await verifyTenantRequestAuth(
      request.headers.get('authorization')
    );

    if (authUser.role === 'viewer') {
      return NextResponse.json(
        {
          error:
            'Permissão negada: usuários com perfil `viewer` não podem disparar documentos.',
        },
        { status: 403 }
      );
    }

    const orderId = context.params.id;
    if (!orderId) {
      return NextResponse.json(
        { error: 'ID da Ordem de Serviço ausente.' },
        { status: 400 }
      );
    }

    let bodyPayload: SendPdfRequestBody = {};
    try {
      bodyPayload = (await request.json()) as SendPdfRequestBody;
    } catch {
      // Body opcional
    }

    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { error: 'Ordem de Serviço não encontrada.' },
        { status: 404 }
      );
    }

    const orderData = orderSnap.data() as Order;
    if (orderData.companyId !== authUser.companyId && authUser.role !== 'superadmin') {
      return NextResponse.json(
        { error: 'Violação de isolamento Multi-Tenant: acesso negado.' },
        { status: 403 }
      );
    }

    const tenantRef = adminDb.collection('tenants').doc(orderData.companyId);
    const tenantSnap = await tenantRef.get();

    if (!tenantSnap.exists) {
      return NextResponse.json(
        { error: 'Configuração do Tenant não localizada.' },
        { status: 404 }
      );
    }

    const tenantData = tenantSnap.data() as Tenant;
    const whatsappConfig = tenantData.whatsappConfig;

    if (
      !whatsappConfig ||
      !whatsappConfig.baseUrl ||
      !whatsappConfig.instanceName ||
      !whatsappConfig.apiKey
    ) {
      return NextResponse.json(
        {
          error:
            'A instância do WhatsApp (Evolution API) não está configurada para este Tenant.',
        },
        { status: 422 }
      );
    }

    const pdfElement = React.createElement(OrderPdfDocument, {
      order: orderData,
      tenant: tenantData,
    });
    const pdfBuffer = await renderToBuffer(pdfElement);
    const pdfBase64 = pdfBuffer.toString('base64');

    const sanitizedOrderNumber = orderData.orderNumber.replace(
      /[^a-zA-Z0-9_-]/g,
      '_'
    );
    const fileName = `${sanitizedOrderNumber}.pdf`;
    const storagePath = `tenants/${orderData.companyId}/orders/${orderData.id}/${fileName}`;

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(pdfBuffer, {
      resumable: false,
      contentType: 'application/pdf',
      metadata: {
        cacheControl: 'private, max-age=3600',
        metadata: {
          companyId: orderData.companyId,
          orderId: orderData.id,
          orderNumber: orderData.orderNumber,
          generatedByUserId: authUser.uid,
        },
      },
    });

    const [signedUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    });

    const rawTargetPhone =
      bodyPayload.overridePhone ||
      orderData.customerSnapshot.phone ||
      orderData.customerSnapshot.whatsappJid;

    const recipientNumber = normalizeWhatsAppNumber(rawTargetPhone);
    const formattedTotal = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: tenantData.settings?.currency || 'BRL',
    }).format(orderData.financials.grandTotalCents / 100);

    const caption =
      bodyPayload.customMessage?.trim() ||
      `Olá *${orderData.customerSnapshot.name}*!\n\nSegue em anexo o documento referente à *${orderData.orderNumber}* no valor total de *${formattedTotal}*.\n\nAtenciosamente,\n*${tenantData.tradeName || tenantData.name}*`;

    const { providerMessageId, remoteJid } =
      await dispatchDocumentViaEvolutionApi({
        baseUrl: whatsappConfig.baseUrl,
        instanceName: whatsappConfig.instanceName,
        apiKey: whatsappConfig.apiKey,
        recipientNumber,
        fileName,
        caption,
        pdfBase64,
      });

    const nowIso = new Date().toISOString();

    const updatedPdfMetadata: Order['pdfDocument'] = {
      storagePath,
      signedUrl,
      generatedAt: nowIso,
      lastSentViaWhatsAppAt: nowIso,
    };

    await orderRef.update({
      pdfDocument: updatedPdfMetadata,
      updatedAt: nowIso,
    });

    const chatsQuery = await adminDb
      .collection('whatsapp_chats')
      .where('companyId', '==', orderData.companyId)
      .where('remoteJid', '==', remoteJid)
      .limit(1)
      .get();

    let chatId: string;

    if (chatsQuery.empty) {
      const newChatRef = adminDb.collection('whatsapp_chats').doc();
      chatId = newChatRef.id;
      const newChat: WhatsAppChat = {
        id: chatId,
        companyId: orderData.companyId,
        remoteJid,
        customerPhone: recipientNumber,
        customerName: orderData.customerSnapshot.name,
        customerId: orderData.customerId,
        activeOrderId: orderData.id,
        status: 'open',
        department: 'sales',
        assignedToUserId: authUser.uid,
        assignedToUserName: authUser.name,
        unreadCount: 0,
        lastMessagePreview: `📄 ${fileName}`,
        lastMessageAt: nowIso,
        lastMessageDirection: 'outbound',
        tags: ['OS Enviada'],
        isPinned: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await newChatRef.set(newChat);
    } else {
      const existingChatDoc = chatsQuery.docs[0]!;
      chatId = existingChatDoc.id;
      await existingChatDoc.ref.update({
        activeOrderId: orderData.id,
        lastMessagePreview: `📄 ${fileName}`,
        lastMessageAt: nowIso,
        lastMessageDirection: 'outbound',
        updatedAt: nowIso,
      });
    }

    const messageRef = adminDb.collection('whatsapp_messages').doc();
    const newMessage: WhatsAppMessage = {
      id: messageRef.id,
      companyId: orderData.companyId,
      chatId,
      remoteJid,
      providerMessageId,
      direction: 'outbound',
      type: 'document',
      body: caption,
      media: {
        url: signedUrl,
        storagePath,
        mimeType: 'application/pdf',
        fileName,
        fileSizeBytes: pdfBuffer.byteLength,
        caption,
      },
      senderUserId: authUser.uid,
      senderUserName: authUser.name,
      deliveryStatus: 'sent',
      relatedOrderId: orderData.id,
      createdAt: nowIso,
    };

    await messageRef.set(newMessage);

    const auditRecord = await logActivity({
      companyId: orderData.companyId,
      userId: authUser.uid,
      userName: authUser.name,
      userRole: authUser.role,
      action: 'WHATSAPP_PDF_SENT',
      entity: 'order',
      entityId: orderData.id,
      ipAddress,
      userAgent,
      before: {
        pdfDocument: orderData.pdfDocument ?? null,
      },
      after: {
        pdfDocument: updatedPdfMetadata,
      },
      metadata: {
        orderNumber: orderData.orderNumber,
        recipientNumber,
        providerMessageId,
        storagePath,
        pdfSizeBytes: pdfBuffer.byteLength,
      },
    });

    return NextResponse.json(
      {
        success: true,
        orderId: orderData.id,
        orderNumber: orderData.orderNumber,
        storagePath,
        signedUrl,
        whatsapp: {
          chatId,
          messageId: newMessage.id,
          providerMessageId,
          recipientNumber,
        },
        auditLogId: auditRecord.id,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erro interno inesperado.';
    const status = message.startsWith('UNAUTHORIZED')
      ? 401
      : message.startsWith('FORBIDDEN')
      ? 403
      : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

