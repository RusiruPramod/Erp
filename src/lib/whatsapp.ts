import { normalizePhone } from './phone';
import { formatLKR } from './formatters';

export interface WhatsAppMessageParams {
  customerName: string;
  customerPhone: string;
  docType: 'invoice' | 'quotation';
  docNumber: string;
  projectName: string;
  total: number;
  shareUrl: string;
  template?: string;
}

/**
 * Builds the WhatsApp message text from template with variable replacement
 */
export function buildWhatsAppMessage(params: WhatsAppMessageParams): string {
  const {
    customerName,
    docType,
    docNumber,
    projectName,
    total,
    shareUrl,
    template,
  } = params;

  const defaultTemplate =
    'Hello {customer}, please find your {type} {number} for {project}. Total: {total}. View/download: {link}\n\nThank you,\nCodeCrew';

  const tpl = template && template.trim().length > 0 ? template : defaultTemplate;
  const docTypeLabel = docType === 'invoice' ? 'Invoice' : 'Quotation';

  return tpl
    .replace(/\{customer\}/g, customerName)
    .replace(/\{type\}/g, docTypeLabel)
    .replace(/\{Invoice\/Quotation\}/g, docTypeLabel)
    .replace(/\{number\}/g, docNumber)
    .replace(/\{project\}/g, projectName)
    .replace(/\{total\}/g, formatLKR(total))
    .replace(/\{link\}/g, shareUrl);
}

/**
 * Generates the wa.me click-to-chat URL
 */
export function generateWhatsAppUrl(params: WhatsAppMessageParams): string {
  const normalized = normalizePhone(params.customerPhone);
  const message = buildWhatsAppMessage(params);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
