import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`rounded-xl border border-border bg-white p-5 shadow-sm transition-all ${
        hoverEffect ? 'hover:shadow-md hover:border-neutral-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
