import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { Order, Tenant } from '@/types/database';

export interface OrderPdfTemplateProps {
  order: Order;
  tenant: Tenant;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#0f172a',
    paddingBottom: 14,
    marginBottom: 16,
  },
  companyBlock: {
    width: '60%',
  },
  companyName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 3,
  },
  companySubtext: {
    fontSize: 8,
    color: '#475569',
    marginBottom: 2,
  },
  orderBadgeBlock: {
    width: '38%',
    alignItems: 'flex-end',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  documentTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    textTransform: 'uppercase',
  },
  orderNumber: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#0284c7',
    marginTop: 2,
    marginBottom: 4,
  },
  metaRow: {
    fontSize: 8,
    color: '#475569',
    marginBottom: 1,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 8,
  },
  gridColHalf: {
    width: '50%',
    marginBottom: 5,
    paddingRight: 8,
  },
  gridColFull: {
    width: '100%',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 9,
    color: '#0f172a',
    marginTop: 1,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 8.5,
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  colCode: { width: '13%' },
  colDesc: { width: '37%', paddingRight: 4 },
  colLoc: { width: '12%' },
  colQty: { width: '8%', textAlign: 'right' },
  colUnit: { width: '10%', textAlign: 'right' },
  colDisc: { width: '9%', textAlign: 'right' },
  colTotal: { width: '11%', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  totalsAndPaymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  paymentBox: {
    width: '52%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#f8fafc',
  },
  totalsBox: {
    width: '44%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 8,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    fontSize: 8.5,
  },
  grandTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1.5,
    borderTopColor: '#0f172a',
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0284c7',
  },
  notesBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 8,
    minHeight: 38,
    fontSize: 8.5,
    color: '#334155',
    lineHeight: 1.4,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 34,
    paddingTop: 10,
  },
  signatureBlock: {
    width: '45%',
    borderTopWidth: 1,
    borderTopColor: '#475569',
    alignItems: 'center',
    paddingTop: 6,
  },
  signatureLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
  },
  signatureSub: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
    color: '#94a3b8',
  },
});

