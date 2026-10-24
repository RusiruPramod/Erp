import React, { useState, useEffect } from 'react';
import { StudioProjectRow } from './types';
import { StudioRowDrawer } from './StudioRowDrawer';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import {
  Plus,
  Save,
  FileSpreadsheet,
  FileText,
  Search,
  Trash2,
  Edit2,
  TrendingUp,
  DollarSign,
  Users,
  Building,
  CheckCircle2,
  Share2,
  Printer,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { formatLKR, formatDate } from '../../lib/formatters';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { toast } from 'sonner';

const STORAGE_KEY = 'codecrew_studio_rows_v2';

const INITIAL_ROWS: StudioProjectRow[] = [
  {
    id: 'row-1',
    rowNumber: 1,
    date: '2026-10-15',
    projectName: 'Timer Pcb',
    clientCompany: 'InterMax (Pvt) Ltd.',
    clientName: 'Shamshard Marikkar',
    clientAttn: 'Shamshard Marikkar (Managing Director)',
    clientAddress: '435/2, Dutugemunu Rd, Koswatte\nBattaramulla, Sri Lanka.',
    clientPhone: '+94 77 207 8626',
    clientEmail: 'intermaxsrilanka@gmail.com',
    invoiceNumber: 'CC-INV-2026-001',
    refQuotation: 'CC-GWS-SYNC-2026-001',
    serviceTitle: 'Google Workspace File Sync Implementation',
    serviceDescription:
      'Configuring common drive for enabling shared folder access among 3 laptops. Includes technical review, user requirement gathering, architecture planning, system configuration, and handover walkthrough. One-time fixed fee as per agreed quotation.',
    brokerName: 'Hasangi',
    brokerFee: 5000,
    outsourceWorkerName: 'sahan',
    outsourceWorkerFee: 12500,
    myProfit: 12500,
    total: 30000,
    status: 'draft',
  },
  {
    id: 'row-2',
    rowNumber: 2,
    date: '2026-10-16',
    projectName: 'safty helmet',
    clientCompany: 'SafeTech Lanka Ltd.',
    clientName: 'Nimal Fernando',
    clientAttn: 'Nimal Fernando (Project Lead)',
    clientAddress: 'No. 28, Industrial Zone, Peliyagoda, Sri Lanka.',
    clientPhone: '+94 71 889 9123',
    clientEmail: 'info@safetech.lk',
    invoiceNumber: 'CC-INV-2026-002',
    refQuotation: 'CC-SAF-2026-002',
    serviceTitle: 'Safety Helmet Sensor Firmware & PCB Assembly',
    serviceDescription:
      'Firmware coding and hardware sensor calibration for safety helmet prototype. Tested with accelerometer alerts and buzzer integration.',
    brokerName: '',
    brokerFee: 0,
    outsourceWorkerName: 'malaka',
    outsourceWorkerFee: 5000,
    myProfit: 5000,
    total: 10000,
    status: 'draft',
  },
];

export const QuickStudioPage: React.FC = () => {
  // Load rows from local storage or fallback to INITIAL_ROWS
  const [rows, setRows] = useState<StudioProjectRow[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved studio rows', e);
    }
    return INITIAL_ROWS;
  });

  const [selectedId, setSelectedId] = useState<string>(rows[0]?.id || 'row-1');
  const [editingRow, setEditingRow] = useState<StudioProjectRow | null>(null);
  const [previewModalRow, setPreviewModalRow] = useState<StudioProjectRow | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Keep localStorage updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    } catch (e) {
      console.error('Failed to save studio rows', e);
    }
  }, [rows]);

  const selectedProject = rows.find(r => r.id === selectedId) || rows[0];

  // Live update cell in the spreadsheet
  const handleCellChange = (id: string, field: keyof StudioProjectRow, val: any) => {
    setRows(prevRows =>
      prevRows.map(row => {
        if (row.id !== id) return row;

        const updated = { ...row, [field]: val };

        // Real-time auto-calculation of total or profit
        if (field === 'brokerFee' || field === 'outsourceWorkerFee' || field === 'myProfit') {
          const b = field === 'brokerFee' ? Number(val) || 0 : Number(row.brokerFee) || 0;
          const o = field === 'outsourceWorkerFee' ? Number(val) || 0 : Number(row.outsourceWorkerFee) || 0;
          const p = field === 'myProfit' ? Number(val) || 0 : Number(row.myProfit) || 0;
          updated.total = b + o + p;
        } else if (field === 'total') {
          const t = Number(val) || 0;
          const b = Number(row.brokerFee) || 0;
          const o = Number(row.outsourceWorkerFee) || 0;
          updated.myProfit = Math.max(0, t - b - o);
        } else if (field === 'projectName' && !row.serviceTitle) {
          updated.serviceTitle = val;
        }

        return updated;
      })
    );
  };

  // Add new row with today's date
  const handleAddRow = () => {
    const today = new Date().toISOString().split('T')[0];
    const newSeq = rows.length + 1;
    const invNum = `CC-INV-2026-${String(newSeq).padStart(3, '0')}`;

    const newRow: StudioProjectRow = {
      id: `row-${Date.now()}`,
      rowNumber: newSeq,
      date: today,
      projectName: `New Project ${newSeq}`,
      clientCompany: 'Client Company (Pvt) Ltd.',
      clientName: 'Contact Person',
      clientAttn: 'Managing Director',
      clientAddress: 'Colombo, Sri Lanka',
      clientPhone: '+94 77 000 0000',
      clientEmail: 'contact@example.com',
      invoiceNumber: invNum,
      refQuotation: `CC-QUO-2026-${String(newSeq).padStart(3, '0')}`,
      serviceTitle: 'Software & Technical Services',
      serviceDescription:
        'Technical implementation, requirement gathering, system architecture, configuration and testing as agreed.',
      brokerName: '',
      brokerFee: 0,
      outsourceWorkerName: '',
      outsourceWorkerFee: 0,
      myProfit: 15000,
      total: 15000,
      status: 'draft',
    };

    setRows(prev => [newRow, ...prev]);
    setSelectedId(newRow.id);
    toast.success('Added new project row to spreadsheet');
  };

  // Delete row
  const handleDeleteRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (rows.length <= 1) {
      toast.error('At least one project row must remain in the sheet');
      return;
    }
    const remaining = rows.filter(r => r.id !== id);
    setRows(remaining);
    if (selectedId === id) {
      setSelectedId(remaining[0].id);
    }
    toast.info('Row removed');
  };

  // Sync to database if Supabase is connected
  const handleSyncToDatabase = async () => {
    setIsSyncing(true);
    try {
      if (isSupabaseConfigured) {
        for (const r of rows) {
          // 1. Ensure customer
          let customerId = '00000000-0000-0000-0000-000000000005';
          const { data: custData } = await supabase
            .from('customers')
            .select('id')
            .eq('name', r.clientCompany || r.clientName)
            .maybeSingle();

          if (custData) {
            customerId = custData.id;
          }

          // 2. Upsert project
          await supabase.from('projects').upsert(
            {
              name: r.projectName,
              customer_id: customerId,
              project_date: r.date,
              price: r.total,
              outsourcer_name: r.outsourceWorkerName || null,
              outsourcer_cost: r.outsourceWorkerFee || 0,
              broker_name: r.brokerName || null,
              broker_commission: r.brokerFee || 0,
              status: 'active',
              notes: r.serviceDescription,
            },
            { onConflict: 'name' }
          );
        }
        toast.success('Successfully synced sheet projects to Supabase ERP!');
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
        toast.success('Saved spreadsheet and invoices to local ERP storage!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to sync to database');
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate summary metrics
  const totalRevenue = rows.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
  const totalProfit = rows.reduce((acc, r) => acc + (Number(r.myProfit) || 0), 0);
  const totalOutsource = rows.reduce((acc, r) => acc + (Number(r.outsourceWorkerFee) || 0), 0);
  const totalBroker = rows.reduce((acc, r) => acc + (Number(r.brokerFee) || 0), 0);

  const filteredRows = rows.filter(
    r =>
      r.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.clientCompany && r.clientCompany.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.outsourceWorkerName && r.outsourceWorkerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.brokerName && r.brokerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] -m-4 md:-m-8 bg-[#F4F4F5] overflow-hidden">
      {/* Top Banner: Quick Financial Indicators & Actions */}
      <header className="bg-white border-b border-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-neutral-900 leading-none flex items-center gap-2">
                Project & Invoice Studio
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Spreadsheet Flow
                </span>
              </h1>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Fast Google Sheets data entry • Double-click row for details • Click eye icon for Print & PDF
              </p>
            </div>
          </div>
        </div>

        {/* Financial KPI chips */}
        <div className="hidden xl:flex items-center gap-4 text-xs bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-200">
          <div>
            <span className="text-neutral-500">Revenue:</span>{' '}
            <span className="font-bold text-neutral-900 font-mono">{formatLKR(totalRevenue)}</span>
          </div>
          <div className="h-4 w-px bg-neutral-300"></div>
          <div>
            <span className="text-neutral-500">My Profit:</span>{' '}
            <span className="font-bold text-emerald-700 font-mono">{formatLKR(totalProfit)}</span>
          </div>
          <div className="h-4 w-px bg-neutral-300"></div>
          <div>
            <span className="text-neutral-500">Outsource:</span>{' '}
            <span className="font-bold text-blue-700 font-mono">{formatLKR(totalOutsource)}</span>
          </div>
          <div className="h-4 w-px bg-neutral-300"></div>
          <div>
            <span className="text-neutral-500">Broker:</span>{' '}
            <span className="font-bold text-amber-700 font-mono">{formatLKR(totalBroker)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Encapsulated Preview & Print Invoice Button */}
          {selectedProject && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPreviewModalRow(selectedProject)}
              className="text-xs font-semibold text-neutral-800 border-neutral-300 hover:bg-neutral-100 shadow-2xs"
              leftIcon={<Eye className="w-3.5 h-3.5 text-[#FF8C00]" />}
            >
              Preview & Print Invoice
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleAddRow}
            className="text-xs font-medium"
            leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Add Row
          </Button>

          <Button
            size="sm"
            onClick={handleSyncToDatabase}
            isLoading={isSyncing}
            className="bg-[#111111] hover:bg-neutral-800 text-white text-xs font-medium"
            leftIcon={<Save className="w-3.5 h-3.5 text-[#FF8C00]" />}
          >
            Save & Sync
          </Button>
        </div>
      </header>

      {/* Main Full-Width Google Spreadsheet Table View */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Spreadsheet toolbar */}
        <div className="bg-[#F8F9FA] border-b border-neutral-300 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs select-none shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-neutral-700">Sheet View:</span>
            <span className="bg-white border border-neutral-300 px-2.5 py-1 rounded text-xs font-mono font-medium text-neutral-800">
              Projects & Invoices ({rows.length} rows)
            </span>
            <span className="hidden md:inline-block text-[11px] text-neutral-400">
              💡 Tip: Double-click any row to open Invoice Details
            </span>
          </div>

          <div className="flex items-center gap-2 w-64 md:w-80">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search project, client, worker, broker..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded pl-8 pr-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF8C00]"
              />
            </div>
          </div>
        </div>

        {/* Full-Width Table Container */}
        <div className="flex-1 overflow-auto bg-[#FFFFFF]">
          <table className="w-full border-collapse text-xs select-text font-sans">
            <thead className="sticky top-0 bg-[#F3F4F6] text-neutral-700 font-semibold border-b border-neutral-300 z-10 shadow-xs">
              <tr>
                <th className="w-12 px-2 py-2.5 border-r border-b border-neutral-300 text-center font-mono text-[11px] text-neutral-500 bg-[#E5E7EB]">
                  #
                </th>
                <th className="w-32 px-3 py-2.5 border-r border-b border-neutral-300 text-left font-medium">
                  Date <span className="text-[10px] text-neutral-400">(auto/edit)</span>
                </th>
                <th className="min-w-[180px] px-3 py-2.5 border-r border-b border-neutral-300 text-left font-medium">
                  project
                </th>
                <th className="min-w-[180px] px-3 py-2.5 border-r border-b border-neutral-300 text-left font-medium">
                  client / company
                </th>
                <th className="min-w-[150px] px-3 py-2.5 border-r border-b border-neutral-300 text-left font-medium">
                  broker
                </th>
                <th className="min-w-[160px] px-3 py-2.5 border-r border-b border-neutral-300 text-left font-medium">
                  outsource worker
                </th>
                <th className="w-36 px-3 py-2.5 border-r border-b border-neutral-300 text-right font-medium">
                  my profit (Rusiru)
                </th>
                <th className="w-36 px-3 py-2.5 border-r border-b border-neutral-300 text-right font-bold text-neutral-900 bg-neutral-200/50">
                  Total (LKR)
                </th>
                <th className="w-32 px-3 py-2.5 border-r border-b border-neutral-300 text-center font-mono text-neutral-600">
                  Invoice #
                </th>
                <th className="w-28 px-3 py-2.5 border-b border-neutral-300 text-center font-medium text-neutral-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, idx) => {
                const isSelected = row.id === selectedId;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    onDoubleClick={() => setEditingRow(row)}
                    className={`cursor-pointer transition-colors border-b border-neutral-200 group ${
                      isSelected
                        ? 'bg-[#EBF5FB] ring-1 ring-inset ring-blue-500/40'
                        : idx % 2 === 0
                        ? 'bg-white hover:bg-neutral-50'
                        : 'bg-[#FAFAFA] hover:bg-neutral-50'
                    }`}
                  >
                    {/* Row index */}
                    <td className="px-2 py-2 border-r border-neutral-200 text-center font-mono text-neutral-400 bg-neutral-100/50 group-hover:bg-neutral-200/50">
                      {idx + 1}
                    </td>

                    {/* Date */}
                    <td className="px-2 py-1.5 border-r border-neutral-200">
                      <input
                        type="date"
                        value={row.date}
                        onChange={e => handleCellChange(row.id, 'date', e.target.value)}
                        className="w-full bg-transparent border-0 text-xs text-neutral-800 p-1 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded outline-none font-mono"
                      />
                    </td>

                    {/* Project Name */}
                    <td className="px-2 py-1.5 border-r border-neutral-200">
                      <input
                        type="text"
                        value={row.projectName}
                        onChange={e => handleCellChange(row.id, 'projectName', e.target.value)}
                        placeholder="Project title..."
                        className="w-full bg-transparent border-0 text-xs font-semibold text-neutral-900 p-1 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded outline-none"
                      />
                    </td>

                    {/* Client / Company */}
                    <td className="px-2 py-1.5 border-r border-neutral-200">
                      <input
                        type="text"
                        value={row.clientCompany || row.clientName}
                        onChange={e => {
                          handleCellChange(row.id, 'clientCompany', e.target.value);
                          handleCellChange(row.id, 'clientName', e.target.value);
                        }}
                        placeholder="Client company..."
                        className="w-full bg-transparent border-0 text-xs text-neutral-800 p-1 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded outline-none"
                      />
                    </td>

                    {/* Broker: amount + name */}
                    <td className="px-2 py-1.5 border-r border-neutral-200">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={row.brokerFee === 0 ? '' : row.brokerFee}
                          placeholder="0"
                          onChange={e => handleCellChange(row.id, 'brokerFee', Number(e.target.value))}
                          className="w-16 bg-transparent border-0 text-xs font-mono text-neutral-800 p-1 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded outline-none"
                        />
                        <input
                          type="text"
                          value={row.brokerName || ''}
                          placeholder="(Hasangi)"
                          onChange={e => handleCellChange(row.id, 'brokerName', e.target.value)}
                          className="w-24 bg-transparent border-0 text-[11px] text-amber-700 italic p-1 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded outline-none"
                        />
                      </div>
                    </td>

                    {/* Outsource worker: amount + name */}
                    <td className="px-2 py-1.5 border-r border-neutral-200">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={row.outsourceWorkerFee === 0 ? '' : row.outsourceWorkerFee}
                          placeholder="0"
                          onChange={e =>
                            handleCellChange(row.id, 'outsourceWorkerFee', Number(e.target.value))
                          }
                          className="w-16 bg-transparent border-0 text-xs font-mono text-neutral-800 p-1 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded outline-none"
                        />
                        <input
                          type="text"
                          value={row.outsourceWorkerName || ''}
                          placeholder="(sahan)"
                          onChange={e => handleCellChange(row.id, 'outsourceWorkerName', e.target.value)}
                          className="w-24 bg-transparent border-0 text-[11px] text-blue-700 italic p-1 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded outline-none"
                        />
                      </div>
                    </td>

                    {/* My Profit (Rusiru) */}
                    <td className="px-2 py-1.5 border-r border-neutral-200 text-right">
                      <input
                        type="number"
                        value={row.myProfit === 0 ? '' : row.myProfit}
                        placeholder="0"
                        onChange={e => handleCellChange(row.id, 'myProfit', Number(e.target.value))}
                        className="w-full text-right bg-transparent border-0 text-xs font-mono font-bold text-emerald-700 p-1 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded outline-none"
                      />
                    </td>

                    {/* Total */}
                    <td className="px-3 py-1.5 border-r border-neutral-200 text-right font-mono font-black text-neutral-900 bg-neutral-100/40">
                      <input
                        type="number"
                        value={row.total}
                        onChange={e => handleCellChange(row.id, 'total', Number(e.target.value))}
                        className="w-full text-right bg-transparent border-0 text-xs font-mono font-black text-neutral-950 p-1 focus:bg-white focus:ring-1 focus:ring-blue-400 rounded outline-none"
                      />
                    </td>

                    {/* Invoice Number */}
                    <td className="px-2 py-1.5 border-r border-neutral-200 text-center font-mono text-[11px] text-neutral-600">
                      {row.invoiceNumber}
                    </td>

                    {/* Actions: Eye (Preview & Print Modal), Edit, Delete */}
                    <td className="px-2 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* EYE ICON: Preview & Print Modal */}
                        <button
                          type="button"
                          title="Preview & Print Invoice"
                          onClick={e => {
                            e.stopPropagation();
                            setPreviewModalRow(row);
                          }}
                          className="p-1 rounded text-neutral-600 hover:text-[#FF8C00] hover:bg-orange-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* EDIT ICON: Opens Invoice Details */}
                        <button
                          type="button"
                          title="Edit Invoice Details"
                          onClick={e => {
                            e.stopPropagation();
                            setEditingRow(row);
                          }}
                          className="p-1 rounded text-neutral-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* DELETE ICON */}
                        <button
                          type="button"
                          title="Delete Row"
                          onClick={e => handleDeleteRow(row.id, e)}
                          className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Google Sheets Tab Bar */}
        <div className="bg-[#F1F3F4] border-t border-neutral-300 px-4 py-2 flex items-center justify-between text-xs select-none shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center justify-center w-6 h-6 rounded hover:bg-neutral-300 text-neutral-700 font-bold transition-colors"
              title="Add new sheet row"
            >
              +
            </button>
            <div className="flex items-center gap-1.5 bg-white border border-neutral-300 border-b-2 border-b-emerald-600 px-3 py-1 rounded text-xs font-medium text-neutral-800 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Sheet1</span>
            </div>
          </div>

          <div className="text-[11px] text-neutral-600 flex items-center gap-3">
            <span>Selected: <strong className="text-neutral-900">{selectedProject?.projectName}</strong> ({selectedProject?.invoiceNumber})</span>
            <button
              type="button"
              onClick={() => setPreviewModalRow(selectedProject)}
              className="text-xs text-[#FF8C00] hover:underline font-bold flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview & Print
            </button>
            <span className="text-neutral-300">|</span>
            <button
              type="button"
              onClick={() => setEditingRow(selectedProject)}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Edit Details
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over / Modal for detailed client & invoice customization */}
      <StudioRowDrawer
        isOpen={Boolean(editingRow)}
        onClose={() => setEditingRow(null)}
        row={editingRow}
        onSave={updated => {
          setRows(prev => prev.map(r => (r.id === updated.id ? updated : r)));
          toast.success('Project and invoice details updated');
        }}
        onPrint={updated => {
          setEditingRow(null);
          setPreviewModalRow(updated);
        }}
      />

      {/* Encapsulated Preview & Print Invoice Modal */}
      <InvoicePreviewModal
        isOpen={Boolean(previewModalRow)}
        onClose={() => setPreviewModalRow(null)}
        project={previewModalRow}
      />
    </div>
  );
};
