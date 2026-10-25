import React from 'react';
import {
  Document as PdfDocument,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { Document as DocumentType, DocumentItem, Customer, Settings, Project } from '../types';
import { format, parseISO, isValid } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    paddingTop: 40,
    paddingBottom: 45,
    paddingHorizontal: 40,
    color: '#000000',
    backgroundColor: '#FFFFFF',
    lineHeight: 1.35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
  },
  logoBlock: {
    flexDirection: 'column',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  logoCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  logoCrew: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  companyTagline: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 3,
  },
  companyOwner: {
    fontSize: 9.5,
    color: '#000000',
    marginBottom: 2,
  },
  companyContact: {
    fontSize: 9,
    color: '#222222',
    marginBottom: 1.5,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 0.5,
    textAlign: 'right',
    marginBottom: 6,
  },
  headerMetaText: {
    fontSize: 9.5,
    color: '#222222',
    textAlign: 'right',
    marginBottom: 2.5,
  },
  headerDivider: {
    width: '100%',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    marginBottom: 16,
  },
  billedToSection: {
    marginBottom: 18,
  },
  billedToLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  billedToUnderline: {
    width: 190,
    borderBottomWidth: 0.8,
    borderBottomColor: '#000000',
    marginBottom: 6,
  },
  billedToCompany: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  billedToAttn: {
    fontSize: 9,
    color: '#222222',
    marginBottom: 2,
  },
  billedToText: {
    fontSize: 9,
    color: '#222222',
    marginBottom: 2,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000000',
    marginBottom: 22,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  colDescHeader: {
    width: '78%',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  colAmountHeader: {
    width: '22%',
    paddingVertical: 7,
    paddingHorizontal: 8,
    textAlign: 'right',
  },
  tableHeaderTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  colDesc: {
    width: '78%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  colAmount: {
    width: '22%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  itemTask: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 3,
  },
  itemDescription: {
    fontSize: 8.5,
    color: '#222222',
    lineHeight: 1.35,
  },
  itemAmount: {
    fontSize: 9,
    color: '#000000',
    textAlign: 'right',
  },
  subtotalRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  colSubtotalLabel: {
    width: '78%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    alignItems: 'flex-end',
  },
  colSubtotalValue: {
    width: '22%',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  subtotalText: {
    fontSize: 9,
    color: '#000000',
    textAlign: 'right',
  },
  totalDueRow: {
    flexDirection: 'row',
  },
  colTotalDueLabel: {
    width: '78%',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    alignItems: 'flex-end',
  },
  colTotalDueValue: {
    width: '22%',
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  totalDueLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
    textAlign: 'right',
  },
  totalDueValueText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'right',
  },
  paymentBox: {
    width: 250,
    borderWidth: 1,
    borderColor: '#000000',
    padding: 8,
    marginBottom: 20,
  },
  paymentHeading: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#000000',
    textTransform: 'uppercase',
    paddingBottom: 4,
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
  },
  paymentLabel: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#000000',
  },
  paymentValue: {
    fontSize: 8.5,
    color: '#000000',
  },
  thankYouContainer: {
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thankYouText: {
    fontSize: 9,
    color: '#222222',
    textAlign: 'center',
  },
  notesContainer: {
    marginTop: 12,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  notesHeading: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 8,
    color: '#444444',
    lineHeight: 1.3,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#777777',
  },
});

function formatInvoiceDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    if (isValid(d)) {
      return format(d, 'd MMMM yyyy');
    }
    const fallback = new Date(date);
    if (!isNaN(fallback.getTime())) {
      return format(fallback, 'd MMMM yyyy');
    }
    return String(date);
  } catch {
    return String(date);
  }
}

function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0.00';
  }
  return Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface PdfDocumentProps {
  document: DocumentType;
  items: DocumentItem[];
  customer: Customer;
  project?: Project;
  settings: Settings;
}