function formatCurrencyFromCents(cents: number, currency: string = 'BRL'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDatePtBr(isoString?: string): string {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

const ORDER_STATUS_LABELS: Record<Order['status'], string> = {
  draft: 'Rascunho',
  pending_approval: 'Aguardando Aprovação',
  approved: 'Aprovada',
  in_picking: 'Em Separação (WMS)',
  in_progress: 'Em Execução',
  completed: 'Concluída',
  invoiced: 'Faturada',
  canceled: 'Cancelada',
};

const PAYMENT_METHOD_LABELS: Record<Order['payment']['method'], string> = {
  pix: 'PIX Instantâneo',
  boleto: 'Boleto Bancário',
  credit_card: 'Cartão de Crédito',
  bank_transfer: 'Transferência Bancária / TED',
  cash: 'Espécie',
  net_terms: 'Faturado a Prazo (B2B)',
};

export const OrderPdfDocument: React.FC<OrderPdfTemplateProps> = ({
  order,
  tenant,
}) => {
  const currency = tenant.settings?.currency || 'BRL';

  return (
    <Document
      title={`${order.orderNumber} - ${tenant.tradeName || tenant.name}`}
      author={tenant.name}
      subject={`Ordem de Serviço / Pedido ${order.orderNumber}`}
      creator="OmniFlow CRM/WMS Enterprise"
    >
      <Page size="A4" style={styles.page}>
        {/* CABEÇALHO DO TENANT E IDENTIFICAÇÃO DA OS */}
        <View style={styles.headerContainer}>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>
              {tenant.tradeName || tenant.name}
            </Text>
            <Text style={styles.companySubtext}>
              Razão Social: {tenant.name} | CNPJ: {tenant.documentNumber}
            </Text>
            <Text style={styles.companySubtext}>
              {tenant.address.street}, {tenant.address.number} -{' '}
              {tenant.address.neighborhood}, {tenant.address.city}/
              {tenant.address.state} - CEP {tenant.address.zipCode}
            </Text>
            <Text style={styles.companySubtext}>
              Tel: {tenant.phone} | E-mail: {tenant.email}
            </Text>
          </View>

          <View style={styles.orderBadgeBlock}>
            <Text style={styles.documentTitle}>
              {order.type === 'quote'
                ? 'Proposta Comercial'
                : order.type === 'sales_order'
                ? 'Pedido de Venda'
                : 'Ordem de Serviço'}
            </Text>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.metaRow}>
              Status: {ORDER_STATUS_LABELS[order.status]}
            </Text>
            <Text style={styles.metaRow}>
              Emissão: {formatDatePtBr(order.createdAt)}
            </Text>
            <Text style={styles.metaRow}>
              Responsável: {order.salespersonName}
            </Text>
          </View>
        </View>

        {/* DADOS DO CLIENTE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Identificação do Cliente</Text>
          <View style={styles.gridContainer}>
            <View style={styles.gridColHalf}>
              <Text style={styles.fieldLabel}>Cliente / Razão Social</Text>
              <Text style={styles.fieldValue}>{order.customerSnapshot.name}</Text>
            </View>
            <View style={styles.gridColHalf}>
              <Text style={styles.fieldLabel}>CPF / CNPJ</Text>
              <Text style={styles.fieldValue}>
                {order.customerSnapshot.documentNumber}
              </Text>
            </View>
            <View style={styles.gridColHalf}>
              <Text style={styles.fieldLabel}>Telefone / WhatsApp</Text>
              <Text style={styles.fieldValue}>{order.customerSnapshot.phone}</Text>
            </View>
            <View style={styles.gridColHalf}>
              <Text style={styles.fieldLabel}>E-mail</Text>
              <Text style={styles.fieldValue}>{order.customerSnapshot.email}</Text>
            </View>
            <View style={styles.gridColFull}>
              <Text style={styles.fieldLabel}>Endereço Completo</Text>
              <Text style={styles.fieldValue}>
                {order.customerSnapshot.addressSummary}
              </Text>
            </View>
          </View>
        </View>

        {/* LAUDO TÉCNICO / EQUIPAMENTO (SE HOUVER) */}
        {order.equipmentOrAssetDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              2. Equipamento / Diagnóstico Técnico
            </Text>
            <View style={styles.gridContainer}>
              <View style={styles.gridColHalf}>
                <Text style={styles.fieldLabel}>Marca / Modelo</Text>
                <Text style={styles.fieldValue}>
                  {order.equipmentOrAssetDetails.brand || '-'} /{' '}
                  {order.equipmentOrAssetDetails.model || '-'}
                </Text>
              </View>
              <View style={styles.gridColHalf}>
                <Text style={styles.fieldLabel}>Número de Série / Patrimônio</Text>
                <Text style={styles.fieldValue}>
                  {order.equipmentOrAssetDetails.serialNumber || '-'}
                </Text>
              </View>
              {order.equipmentOrAssetDetails.reportedDefect && (
                <View style={styles.gridColFull}>
                  <Text style={styles.fieldLabel}>Defeito Relatado / Solicitação</Text>
                  <Text style={styles.fieldValue}>
                    {order.equipmentOrAssetDetails.reportedDefect}
                  </Text>
                </View>
              )}
              {order.equipmentOrAssetDetails.technicalDiagnosis && (
                <View style={styles.gridColFull}>
                  <Text style={styles.fieldLabel}>Diagnóstico / Parecer Técnico</Text>
                  <Text style={styles.fieldValue}>
                    {order.equipmentOrAssetDetails.technicalDiagnosis}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* TABELA DE ITENS E SERVIÇOS (INTEGRAÇÃO WMS/CRM) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            3. Peças, Produtos (WMS) e Serviços Executados
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colCode}>SKU / Cód.</Text>
              <Text style={styles.colDesc}>Descrição do Item / Serviço</Text>
              <Text style={styles.colLoc}>End. WMS</Text>
              <Text style={styles.colQty}>Qtd.</Text>
              <Text style={styles.colUnit}>Vlr. Unit.</Text>
              <Text style={styles.colDisc}>Desc.</Text>
              <Text style={styles.colTotal}>Subtotal</Text>
            </View>

            {order.items.map((item, idx) => (
              <View
                key={item.id || String(idx)}
                style={[
                  styles.tableRow,
                  idx % 2 === 1 ? styles.tableRowAlt : {},
                ]}
              >
                <Text style={styles.colCode}>{item.sku}</Text>
                <Text style={styles.colDesc}>{item.name}</Text>
                <Text style={styles.colLoc}>
                  {item.warehouseBinLocation || 'SERV'}
                </Text>
                <Text style={styles.colQty}>
                  {item.quantity} {item.unit}
                </Text>
                <Text style={styles.colUnit}>
                  {formatCurrencyFromCents(item.unitPriceCents, currency)}
                </Text>
                <Text style={styles.colDisc}>
                  {formatCurrencyFromCents(item.discountCents, currency)}
                </Text>
                <Text style={styles.colTotal}>
                  {formatCurrencyFromCents(item.subtotalCents, currency)}
                </Text>
              </View>
            ))}
          </View>

          {/* PAGAMENTO E RESUMO FINANCEIRO */}
          <View style={styles.totalsAndPaymentRow}>
            <View style={styles.paymentBox}>
              <Text style={styles.fieldLabel}>Condições de Pagamento</Text>
              <Text style={[styles.fieldValue, { marginBottom: 4 }]}>
                Modalidade: {PAYMENT_METHOD_LABELS[order.payment.method]} (
                {order.payment.installments}x)
              </Text>
              <Text style={styles.metaRow}>
                Vencimento: {formatDatePtBr(order.payment.dueDate)}
              </Text>
              <Text style={styles.metaRow}>
                Técnico Designado: {order.assignedTechnicianName || 'Não alocado'}
              </Text>
            </View>

            <View style={styles.totalsBox}>
              <View style={styles.totalLine}>
                <Text>Subtotal Produtos (WMS):</Text>
                <Text>
                  {formatCurrencyFromCents(
                    order.financials.itemsSubtotalCents,
                    currency
                  )}
                </Text>
              </View>
              <View style={styles.totalLine}>
                <Text>Subtotal Serviços:</Text>
                <Text>
                  {formatCurrencyFromCents(
                    order.financials.servicesSubtotalCents,
                    currency
                  )}
                </Text>
              </View>
              <View style={styles.totalLine}>
                <Text>Frete / Logística:</Text>
                <Text>
                  {formatCurrencyFromCents(
                    order.financials.shippingCents,
                    currency
                  )}
                </Text>
              </View>
              <View style={styles.totalLine}>
                <Text>Descontos Concedidos:</Text>
                <Text>
                  -{' '}
                  {formatCurrencyFromCents(
                    order.financials.discountTotalCents,
                    currency
                  )}
                </Text>
              </View>
              <View style={styles.grandTotalLine}>
                <Text>TOTAL LÍQUIDO:</Text>
                <Text>
                  {formatCurrencyFromCents(
                    order.financials.grandTotalCents,
                    currency
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* OBSERVAÇÕES E TERMOS */}
        {order.customerVisibleNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              4. Observações e Termos de Garantia
            </Text>
            <View style={styles.notesBox}>
              <Text>{order.customerVisibleNotes}</Text>
            </View>
          </View>
        )}

        {/* ASSINATURAS */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>
              {tenant.tradeName || tenant.name}
            </Text>
            <Text style={styles.signatureSub}>
              Responsável Técnico / Atendimento
            </Text>
          </View>

          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>
              {order.customerSnapshot.name}
            </Text>
            <Text style={styles.signatureSub}>
              Assinatura do Cliente ({order.customerSnapshot.documentNumber})
            </Text>
          </View>
        </View>

        {/* RODAPÉ FIXO */}
        <View style={styles.footer} fixed>
          <Text>
            OmniFlow CRM/WMS Enterprise • Tenant ID: {tenant.id} • Documento
            gerado eletronicamente
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
};

