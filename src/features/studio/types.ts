export interface StudioProjectRow {
  id: string;
  rowNumber?: number;
  date: string;
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
  
  // Profit / Financial Distribution
  brokerName?: string;
  brokerFee: number;
  
  outsourceWorkerName?: string;
  outsourceWorkerFee: number;
  
  myProfit: number;
  total: number;
  
  // Status
  status: 'draft' | 'sent' | 'paid';
  notes?: string;
}
