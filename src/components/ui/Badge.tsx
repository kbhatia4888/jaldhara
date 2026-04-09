import React from 'react';
import clsx from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'orange';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[#EDE4D4] text-[#463F2E]',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function getDealStageBadgeVariant(stage: string): BadgeVariant {
  switch (stage) {
    case 'Won': return 'success';
    case 'Lost': return 'danger';
    case 'Negotiation': return 'orange';
    case 'Proposal Sent': return 'purple';
    case 'Audit Done': return 'info';
    case 'Audit Scheduled': return 'info';
    case 'Contacted': return 'warning';
    case 'New': return 'default';
    default: return 'default';
  }
}

export function getBuildingStatusBadgeVariant(status: string): BadgeVariant {
  switch (status) {
    case 'Won': return 'success';
    case 'Lost': return 'danger';
    case 'Prospect': return 'info';
    case 'Warm Lead': return 'warning';
    case 'Cold': return 'default';
    default: return 'default';
  }
}

export function getCityStageBadgeVariant(stage: string): BadgeVariant {
  switch (stage) {
    case 'Scaling': return 'success';
    case 'First Revenue': return 'orange';
    case 'First Visits': return 'warning';
    case 'Researching': return 'info';
    case 'Not Started': return 'default';
    default: return 'default';
  }
}
