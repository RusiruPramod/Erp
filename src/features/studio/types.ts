export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface StudioProjectRow {
  id: string;
  rowNumber?: number;
  date: string;
  dueDate?: string;
  projectName: string;
  
  // Client / Billing Information
  clientName: string;
  clientCompany?: string;
  clientAttn?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  
  // Invoice Information
  invoiceNumber: string;
  refQuotation?: string;
  serviceTitle: string;
  serviceDescription: string;
  
  // Itemized line items
  items?: InvoiceItem[];
  subtotal?: number;
  discount?: number;
  tax?: number;

  // Profit / Financial Distribution (CodeCrew ERP core)
  brokerName?: string;
  brokerFee: number;
  
  outsourceWorkerName?: string;
  outsourceWorkerFee: number;
  
  myProfit: number;
  total: number;
  
  // Status & Notes
  status: 'draft' | 'sent' | 'paid';
  notes?: string;
}

