import React from 'react';
import { getStatusColor } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
        getStatusColor(status)
      )}
    >
      {status.replace('_', ' ')}
    </span>
  );
}