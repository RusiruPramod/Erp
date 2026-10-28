import React from 'react';
import { CampaignStatus, OrderStatus } from '../../../types';
import { PlayCircle, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export const CampaignStatusBadge: React.FC<{ status: CampaignStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'running':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Running
        </span>
      );
    case 'review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}
        >
          <Clock className="w-3 h-3 text-amber-600" />
          Closing / Review
        </span>
      );
    case 'closed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-neutral-100 text-neutral-700 border border-neutral-200 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3 h-3 text-neutral-500" />
          Closed
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 ${sizeClasses}`}
        >
          {status}
        </span>
      );
  }
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}
        >
          <Clock className="w-3 h-3" />
          Pending Confirmation
        </span>
      );
    case 'confirmed':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3 h-3" />
          Confirmed
        </span>
      );
    case 'in_progress':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}
        >
          <PlayCircle className="w-3 h-3" />
          In Progress
        </span>
      );
    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </span>
      );
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-medium bg-red-50 text-red-700 border border-red-200 ${sizeClasses}`}
        >
          <XCircle className="w-3 h-3" />
          Cancelled
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center rounded-full font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 ${sizeClasses}`}
        >
          {status}
        </span>
      );
  }
};

export const IncompleteFinancialBadge: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
      title="Supplier cost or client price is pending. Excluded from confirmed financial totals."
    >
      <AlertCircle className="w-3 h-3 text-rose-500" />
      Incomplete Pricing
    </span>
  );
};

