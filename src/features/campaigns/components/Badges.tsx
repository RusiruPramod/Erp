import React from 'react';
import {
  CampaignStatus,
  OrderStatus,
  CustomerPaymentStatus,
  SupplierPaymentStatus,
  LeadSource,
} from '../../../types';
import {
  PlayCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Archive,
  Calendar,
  Layers,
  Truck,
  RotateCcw,
  Check,
  Megaphone,
  MessageSquare,
  Users,
  UserCheck,
  Edit3,
  HelpCircle,
} from 'lucide-react';

export const CampaignStatusBadge: React.FC<{ status: CampaignStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'planned':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-sky-50 text-sky-700 border border-sky-200 ${sizeClasses}`}
        >
          <Calendar className="w-3 h-3 text-sky-600" />
          Planned
        </span>
      );
    case 'running':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Running
        </span>
      );
    case 'waiting_for_orders':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}
        >
          <Clock className="w-3 h-3 text-purple-600" />
          Waiting for Orders
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
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-neutral-100 text-neutral-800 border border-neutral-300 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3 h-3 text-neutral-500" />
          Closed
        </span>
      );
    case 'archived':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200 ${sizeClasses}`}
        >
          <Archive className="w-3 h-3 text-neutral-400" />
          Archived
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
    case 'new':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          New
        </span>
      );
    case 'quotation_pending':
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}
        >
          <Clock className="w-3 h-3" />
          Quotation Pending
        </span>
      );
    case 'confirmed':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-semibold bg-sky-50 text-sky-800 border border-sky-300 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3 h-3 text-sky-600" />
          Confirmed
        </span>
      );
    case 'in_progress':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}
        >
          <PlayCircle className="w-3 h-3" />
          In Progress
        </span>
      );
    case 'waiting_for_supplier':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-medium bg-orange-50 text-orange-800 border border-orange-200 ${sizeClasses}`}
        >
          <Layers className="w-3 h-3" />
          Waiting for Supplier
        </span>
      );
    case 'quality_check':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}
        >
          <Check className="w-3 h-3" />
          Quality Check
        </span>
      );
    case 'ready_for_delivery':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full font-semibold bg-teal-50 text-teal-700 border border-teal-200 ${sizeClasses}`}
        >
          <Truck className="w-3 h-3" />
          Ready for Delivery
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

export const CustomerPaymentBadge: React.FC<{
  status?: CustomerPaymentStatus;
  size?: 'sm' | 'md';
}> = ({ status = 'unpaid', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'fully_paid':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3 h-3" />
          Fully Paid
        </span>
      );
    case 'partially_paid':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-semibold bg-amber-100 text-amber-800 border border-amber-300 ${sizeClasses}`}
        >
          <Clock className="w-3 h-3" />
          Partially Paid
        </span>
      );
    case 'unpaid':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-semibold bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          <AlertCircle className="w-3 h-3" />
          Unpaid
        </span>
      );
    case 'not_invoiced':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 ${sizeClasses}`}
        >
          Not Invoiced
        </span>
      );
    case 'refunded':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}
        >
          <RotateCcw className="w-3 h-3" />
          Refunded
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-md font-medium bg-neutral-100 text-neutral-600 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};

export const SupplierPaymentBadge: React.FC<{
  status?: SupplierPaymentStatus;
  size?: 'sm' | 'md';
}> = ({ status = 'unpaid', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'fully_paid':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <Check className="w-3 h-3" />
          Supplier Paid
        </span>
      );
    case 'partially_paid':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}
        >
          <Clock className="w-3 h-3" />
          Supplier Partial
        </span>
      );
    case 'pending_cost_confirmation':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}
        >
          Pending Quote
        </span>
      );
    case 'unpaid':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}
        >
          Supplier Unpaid
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-md font-medium bg-neutral-100 text-neutral-600 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};

export const LeadSourceBadge: React.FC<{ source?: LeadSource; size?: 'sm' | 'md' }> = ({
  source = 'Direct Message',
  size = 'sm',
}) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (source) {
    case 'Facebook Campaign':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-semibold bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}
        >
          <Megaphone className="w-3 h-3" />
          Facebook Ad
        </span>
      );
    case 'Direct Message':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}
        >
          <MessageSquare className="w-3 h-3" />
          Direct Message
        </span>
      );
    case 'Friend / Referral':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}
        >
          <Users className="w-3 h-3" />
          Referral
        </span>
      );
    case 'Existing Customer':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-violet-50 text-violet-700 border border-violet-200 ${sizeClasses}`}
        >
          <UserCheck className="w-3 h-3" />
          Returning Client
        </span>
      );
    case 'Manual Entry':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 ${sizeClasses}`}
        >
          <Edit3 className="w-3 h-3" />
          Manual Entry
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-md font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 ${sizeClasses}`}
        >
          <HelpCircle className="w-3 h-3" />
          {source}
        </span>
      );
  }
};

export const IncompleteFinancialBadge: React.FC<{ size?: 'sm' | 'md' }> = ({ size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses}`}
      title="Supplier cost or client price is pending quote. Excluded from confirmed financial totals."
    >
      <AlertCircle className="w-3 h-3 text-amber-600" />
      Pending Quote (Excluded)
    </span>
  );
};
