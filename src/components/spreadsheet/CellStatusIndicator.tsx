'use client';

import type { CellStatus } from '@/types/translation';

interface CellStatusIndicatorProps {
  status: CellStatus;
}

const STATUS_CONFIG: Record<CellStatus, { color: string; label: string }> = {
  normal: { color: 'bg-emerald-500', label: '정상' },
  warning: { color: 'bg-amber-500', label: '주의' },
  error: { color: 'bg-red-500', label: '초과' },
};

export default function CellStatusIndicator({ status }: CellStatusIndicatorProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${config.color}`} title={config.label} />
  );
}
