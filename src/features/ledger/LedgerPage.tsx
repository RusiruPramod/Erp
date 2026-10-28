import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Download,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { TableSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { DateRangePicker, DateRange } from '../../components/ui/DateRangePicker';
import { LedgerItem } from '../../types';
import { formatLKR, formatDate } from '../../lib/formatters';
import { exportToCsv } from '../../lib/csv';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { startOfYear, endOfYear, format } from 'date-fns';

export const LedgerPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: format(startOfYear(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfYear(new Date()), 'yyyy-MM-dd'),
  });

  const { data: ledgerEntries = [], isLoading } = useQuery<LedgerItem[]>({
    queryKey: ['ledger', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      if (!isSupabaseConfigured) {
        return [];
      }

      const { data, error } = await supabase.rpc('ledger', {
        from_date: dateRange.startDate,
        to_date: dateRange.endDate,
      });

      if (error) throw error;
      return (data as LedgerItem[]) || [];
    },
  });

  const handleExportCsv = () => {
    const rows = ledgerEntries.map(item => ({
      date: formatDate(item.entry_date),
      type: item.type.toUpperCase(),
      title: item.title,
      project: item.project_name || 'General Overhead',
      category: item.category_or_platform || '-',
      amount: item.amount,
      running_balance: item.running_balance,
    }));

    exportToCsv(
      `codecrew-ledger-${dateRange.startDate}-to-${dateRange.endDate}`,
      rows,
      [
        { key: 'date', label: 'Date' },
        { key: 'type', label: 'Entry Type' },
        { key: 'title', label: 'Description / Title' },
        { key: 'project', label: 'Project' },
        { key: 'category', label: 'Category / Platform' },
        { key: 'amount', label: 'Amount (LKR)' },
        { key: 'running_balance', label: 'Running Balance (LKR)' },
      ]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">
            Financial Ledger
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Unified chronological ledger of every payment received & expense incurred.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download className="w-4 h-4" />}
          onClick={handleExportCsv}
          disabled={ledgerEntries.length === 0}
        >
          Export CSV
        </Button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-3 rounded-xl border border-border shadow-xs">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Ledger Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : ledgerEntries.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" />}
          title="No ledger entries in this period"
          description="Log income payments or project expenses to view your unified transaction timeline."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Transaction (LKR)</TableHead>
              <TableHead className="text-right">Running Balance (LKR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ledgerEntries.map(entry => {
              const isIncome = entry.type === 'income';
              return (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs text-neutral-600 font-medium">
                    {formatDate(entry.entry_date)}
                  </TableCell>
                  <TableCell>
                    {isIncome ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <ArrowDownLeft className="w-3 h-3" />
                        Income
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-700 border border-neutral-200">
                        <ArrowUpRight className="w-3 h-3" />
                        Expense
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-neutral-900">
                    {entry.title}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-600">
                    {entry.project_name || (
                      <span className="text-neutral-400 italic">General</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">
                    {entry.category_or_platform || '-'}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-xs font-bold ${
                      isIncome ? 'text-emerald-600' : 'text-neutral-900'
                    }`}
                  >
                    {isIncome ? `+ ${formatLKR(entry.amount)}` : `- ${formatLKR(entry.amount)}`}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-black text-neutral-900">
                    {formatLKR(entry.running_balance)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
