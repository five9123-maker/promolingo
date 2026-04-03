'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { useMemo, useState, useCallback } from 'react';
import type { Asset } from '@/types/event';
import type { TranslationGrid } from '@/types/translation';
import { ASSET_TYPE_MAP } from '@/constants/assetTypes';
import { useAssetPresetDB } from '@/hooks/useAssetPresetDB';
import EditableCell from './EditableCell';
import ColumnHeader from './ColumnHeader';
import StepBadge from '@/components/common/StepBadge';
import SourceOptionsPopup from './SourceOptionsPopup';

interface EventContext {
  eventType: string;
  toneKeywords: string;
  targetAudience: string;
  keySellingPoints: string;
}

interface SpreadsheetGridProps {
  assets: Asset[];
  sourceLanguage: string;
  targetLanguages: string[];
  translations: TranslationGrid;
  isLoading?: boolean;
  eventContext?: EventContext;
  eventName?: string;
  onSourceTextChange: (assetId: string, text: string) => void;
  onTranslationChange: (assetId: string, language: string, text: string) => void;
  onMaxLengthChange: (assetId: string, maxLength: number) => void;
  onLangMaxLengthChange: (assetId: string, langCode: string, maxLength: number) => void;
  onRemoveAsset: (assetId: string) => void;
  onRetranslateError?: (message: string) => void;
}

interface RowData {
  asset: Asset;
}

const DEFAULT_CONTEXT: EventContext = {
  eventType: '일반 프로모션',
  toneKeywords: '기본',
  targetAudience: '일반',
  keySellingPoints: '',
};