export const CodeCrewPdfDocument: React.FC<PdfDocumentProps> = ({
  document,
  items,
  customer,
  project,
  settings,
}) => {
  const isInvoice = document.type === 'invoice';
  const title = isInvoice ? 'INVOICE' : 'QUOTATION';
  const rawNumber = document.number ? document.number.replace(/^#\s*/, '') : 'CC-INV-2026-001';
  const invoiceFormattedNum = `# ${rawNumber}`;

  const subtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  const discount = Number(document.discount) || 0;
  const grandTotal = Math.max(0, subtotal - discount);

  const refQuotation =
    (document as any).ref_quotation ||
    (document as any).refQuotation ||
    (project as any)?.ref_quotation ||
    (project as any)?.refQuotation ||
    (document as any).ref_number;

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        {/* Top Header */}
        <View style={styles.header}>
          {/* Logo & Company Info on Left: Code in black, Crew in orange */}
          <View style={styles.logoBlock}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoCode}>Code</Text>
              <Text style={styles.logoCrew}>Crew</Text>
            </View>
            <Text style={styles.companyTagline}>Software Solutions</Text>
            <Text style={styles.companyOwner}>{settings.owner_name || 'R.H.V.R.Pramod'}</Text>
            <Text style={styles.companyContact}>Mobile: {settings.mobile || '0755437148'}</Text>
            <Text style={styles.companyContact}>Email: {settings.email || 'rusirupramod@gmail.com'}</Text>
          </View>

          {/* Title & Metadata on Right */}
          <View style={styles.headerRight}>
            <Text style={styles.docTitle}>{title}</Text>
            <Text style={styles.headerMetaText}>{invoiceFormattedNum}</Text>
            <Text style={styles.headerMetaText}>Date: {formatInvoiceDate(document.issue_date)}</Text>
            {refQuotation ? (
              <Text style={styles.headerMetaText}>Ref Quotation: {refQuotation}</Text>
            ) : isInvoice && document.due_date ? (
              <Text style={styles.headerMetaText}>Due Date: {formatInvoiceDate(document.due_date)}</Text>
            ) : !isInvoice && document.due_date ? (
              <Text style={styles.headerMetaText}>Valid Until: {formatInvoiceDate(document.due_date)}</Text>
            ) : null}
          </View>
        </View>

        {/* Full-width Divider Line */}
        <View style={styles.headerDivider} />

        {/* BILLED TO Section */}
        <View style={styles.billedToSection}>
          <Text style={styles.billedToLabel}>BILLED TO</Text>
          <View style={styles.billedToUnderline} />
          {customer.company ? (
            <>
              <Text style={styles.billedToCompany}>{customer.company}</Text>
              <Text style={styles.billedToAttn}>Attn: {customer.name}</Text>
            </>
          ) : (
            <Text style={styles.billedToCompany}>{customer.name}</Text>
          )}
          {customer.address
            ? customer.address.split('\n').map((line, idx) => (
                <Text key={idx} style={styles.billedToText}>
                  {line.trim()}
                </Text>
              ))
            : null}
          {customer.phone ? (
            <Text style={styles.billedToText}>
              <Text style={{ fontWeight: 'bold' }}>Phone: </Text>
              {customer.phone}
            </Text>
          ) : null}
          {customer.email ? (
            <Text style={styles.billedToText}>
              <Text style={{ fontWeight: 'bold' }}>Email: </Text>
              {customer.email}
            </Text>
          ) : null}
        </View>

        {/* Table: Outer border with DESCRIPTION & AMOUNT (LKR) */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeaderRow}>
            <View style={styles.colDescHeader}>
              <Text style={styles.tableHeaderTitle}>DESCRIPTION</Text>
            </View>
            <View style={styles.colAmountHeader}>
              <Text style={styles.tableHeaderTitle}>AMOUNT (LKR)</Text>
            </View>
          </View>

          {/* Line Items */}
          {items.map((item, idx) => (
            <View key={item.id || idx} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.itemTask}>{item.task}</Text>
                {item.description ? (
                  <Text style={styles.itemDescription}>{item.description}</Text>
                ) : null}
              </View>
              <View style={styles.colAmount}>
                <Text style={styles.itemAmount}>
                  {item.show_included && Number(item.price) === 0
                    ? 'Included'
                    : formatAmount(item.price)}
                </Text>
              </View>
            </View>
          ))}

          {/* Subtotal */}
          <View style={styles.subtotalRow}>
            <View style={styles.colSubtotalLabel}>
              <Text style={styles.subtotalText}>Subtotal</Text>
            </View>
            <View style={styles.colSubtotalValue}>
              <Text style={styles.subtotalText}>{formatAmount(subtotal)}</Text>
            </View>
          </View>

          {/* Optional Discount */}
          {discount > 0 && (
            <View style={styles.subtotalRow}>
              <View style={styles.colSubtotalLabel}>
                <Text style={styles.subtotalText}>Discount</Text>
              </View>
              <View style={styles.colSubtotalValue}>
                <Text style={styles.subtotalText}>- {formatAmount(discount)}</Text>
              </View>
            </View>
          )}

          {/* Total Due */}
          <View style={styles.totalDueRow}>
            <View style={styles.colTotalDueLabel}>
              <Text style={styles.totalDueLabelText}>
                {isInvoice ? 'TOTAL DUE' : 'TOTAL QUOTATION'}
              </Text>
            </View>
            <View style={styles.colTotalDueValue}>
              <Text style={styles.totalDueValueText}>LKR {formatAmount(grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* PAYMENT / BENEFICIARY DETAILS */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentHeading}>PAYMENT / BENEFICIARY DETAILS</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Bank Name: </Text>
            <Text style={styles.paymentValue}>{settings.bank_name || 'BOC (Bank of Ceylon)'}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Account Name: </Text>
            <Text style={styles.paymentValue}>{settings.bank_account_name || 'R.H.V.R.Pramod'}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Account No: </Text>
            <Text style={styles.paymentValue}>{settings.bank_account_number || '89121867'}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Branch: </Text>
            <Text style={styles.paymentValue}>{settings.bank_branch || 'Weligama'}</Text>
          </View>
        </View>

        {/* Optional Notes */}
        {(document.notes || settings.default_invoice_notes) && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesHeading}>Notes & Terms:</Text>
            <Text style={styles.notesText}>
              {document.notes || settings.default_invoice_notes}
            </Text>
          </View>
        )}

        {/* Thank You Note */}
        <View style={styles.thankYouContainer}>
          <Text style={styles.thankYouText}>
            Thank you for your business! If you have any questions regarding this invoice, please contact us.
          </Text>
        </View>

        {/* Footer at bottom of page */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {settings.business_name || 'CodeCrew'} Software Solutions
          </Text>
          <Text style={styles.footerText}>
            {isInvoice ? 'Invoice' : 'Quotation'} {invoiceFormattedNum}
          </Text>
        </View>
      </Page>
    </PdfDocument>
  );
};
