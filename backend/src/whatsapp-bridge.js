/**
 * OmniFlow WhatsApp Bridge Server
 * Powered by @whiskeysockets/baileys
 * 
 * Conecta diretamente aos servidores oficiais do WhatsApp, gera o QR Code REAL
 * e sincroniza conversas e mensagens em tempo real para o OmniFlow CRM.
 */

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const AUTH_DIR = path.join(__dirname, '..', '.whatsapp_auth');

// Estado em memória sincronizado
let sock = null;
let currentQr = null;
let connectionState = {
  connected: false,
  connecting: true,
  user: null,
  battery: '95%'
};

let chatsStore = new Map();
let messagesStore = new Map();

async function startWhatsAppBridge() {
  console.log('[OmniFlow WA] Inicializando motor Baileys...');
  
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`[OmniFlow WA] Usando versão do WhatsApp Web: v${version.join('.')} (Latest: ${isLatest})`);

  sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    browser: ['OmniFlow CRM', 'Chrome', '20.0.04']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('[OmniFlow WA] Novo QR Code REAL gerado pelo WhatsApp!');
      try {
        currentQr = await qrcode.toDataURL(qr, { margin: 2, scale: 8 });
        connectionState.connected = false;
        connectionState.connecting = true;
      } catch (err) {
        console.error('Erro ao converter QR Code:', err);
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log(`[OmniFlow WA] Conexão fechada. Motivo: ${statusCode}. Reconectando? ${shouldReconnect}`);

      connectionState.connected = false;
      connectionState.connecting = false;
      connectionState.user = null;
      currentQr = null;

      if (statusCode === DisconnectReason.loggedOut) {
        console.log('[OmniFlow WA] Sessão desconectada. Limpando credenciais...');
        try {
          fs.rmSync(AUTH_DIR, { recursive: true, force: true });
        } catch {}
      }

      if (shouldReconnect) {
        setTimeout(startWhatsAppBridge, 3000);
      }
    } else if (connection === 'open') {
      console.log('[OmniFlow WA] WhatsApp Conectado com sucesso!', sock.user);
      connectionState.connected = true;
      connectionState.connecting = false;
      connectionState.user = {
        id: sock.user?.id || '',
        name: sock.user?.name || 'Meu WhatsApp',
        phone: (sock.user?.id || '').split(':')[0].replace(/\D/g, '')
      };
      currentQr = null;
    }
  });

  // Captura de conversas reais do WhatsApp
  sock.ev.on('chats.upsert', (newChats) => {
    for (const chat of newChats) {
      const jid = chat.id;
      if (!jid || jid.includes('@broadcast') || jid.includes('@newsletter')) continue;
      
      const cleanPhone = jid.split('@')[0];
      const isGroup = jid.endsWith('@g.us');
      const existing = chatsStore.get(jid) || {};

      chatsStore.set(jid, {
        ...existing,
        id: jid,
        phone: cleanPhone,
        name: chat.name || existing.name || (isGroup ? 'Grupo WhatsApp' : cleanPhone),
        unread: (chat.unreadCount || 0) > 0,
        unreadCount: chat.unreadCount || 0,
        timestamp: chat.conversationTimestamp || Date.now(),
        lastMessage: existing.lastMessage || 'Conversa sincronizada'
      });
    }
  });

  // Captura de mensagens reais recebidas e enviadas
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    for (const msg of messages) {
      const jid = msg.key?.remoteJid;
      if (!jid || jid.includes('@broadcast') || jid.includes('@newsletter')) continue;

      const isFromMe = !!msg.key?.fromMe;
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        msg.message?.imageMessage?.caption ||
        (msg.message?.imageMessage ? '📷 [Foto]' : '') ||
        (msg.message?.audioMessage ? '🎵 [Áudio]' : '') ||
        (msg.message?.documentMessage ? '📄 [Documento]' : '');

      if (!text) continue;

      const chatList = chatsStore.get(jid) || {
        id: jid,
        phone: jid.split('@')[0],
        name: msg.pushName || jid.split('@')[0]
      };

      const msgObj = {
        id: msg.key?.id || 'msg_' + Date.now(),
        sender: isFromMe ? 'operator' : 'customer',
        text,
        time: new Date(Number(msg.messageTimestamp || Date.now()) * 1000).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      if (!messagesStore.has(jid)) messagesStore.set(jid, []);
      messagesStore.get(jid).push(msgObj);

      chatList.lastMessage = text;
      chatList.lastMessageTime = msgObj.time;
      if (!isFromMe) chatList.unread = true;
      chatsStore.set(jid, chatList);
    }
  });
}

// =============================================================================
// ROTAS REST DA API PARA O CRM (BANDEJA & PAINEL DE CONEXÃO)
// =============================================================================

// Status e QR Code
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    running: true,
    connected: connectionState.connected,
    connecting: connectionState.connecting,
    user: connectionState.user,
    battery: connectionState.battery,
    qr: currentQr
  });
});

// Apenas o QR Code
app.get('/api/whatsapp/qr', (req, res) => {
  res.json({
    connected: connectionState.connected,
    qr: currentQr
  });
});

// Listagem de Conversas Reais Sincronizadas
app.get('/api/whatsapp/chats', (req, res) => {
  const chats = Array.from(chatsStore.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  res.json({ chats });
});

// Mensagens de uma conversa específica
app.get('/api/whatsapp/messages/:chatId', (req, res) => {
  const { chatId } = req.params;
  const decoded = decodeURIComponent(chatId);
  const msgs = messagesStore.get(decoded) || [];
  res.json({ messages: msgs });
});

// Envio de mensagem real pelo WhatsApp conectado
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { phone, text, jid } = req.body;
    if (!sock || !connectionState.connected) {
      return res.status(400).json({ error: 'WhatsApp não está conectado no momento.' });
    }
    if (!text) {
      return res.status(400).json({ error: 'Texto da mensagem é obrigatório.' });
    }

    let targetJid = jid;
    if (!targetJid && phone) {
      const clean = phone.replace(/\D/g, '');
      targetJid = `${clean}@s.whatsapp.net`;
    }

    if (!targetJid) {
      return res.status(400).json({ error: 'Destinatário (phone ou jid) inválido.' });
    }

    console.log(`[OmniFlow WA] Enviando mensagem para ${targetJid}: "${text.substring(0, 40)}..."`);
    const sent = await sock.sendMessage(targetJid, { text });

    // Salva na memória da conversa
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const msgObj = {
      id: sent.key.id,
      sender: 'operator',
      text,
      time
    };

    if (!messagesStore.has(targetJid)) messagesStore.set(targetJid, []);
    messagesStore.get(targetJid).push(msgObj);

    const existingChat = chatsStore.get(targetJid) || {
      id: targetJid,
      phone: targetJid.split('@')[0],
      name: targetJid.split('@')[0]
    };
    existingChat.lastMessage = text;
    existingChat.lastMessageTime = time;
    chatsStore.set(targetJid, existingChat);

    return res.json({ success: true, messageId: sent.key.id });
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    return res.status(500).json({ error: err.message || 'Falha ao enviar mensagem.' });
  }
});

// Desconectar / Logout
app.post('/api/whatsapp/logout', async (req, res) => {
  try {
    if (sock) {
      await sock.logout();
    }
    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    } catch {}
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Inicia servidor Express e Conexão Baileys
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 OmniFlow Real WhatsApp Bridge Server rodando na porta ${PORT}`);
  console.log(`📡 Endpoint de Status: http://localhost:${PORT}/api/whatsapp/status`);
  console.log(`======================================================\n`);
  startWhatsAppBridge();
});
