import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'brand'
    | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const variants = {
    default: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    brand: 'bg-[#FFF4E6] text-[#CC7000] border-[#FFD9B3]',
  };

  const sizes = {
    sm: 'text-[10px] font-semibold px-2 py-0.5',
    md: 'text-xs font-medium px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium capitalize ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export function getStatusBadge(status: string): React.ReactNode {
  switch (status?.toLowerCase()) {
    case 'active':
      return <Badge variant="brand">Active</Badge>;
    case 'completed':
    case 'paid':
    case 'accepted':
      return <Badge variant="success">{status.replace('_', ' ')}</Badge>;
    case 'partially_paid':
      return <Badge variant="warning">Partially Paid</Badge>;
    case 'draft':
      return <Badge variant="neutral">Draft</Badge>;
    case 'sent':
      return <Badge variant="info">Sent</Badge>;
    case 'cancelled':
    case 'rejected':
    case 'overdue':
      return <Badge variant="danger">{status.replace('_', ' ')}</Badge>;
    case 'admin':
      return <Badge variant="brand">Admin</Badge>;
    case 'member':
      return <Badge variant="neutral">Member</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
}
