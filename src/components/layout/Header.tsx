'use client';

import { useState } from 'react';
import AssetPresetDBModal from '@/components/settings/AssetPresetDBModal';
import StepBadge from '@/components/common/StepBadge';

interface HeaderProps {
  onTranslate: () => void;
  onDownloadCSV: () => void;
  isTranslating: boolean;
  assetCount: number;
  hasSourceText?: boolean;
  eventName: string;
  onEventNameChange: (name: string) => void;
  onShowTutorial?: () => void;
}

export default function Header({
  onTranslate,
  onDownloadCSV,
  isTranslating,
  assetCount,
  hasSourceText,
  eventName,
  onEventNameChange,
  onShowTutorial,
}: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

  const translateDisabled = isTranslating || assetCount === 0 || !hasSourceText;
  const translateTooltip = assetCount === 0
    ? '에셋을 먼저 추가해주세요'
    : !hasSourceText
      ? '원문을 입력해주세요'
      : undefined;

  return (
    <>
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="group relative">
            <h1 className="text-lg font-semibold text-gray-900">PromoLingo</h1>
            <div className="pointer-events-none absolute left-0 top-full z-30 mt-1.5 whitespace-nowrap rounded bg-gray-800 px-2.5 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              이벤트 프로모션 문구 초안 자동 생성 및 다국어 번역
              <div className="absolute left-4 top-0 -translate-y-full border-4 border-transparent border-b-gray-800" />
            </div>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            MVP
          </span>
          <input
            type="text"
            value={eventName}
            onChange={(e) => onEventNameChange(e.target.value)}
            placeholder="Event Title(자동생성)"
            className="rounded-md border border-gray-200 px-2 py-1 text-sm focus:border-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-200"
          />
        </div>

        <div className="flex items-center gap-2">
          <StepBadge step={5} label="번역하기" />
          <div className="relative group">
            <button
              onClick={onTranslate}
              disabled={translateDisabled}
              className="flex items-center gap-1.5 whitespace-nowrap rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isTranslating ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                  번역 중...
                </>
              ) : '번역하기'}
            </button>
            {translateTooltip && !isTranslating && (
              <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2.5 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {translateTooltip}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800" />
              </div>
            )}
          </div>
          <StepBadge step={7} label="CSV 다운로드" />
          <div className="relative group">
            <button
              onClick={onDownloadCSV}
              disabled={assetCount === 0}
              className="whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              CSV 다운로드
            </button>
            {assetCount === 0 && (
              <div className="pointer-events-none absolute left-1/2 top-full z-30 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2.5 py-1 text-[11px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                에셋을 먼저 추가해주세요
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800" />
              </div>
            )}
          </div>
          <button
            onClick={onShowTutorial}
            className="rounded-md border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            title="사용 가이드"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="rounded-md border border-gray-200 p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
            title="에셋 프리셋 설정"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <AssetPresetDBModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