export default function SpreadsheetGrid({
  assets,
  sourceLanguage,
  targetLanguages,
  translations,
  isLoading,
  eventContext = DEFAULT_CONTEXT,
  eventName,
  onSourceTextChange,
  onTranslationChange,
  onMaxLengthChange,
  onLangMaxLengthChange,
  onRemoveAsset,
  onRetranslateError,
}: SpreadsheetGridProps) {
  const { db: presetDB } = useAssetPresetDB();
  const [loadingCells, setLoadingCells] = useState<Record<string, boolean>>({});
  const [optionsState, setOptionsState] = useState<{ assetId: string; rect: DOMRect } | null>(null);

  const handleRetranslate = useCallback(
    async (asset: Asset, langCode: string, mode: 'refresh' | 'shorten') => {
      const cellKey = `${asset.id}_${langCode}`;
      const langMax = asset.langMaxLengths[langCode] ?? asset.maxLength;
      const currentTranslation = translations[asset.id]?.[langCode]?.translation || '';

      setLoadingCells((prev) => ({ ...prev, [cellKey]: true }));
      try {
        const res = await fetch('/api/retranslate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assetType: asset.assetType,
            sourceText: asset.sourceText,
            currentTranslation,
            targetLanguage: langCode,
            maxLength: langMax,
            mode,
            sourceLanguage,
            context: eventContext,
          }),
        });
        if (!res.ok) throw new Error('Retranslation failed');
        const data = await res.json();
        if (data.translation) {
          onTranslationChange(asset.id, langCode, data.translation);
        }
      } catch {
        onRetranslateError?.(mode === 'shorten' ? '글자수 줄이기 실패' : '재번역 실패');
      } finally {
        setLoadingCells((prev) => ({ ...prev, [cellKey]: false }));
      }
    },
    [translations, onTranslationChange, eventContext, onRetranslateError]
  );

  const columns = useMemo<ColumnDef<RowData, unknown>[]>(() => {
    const cols: ColumnDef<RowData, unknown>[] = [
      {
        id: 'actions',
        header: '',
        size: 32,
        cell: ({ row }) => (
          <button
            onClick={() => onRemoveAsset(row.original.asset.id)}
            className="text-gray-300 hover:text-red-500"
            title="삭제"
          >
            ×
          </button>
        ),
      },
      {
        id: 'assetType',
        header: '에셋 타입',
        size: 126,
        cell: ({ row }) => {
          const assetType = row.original.asset.assetType;
          const preset = ASSET_TYPE_MAP[assetType];
          const dbEntry = presetDB.find((e) => e.assetType === assetType);
          const label = dbEntry?.labelKo || preset?.labelKo || assetType;
          return (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-xs font-medium text-gray-700">{label}</span>
              <span className="truncate text-[10px] text-gray-400">{assetType}</span>
            </div>
          );
        },
      },
      {
        id: 'maxLength',
        header: '글자수',
        size: 70,
        cell: ({ row }) => (
          <input
            type="number"
            value={row.original.asset.maxLength}
            onChange={(e) =>
              onMaxLengthChange(
                row.original.asset.id,
                parseInt(e.target.value) || 0
              )
            }
            className="w-14 rounded border border-gray-200 px-1 py-0.5 text-center text-xs text-gray-600"
            min={1}
          />
        ),
      },
      {
        id: 'sourceText',
        header: `원문 (${sourceLanguage.toUpperCase()})`,
        size: 420,
        cell: ({ row }) => {
          const asset = row.original.asset;
          return (
            <div className="group/src relative">
              <EditableCell
                value={asset.sourceText}
                maxLength={asset.maxLength}
                status="normal"
                onChange={(text) => onSourceTextChange(asset.id, text)}
                placeholder="원문을 입력하세요..."
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  setOptionsState((prev) =>
                    prev?.assetId === asset.id ? null : { assetId: asset.id, rect }
                  );
                }}
                className="absolute right-1 top-1 rounded px-1 py-0.5 text-[10px] text-gray-300 opacity-0 transition-opacity group-hover/src:opacity-100 hover:bg-emerald-50 hover:text-emerald-600"
                title="AI 카피 추천"
              >
                ✨
              </button>
            </div>
          );
        },
      },
    ];

    const PRIORITY = ['ko', 'en', 'ja'].filter((c) => c !== sourceLanguage);
    const sortedLanguages = [
      ...PRIORITY.filter((c) => targetLanguages.includes(c)),
      ...targetLanguages.filter((c) => !PRIORITY.includes(c)),
    ];

    for (const langCode of sortedLanguages) {
      cols.push({
        id: `lang_${langCode}`,
        header: () => <ColumnHeader languageCode={langCode} />,
        size: 180,
        cell: ({ row }) => {
          const asset = row.original.asset;
          const assetId = asset.id;
          const langMax = asset.langMaxLengths[langCode] ?? asset.maxLength;
          const result = translations[assetId]?.[langCode];
          const translationText = result?.translation || '';
          const charCount = translationText.length;
          const isOverLimit = charCount > langMax;
          const statusStyle =
            result?.status === 'error'
              ? 'border-red-300 bg-red-50'
              : result?.status === 'warning'
                ? 'border-amber-300 bg-amber-50'
                : 'border-transparent';
          const cellKey = `${assetId}_${langCode}`;
          const isCellLoading = loadingCells[cellKey];
          return (
            <div className="group flex flex-col gap-0.5">
              <div
                className={`group/cell relative min-h-[32px] rounded border p-1 text-sm ${statusStyle}`}
              >
                {isCellLoading ? (
                  <div className="flex items-center justify-center py-1">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
                  </div>
                ) : (
                  <>
                    {translationText || (
                      <>
                        <span className="text-gray-300">-</span>
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover/cell:opacity-100">
                          자동 번역 진행 후 수정 가능합니다
                          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                        </div>
                      </>
                    )}
                    {translationText && (
                      <span
                        className={`absolute bottom-0 right-1 text-[10px] ${isOverLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}
                      >
                        {charCount}/{langMax}
                      </span>
                    )}
                  </>
                )}
              </div>
              <div className="flex items-center justify-between">
                {translationText ? (
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                    <CellActionButton
                      icon="↻"
                      tooltip="새로운 표현으로 재생성"
                      onClick={() => handleRetranslate(asset, langCode, 'refresh')}
                      hoverClass="hover:bg-blue-100 hover:text-blue-600"
                    />
                    <CellActionButton
                      icon="✂"
                      tooltip="글자수 줄이기"
                      onClick={() => handleRetranslate(asset, langCode, 'shorten')}
                      hoverClass="hover:bg-orange-100 hover:text-orange-600"
                    />
                  </div>
                ) : (
                  <div />
                )}
                <input
                  type="number"
                  value={langMax}
                  onChange={(e) =>
                    onLangMaxLengthChange(assetId, langCode, parseInt(e.target.value) || 0)
                  }
                  className="w-12 rounded border border-gray-100 px-1 py-0 text-right text-[10px] text-gray-400 hover:border-gray-300 focus:border-blue-400 focus:text-gray-600 focus:outline-none"
                  min={1}
                  title={`${langCode} 글자수 제한`}
                />
              </div>
            </div>
          );
        },
      });
    }

    return cols;
  }, [
    presetDB,
    sourceLanguage,
    targetLanguages,
    translations,
    loadingCells,
    handleRetranslate,
    onSourceTextChange,
    onTranslationChange,
    onMaxLengthChange,
    onLangMaxLengthChange,
    onRemoveAsset,
    setOptionsState,
  ]);

  const data = useMemo<RowData[]>(
    () => assets.map((asset) => ({ asset })),
    [assets]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (assets.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
        에셋을 추가하여 번역을 시작하세요
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-auto">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          <p className="mt-2 text-sm font-medium text-gray-500">번역 중...</p>
        </div>
      )}
      <div className="flex items-center gap-1.5 px-2 py-1">
        <StepBadge step={6} label="번역 결과 수정 (재생성, 글자수 줄이기 등)" />
        <span className="text-[10px] text-gray-400">시트에서 직접 수정</span>
      </div>
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="overflow-hidden border-b border-r border-gray-200 px-2 py-2 text-center text-xs font-medium text-gray-500"
                  style={{ width: header.getSize(), maxWidth: header.getSize() }}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row, rowIndex) => (
            <tr
              key={row.id}
              className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="border-b border-r border-gray-100 px-1 py-1"
                  style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {(() => {
        const optAsset = optionsState ? assets.find((a) => a.id === optionsState.assetId) : null;
        return optAsset && optionsState ? (
          <SourceOptionsPopup
            assetType={optAsset.assetType}
            currentText={optAsset.sourceText}
            sourceLanguage={sourceLanguage}
            anchorRect={optionsState.rect}
            eventContext={{ ...eventContext, eventName }}
            onSelect={(text) => {
              onSourceTextChange(optAsset.id, text);
              setOptionsState(null);
            }}
            onClose={() => setOptionsState(null)}
          />
        ) : null;
      })()}
    </div>
  );
}

function CellActionButton({
  icon,
  tooltip,
  onClick,
  hoverClass,
}: {
  icon: string;
  tooltip: string;
  onClick: () => void;
  hoverClass: string;
}) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className={`peer rounded bg-gray-100 px-1 py-0.5 text-[9px] text-gray-500 ${hoverClass}`}
      >
        {icon}
      </button>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition-opacity peer-hover:opacity-100">
        {tooltip}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </div>
    </div>
  );
}
