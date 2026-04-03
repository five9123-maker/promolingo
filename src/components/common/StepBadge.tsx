'use client';

interface StepBadgeProps {
  step: number;
  label: string;
}

export default function StepBadge({ step, label }: StepBadgeProps) {
  return (
    <div className="group/step relative inline-flex shrink-0">
      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold leading-none text-white">
        {step}
      </span>
      <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-1.5 -translate-y-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover/step:opacity-100">
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
      </div>
    </div>
  );
}
