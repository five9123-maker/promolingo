'use client';

import { useState, useCallback, useRef } from 'react';
import type { BriefAnalysisResult } from '@/lib/openai';
import { ASSET_TYPE_MAP } from '@/constants/assetTypes';
import { useAssetPresetDB } from '@/hooks/useAssetPresetDB';
import ClickUpSearchBar from '@/components/clickup/ClickUpSearchBar';
import StepBadge from '@/components/common/StepBadge';

type PanelState = 'input' | 'analyzing' | 'result';

interface SuggestedAsset {
  id: string;
  assetType: string;
  reason: string;
  maxLength: number;
  lengthUnit: 'char' | 'byte';
  suggestedSourceText?: string;
  enabled: boolean;
}

interface BriefSidePanelProps {
  onAnalysisComplete: (result: BriefAnalysisResult) => void;
  onAssetsConfirm: (assets: SuggestedAsset[]) => void;
  onAddAsset?: () => void;
}

let nextId = 0;

export default function BriefSidePanel({
  onAnalysisComplete,
  onAssetsConfirm,
  onAddAsset,
}: BriefSidePanelProps) {
  const { db: presetDB } = useAssetPresetDB();
  const [state, setState] = useState<PanelState>('input');
  const [briefText, setBriefText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<BriefAnalysisResult | null>(null);
  const [suggestedAssets, setSuggestedAssets] = useState<SuggestedAsset[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFile = useRef<File | null>(null);

  const analyze = useCallback(async (text?: string, file?: File) => {
    setState('analyzing');
    setError(null);

    try {
      let response: Response;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        response = await fetch('/api/analyze-brief', { method: 'POST', body: formData });
      } else {
        const content = text || briefText;
        if (!content.trim()) {
          setError('기획서 내용을 입력해주세요');
          setState('input');
          return;
        }
        response = await fetch('/api/analyze-brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ briefText: content }),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '분석 실패');
      }

      const result: BriefAnalysisResult = await response.json();
      setAnalysisResult(result);

      const assets: SuggestedAsset[] = result.suggestedAssets.map((a) => {
        const preset = ASSET_TYPE_MAP[a.assetType];
        const dbEntry = presetDB.find((e) => e.assetType === a.assetType);
        return {
          id: `sa_${nextId++}`,
          assetType: a.assetType,
          reason: a.reason,
          maxLength: dbEntry?.maxLength ?? a.suggestedMaxLength ?? preset?.maxLength ?? 100,
          lengthUnit: dbEntry?.lengthUnit ?? preset?.lengthUnit ?? 'char',
          suggestedSourceText: a.suggestedSourceText,
          enabled: a.enabled && (dbEntry?.active ?? true),
        };
      });
      setSuggestedAssets(assets);
      setState('result');
      onAnalysisComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류');
      setState('input');
    }
  }, [briefText, onAnalysisComplete, presetDB]);

  const handleFileDrop = useCallback(
    async (file: File) => {
      setFileName(file.name);
      if (file.name.endsWith('.pdf')) {
        pendingFile.current = file;
        analyze(undefined, file);
      } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text();
        setBriefText(text);
      }
    },
    [analyze]
  );

  const toggleAsset = useCallback((id: string) => {
    setSuggestedAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  }, []);

  const updateMaxLength = useCallback((id: string, maxLength: number) => {
    setSuggestedAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, maxLength } : a))
    );
  }, []);

  const moveAsset = useCallback((id: string, dir: 'up' | 'down') => {
    setSuggestedAssets((prev) => {
      const idx = prev.findIndex((a) => a.id === id);
      const target = dir === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const addManualAsset = useCallback((assetTypeKey: string) => {
    const preset = ASSET_TYPE_MAP[assetTypeKey];
    if (!preset) return;
    setSuggestedAssets((prev) => [
      ...prev,
      {
        id: `sa_${nextId++}`,
        assetType: assetTypeKey,
        reason: '수동 추가',
        maxLength: preset.maxLength,
        lengthUnit: preset.lengthUnit,
        enabled: true,
      },
    ]);
  }, []);

  const enabledCount = suggestedAssets.filter((a) => a.enabled).length;

  return (
    <div className="flex w-64 flex-shrink-0 flex-col border-r border-gray-200 bg-gray-50/50">
      {/* ClickUp Search */}
      <ClickUpSearchBar />
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <StepBadge step={2} label="기획서 입력 및 AI 분석" />
            <h2 className="text-xs font-semibold text-gray-700">기획서 AI 분석</h2>
          </div>
          <div className="flex items-center gap-2">
            {state === 'result' && (
              <button
                onClick={() => { setState('input'); setError(null); }}
                className="text-[10px] text-blue-500 hover:underline"
              >
                변경
              </button>
            )}
            {onAddAsset && (
              <button
                onClick={onAddAsset}
                className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50"
              >
                + 에셋(구좌) 추가
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {/* INPUT STATE */}
        {state === 'input' && (
          <div className="flex flex-col gap-3 p-3">
            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFileDrop(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-gray-300 bg-white hover:border-emerald-300 hover:bg-emerald-50/30'
              }`}
            >
              <div className="mb-1 text-2xl text-gray-300">
                {isDragging ? '↓' : '📄'}
              </div>
              <p className="text-xs font-medium text-gray-500">
                {isDragging ? '여기에 놓으세요' : 'PDF 파일을 드래그하거나 클릭'}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                .pdf, .txt, .md
              </p>
              {fileName && (
                <p className="mt-1 truncate text-[10px] text-emerald-600">
                  {fileName}
                </p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileDrop(file);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[10px] text-gray-400">또는 텍스트 입력</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Text input */}
            <textarea
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              placeholder="기획서 내용을 붙여넣으세요..."
              className="h-40 w-full resize-none rounded-lg border border-gray-200 bg-white p-2.5 text-xs text-gray-700 placeholder:text-gray-300 focus:border-emerald-400 focus:outline-none"
            />

            {error && (
              <p className="text-[11px] text-red-500">{error}</p>
            )}

            <button
              onClick={() => analyze()}
              disabled={!briefText.trim()}
              className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              분석하기
            </button>
          </div>
        )}

        {/* ANALYZING STATE */}
        {state === 'analyzing' && (
          <div className="flex flex-col items-center justify-center gap-3 p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
            <p className="text-xs text-gray-500">기획서 분석 중...</p>
            {fileName && (
              <p className="text-[10px] text-gray-400">{fileName}</p>
            )}
          </div>
        )}

        {/* RESULT STATE */}
        {state === 'result' && analysisResult && (
          <div className="flex flex-col gap-3 p-3">
            {/* Event info */}
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <h3 className="mb-2 text-[11px] font-semibold text-gray-600">이벤트 정보</h3>
              <div className="space-y-1.5">
                {analysisResult.eventName && (
                  <InfoRow label="이벤트명" value={analysisResult.eventName} />
                )}
                {analysisResult.eventType && (
                  <InfoRow label="유형" value={analysisResult.eventType} />
                )}
                {analysisResult.toneKeywords && (
                  <InfoRow label="톤" value={analysisResult.toneKeywords} />
                )}
                {analysisResult.targetAudience && (
                  <InfoRow label="타겟" value={analysisResult.targetAudience} />
                )}
                {analysisResult.keySellingPoints && (
                  <InfoRow label="USP" value={analysisResult.keySellingPoints} />
                )}
              </div>
            </div>

            {/* Suggested assets */}
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[11px] font-semibold text-gray-600">추천 구좌</h3>
                <span className="text-[10px] text-gray-400">{enabledCount}개 선택</span>
              </div>

              <div className="space-y-1">
                {suggestedAssets.map((asset, idx) => {
                  const preset = ASSET_TYPE_MAP[asset.assetType];
                  const dbEntry = presetDB.find((e) => e.assetType === asset.assetType);
                  const label = dbEntry?.labelKo || preset?.labelKo || asset.assetType;
                  return (
                    <div
                      key={asset.id}
                      className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 ${
                        asset.enabled
                          ? 'border-emerald-200 bg-emerald-50/50'
                          : 'border-gray-100 opacity-50'
                      }`}
                    >
                      <button
                        onClick={() => toggleAsset(asset.id)}
                        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border text-[9px] font-bold ${
                          asset.enabled
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {asset.enabled ? '✓' : ''}
                      </button>

                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] font-medium text-gray-700">
                          {label}
                        </span>
                        <p className="truncate text-[9px] text-gray-400">{asset.reason}</p>
                      </div>

                      <input
                        type="number"
                        value={asset.maxLength}
                        onChange={(e) => updateMaxLength(asset.id, parseInt(e.target.value) || 0)}
                        className="w-10 rounded border border-gray-200 px-1 py-0.5 text-center text-[10px] text-gray-500 focus:border-emerald-400 focus:outline-none"
                        min={1}
                      />

                      <div className="flex flex-col">
                        <button
                          onClick={() => moveAsset(asset.id, 'up')}
                          disabled={idx === 0}
                          className="text-[8px] text-gray-400 hover:text-gray-600 disabled:invisible"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveAsset(asset.id, 'down')}
                          disabled={idx === suggestedAssets.length - 1}
                          className="text-[8px] text-gray-400 hover:text-gray-600 disabled:invisible"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Manual add */}
              <ManualAssetAdder onAdd={addManualAsset} />
            </div>

            {/* Confirm button */}
            <button
              onClick={() => onAssetsConfirm(suggestedAssets.filter((a) => a.enabled))}
              disabled={enabledCount === 0}
              className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              에셋(구좌) 추가 ({enabledCount})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-14 flex-shrink-0 text-[10px] font-medium text-gray-400">{label}</span>
      <span className="text-[10px] text-gray-700">{value}</span>
    </div>
  );
}

function ManualAssetAdder({ onAdd }: { onAdd: (key: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const presets = Object.values(ASSET_TYPE_MAP).filter((p) => p.key !== 'custom');

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-[10px] text-blue-500 hover:underline"
      >
        + 수동 추가
      </button>
      {isOpen && (
        <div className="mt-1 grid grid-cols-2 gap-1">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => { onAdd(p.key); setIsOpen(false); }}
              className="rounded border border-gray-200 bg-gray-50 px-1.5 py-1 text-left text-[9px] text-gray-600 hover:border-emerald-300 hover:bg-emerald-50"
            >
              {p.labelKo}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
