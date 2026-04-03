'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface SourceOptionsPopupProps {
  assetType: string;
  currentText?: string;
  sourceLanguage: string;
  anchorRect: DOMRect;
  eventContext: {
    eventName?: string;
    eventType: string;
    toneKeywords: string;
    targetAudience: string;
    keySellingPoints: string;
  };
  onSelect: (text: string) => void;
  onClose: () => void;
}

export default function SourceOptionsPopup({
  assetType,
  currentText,
  sourceLanguage,
  anchorRect,
  eventContext,
  onSelect,
  onClose,
}: SourceOptionsPopupProps) {
  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const fetchOptions = useCallback(async () => {
    setIsLoading(true);
    setOptions([]);
    try {
      const res = await fetch('/api/source-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType,
          currentText,
          sourceLanguage,
          context: eventContext,
        }),
      });
      const data = await res.json();
      setOptions(data.options || []);
    } catch {
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [assetType, currentText, sourceLanguage, eventContext]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const width = Math.max(280, anchorRect.width);
  const top = anchorRect.bottom + 4;
  const rawLeft = anchorRect.left;
  const left = typeof window !== 'undefined'
    ? Math.min(rawLeft, window.innerWidth - width - 8)
    : rawLeft;

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', top, left, width, zIndex: 9999 }}
      className="rounded-lg border border-gray-200 bg-white shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <span className="text-[11px] font-semibold text-gray-600">✨ AI 카피 추천</span>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchOptions}
            disabled={isLoading}
            className="rounded p-1 text-[11px] text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-40"
            title="다시 생성"
          >
            ↻
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-[11px] text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ×
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="p-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-5">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
            <span className="text-xs text-gray-400">생성 중...</span>
          </div>
        ) : options.length === 0 ? (
          <p className="py-4 text-center text-xs text-gray-400">옵션을 생성할 수 없습니다</p>
        ) : (
          <div className="space-y-1">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  onSelect(opt);
                  onClose();
                }}
                className="w-full rounded-md border border-transparent px-3 py-2 text-left text-xs text-gray-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
