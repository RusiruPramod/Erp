import React from 'react';
import {
  Document as PdfDocument,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';
import { Document as DocumentType, DocumentItem, Customer, Settings, Project } from '../types';
import { formatLKR, formatDate } from './formatters';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    color: '#111111',
    backgroundColor: '#FFFFFF',
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoCode: {
    fontSize: 26,
    fontWeight: 'black',
    color: '#FF8C00',
  },
  logoCrew: {
    fontSize: 26,
    fontWeight: 'black',
    color: '#111111',
  },
  docTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111111',
    letterSpacing: 1.5,
    textAlign: 'right',
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 20,
  },
  column: {
    flex: 1,
  },
  columnHeading: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111111',
    textTransform: 'uppercase',
    paddingBottom: 4,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  metaContainer: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    padding: 10,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  metaValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111111',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#111111',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
    minHeight: 24,
    alignItems: 'center',
  },
  tableHeaderRow: {
    backgroundColor: '#F0F0F0',
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
    minHeight: 26,
  },
  colTask: {
    width: '25%',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#111111',
  },
  colDesc: {
    width: '45%',
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#111111',
  },
  colHours: {
    width: '15%',
    padding: 6,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#111111',
  },
  colPrice: {
    width: '15%',
    padding: 6,
    textAlign: 'right',
  },
  thText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111111',
    textTransform: 'uppercase',
  },
  cellText: {
    fontSize: 9,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 16,
  },
  bankBox: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 4,
    padding: 10,
  },
  bankHeading: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111111',
    textTransform: 'uppercase',
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  bankRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  bankLabel: {
    fontSize: 8.5,
    color: '#666666',
    width: '38%',
  },
  bankValue: {
    fontSize: 8.5,
    color: '#111111',
    fontWeight: 'bold',
    width: '62%',
  },
  totalsBox: {
    width: '42%',
    justifyContent: 'flex-start',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalRowDue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#111111',
    marginTop: 4,
  },
  totalDueLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111111',
  },
  totalDueValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF8C00',
  },
  notesBlock: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  notesHeading: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#666666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 8.5,
    color: '#444444',
    lineHeight: 1.4,
  },
  regularText: {
    fontSize: 9,
    color: '#222222',
    marginBottom: 2,
  },
  boldText: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#111111',
    marginBottom: 2,
  },
});

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

  // Calculate total hours
  const totalHours = items.reduce((acc, item) => acc + (Number(item.hours) || 0), 0);
  const subtotal = items.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  const discount = Number(document.discount) || 0;
  const grandTotal = Math.max(0, subtotal - discount);

  return (
    <PdfDocument>
      <Page size="A4" style={styles.page}>
        {/* Header: Logo on left, Title on right */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoCode}>Code</Text>
            <Text style={styles.logoCrew}>Crew</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>{title}</Text>
          </View>
        </View>

        {/* Two Columns: From & Bill To */}
        <View style={styles.columns}>
          <View style={styles.column}>
            <Text style={styles.columnHeading}>From</Text>
            <Text style={styles.boldText}>{settings.business_name || 'CodeCrew'}</Text>
            {settings.owner_name ? <Text style={styles.regularText}>{settings.owner_name}</Text> : null}
            {settings.mobile ? <Text style={styles.regularText}>Mobile: {settings.mobile}</Text> : null}
            {settings.email ? <Text style={styles.regularText}>Email: {settings.email}</Text> : null}
            {settings.address ? <Text style={styles.regularText}>{settings.address}</Text> : null}
          </View>

          <View style={styles.column}>
            <Text style={styles.columnHeading}>Bill To</Text>
            <Text style={styles.boldText}>{customer.name}</Text>
            {customer.company ? <Text style={styles.regularText}>{customer.company}</Text> : null}
            {customer.phone ? <Text style={styles.regularText}>Phone: {customer.phone}</Text> : null}
            {customer.email ? <Text style={styles.regularText}>Email: {customer.email}</Text> : null}
            {customer.address ? <Text style={styles.regularText}>{customer.address}</Text> : null}
          </View>
        </View>

        {/* Meta Block: Number, Dates, Project */}
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>{isInvoice ? 'Invoice No.' : 'Quotation No.'}</Text>
            <Text style={styles.metaValue}>{document.number}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Issue Date</Text>
            <Text style={styles.metaValue}>{formatDate(document.issue_date)}</Text>
          </View>
          {isInvoice && document.due_date ? (
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Due Date</Text>
              <Text style={styles.metaValue}>{formatDate(document.due_date)}</Text>
            </View>
          ) : null}
          <View style={[styles.metaItem, { flex: 1.5 }]}>
            <Text style={styles.metaLabel}>Project</Text>
            <Text style={styles.metaValue}>{project?.name || '-'}</Text>
          </View>
        </View>

        {/* Line Items Table with 1px black borders */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeaderRow]}>
            <View style={styles.colTask}>
              <Text style={styles.thText}>Service Task</Text>
            </View>
            <View style={styles.colDesc}>
              <Text style={styles.thText}>Description Notes</Text>
            </View>
            <View style={styles.colHours}>
              <Text style={styles.thText}>Est. Hours</Text>
            </View>
            <View style={styles.colPrice}>
              <Text style={styles.thText}>Price (LKR)</Text>
            </View>
          </View>

          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;
            return (
              <View
                key={item.id || idx}
                style={[
                  styles.tableRow,
                  isLast ? { borderBottomWidth: 0 } : {},
                ]}
              >
                <View style={styles.colTask}>
                  <Text style={[styles.cellText, { fontWeight: 'bold' }]}>{item.task}</Text>
                </View>
                <View style={styles.colDesc}>
                  <Text style={styles.cellText}>{item.description || '-'}</Text>
                </View>
                <View style={styles.colHours}>
                  <Text style={styles.cellText}>
                    {item.hours !== null && item.hours !== undefined ? `${item.hours}h` : '-'}
                  </Text>
                </View>
                <View style={styles.colPrice}>
                  <Text style={[styles.cellText, { fontWeight: 'bold' }]}>
                    {item.show_included && Number(item.price) === 0
                      ? 'Included'
                      : Number(item.price).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bottom Section: Left = Bank Details, Right = Totals */}
        <View style={styles.bottomSection}>
          <View style={styles.bankBox}>
            <Text style={styles.bankHeading}>Payment / Beneficiary Details</Text>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Bank:</Text>
              <Text style={styles.bankValue}>{settings.bank_name || '-'}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Branch:</Text>
              <Text style={styles.bankValue}>{settings.bank_branch || '-'}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Account Name:</Text>
              <Text style={styles.bankValue}>{settings.bank_account_name || '-'}</Text>
            </View>
            <View style={styles.bankRow}>
              <Text style={styles.bankLabel}>Account No:</Text>
              <Text style={styles.bankValue}>{settings.bank_account_number || '-'}</Text>
            </View>
          </View>

          <View style={styles.totalsBox}>
            {totalHours > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.regularText}>Total Hours:</Text>
                <Text style={styles.boldText}>{totalHours} hrs</Text>
              </View>
            )}
            {discount > 0 && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.regularText}>Subtotal:</Text>
                  <Text style={styles.boldText}>{formatLKR(subtotal)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.regularText}>Discount:</Text>
                  <Text style={[styles.boldText, { color: '#DC2626' }]}>- {formatLKR(discount)}</Text>
                </View>
              </>
            )}
            <View style={styles.totalRowDue}>
              <Text style={styles.totalDueLabel}>
                {isInvoice ? 'Total Amount Due:' : 'Total Quotation:'}
              </Text>
              <Text style={styles.totalDueValue}>{formatLKR(grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Notes block */}
        {(document.notes || settings.default_invoice_notes) && (
          <View style={styles.notesBlock}>
            <Text style={styles.notesHeading}>Notes & Terms:</Text>
            <Text style={styles.notesText}>
              {document.notes || settings.default_invoice_notes}
            </Text>
          </View>
        )}
      </Page>
    </PdfDocument>
  );
};
