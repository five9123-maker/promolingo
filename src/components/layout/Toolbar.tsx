'use client';

interface ToolbarProps {
  onTranslate: () => void;
  onDownloadCSV: () => void;
  isTranslating: boolean;
  assetCount: number;
  hasSourceText?: boolean;
}

export default function Toolbar({
  onTranslate,
  onDownloadCSV,
  isTranslating,
  assetCount,
  hasSourceText,
}: ToolbarProps) {
  const translateDisabled = isTranslating || assetCount === 0 || !hasSourceText;
  const translateTooltip = assetCount === 0
    ? '에셋을 먼저 추가해주세요'
    : !hasSourceText
      ? '원문을 입력해주세요'
      : undefined;

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
      <span className="text-xs text-gray-500">
        {assetCount}개 에셋
      </span>

      <div className="flex items-center gap-2">
        <div className="relative group">
          <button
            onClick={onTranslate}
            disabled={translateDisabled}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isTranslating ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                번역 중...
              </>
            ) : '번역하기'}
          </button>
          {translateTooltip && !isTranslating && (
            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2.5 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {translateTooltip}
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
            </div>
          )}
        </div>
        <div className="relative group">
          <button
            onClick={onDownloadCSV}
            disabled={assetCount === 0}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            CSV 다운로드
          </button>
          {assetCount === 0 && (
            <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2.5 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              에셋을 먼저 추가해주세요
              <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
