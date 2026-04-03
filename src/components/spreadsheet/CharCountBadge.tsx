'use client';

interface CharCountBadgeProps {
  current: number;
  max: number;
}

export default function CharCountBadge({ current, max }: CharCountBadgeProps) {
  const ratio = current / max;
  const colorClass =
    ratio > 1
      ? 'bg-red-100 text-red-700'
      : ratio > 0.9
        ? 'bg-amber-100 text-amber-700'
        : 'bg-gray-100 text-gray-600';

  return (
    <span className={`inline-flex rounded px-1 py-0.5 text-[10px] font-medium ${colorClass}`}>
      {current}/{max}
    </span>
  );
}
