'use client';

import { useState, useCallback } from 'react';
import { ASSET_TYPE_PRESETS, ASSET_TYPE_MAP } from '@/constants/assetTypes';

export interface AssetConfigItem {
  id: string;
  assetType: string;
  maxLength: number;
  lengthUnit: 'char' | 'byte';
  reason: string;
  enabled: boolean;
}

interface AssetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (items: AssetConfigItem[]) => void;
  initialItems: AssetConfigItem[];
  title?: string;
  subtitle?: string;
}

let nextId = 0;
function tempId() {
  return `cfg_${Date.now()}_${nextId++}`;
}

export function buildConfigItems(
  suggestedAssets: {
    assetType: string;
    reason: string;
    suggestedMaxLength: number;
    enabled: boolean;
  }[]
): AssetConfigItem[] {
  return suggestedAssets.map((a) => {
    const preset = ASSET_TYPE_MAP[a.assetType];
    return {
      id: tempId(),
      assetType: a.assetType,
      maxLength: a.suggestedMaxLength || preset?.maxLength || 100,
      lengthUnit: preset?.lengthUnit || 'char',
      reason: a.reason,
      enabled: a.enabled,
    };
  });
}

export default function AssetConfigModal({
  isOpen,
  onClose,
  onConfirm,
  initialItems,
  title = '에셋 설정',
  subtitle,
}: AssetConfigModalProps) {
  const [items, setItems] = useState<AssetConfigItem[]>(initialItems);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  }, []);

  const updateMaxLength = useCallback((id: string, maxLength: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, maxLength } : item
      )
    );
  }, []);

  const moveItem = useCallback((id: string, direction: 'up' | 'down') => {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.id === id);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addManualAsset = useCallback((assetTypeKey: string) => {
    const preset = ASSET_TYPE_MAP[assetTypeKey];
    if (!preset) return;
    setItems((prev) => [
      ...prev,
      {
        id: tempId(),
        assetType: assetTypeKey,
        maxLength: preset.maxLength,
        lengthUnit: preset.lengthUnit,
        reason: '수동 추가',
        enabled: true,
      },
    ]);
    setShowAddMenu(false);
  }, []);

  const handleConfirm = () => {
    const enabled = items.filter((item) => item.enabled);
    onConfirm(enabled);
  };

  const enabledCount = items.filter((i) => i.enabled).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        {/* Asset list */}
        <div className="flex-1 overflow-auto px-5 py-3">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              에셋이 없습니다. 아래에서 추가해주세요.
            </p>
          ) : (
            <div className="space-y-1.5">
              {items.map((item, idx) => {
                const preset = ASSET_TYPE_MAP[item.assetType];
                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
                      item.enabled
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-gray-100 bg-gray-50/50 opacity-60'
                    }`}
                  >
                    {/* Toggle */}
                    <button
                      onClick={() => toggleItem(item.id)}
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border text-xs font-bold ${
                        item.enabled
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-gray-300 bg-white text-transparent'
                      }`}
                    >
                      ✓
                    </button>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          {preset?.labelKo || item.assetType}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {item.assetType}
                        </span>
                      </div>
                      <p className="truncate text-[11px] text-gray-400">
                        {item.reason}
                      </p>
                    </div>

                    {/* Max length */}
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={item.maxLength}
                        onChange={(e) =>
                          updateMaxLength(item.id, parseInt(e.target.value) || 0)
                        }
                        className="w-14 rounded border border-gray-200 px-1.5 py-0.5 text-center text-xs text-gray-600 focus:border-emerald-400 focus:outline-none"
                        min={1}
                      />
                      <span className="text-[10px] text-gray-400">
                        {item.lengthUnit === 'byte' ? 'B' : '자'}
                      </span>
                    </div>

                    {/* Move buttons */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveItem(item.id, 'up')}
                        disabled={idx === 0}
                        className="px-1 text-[10px] text-gray-400 hover:text-gray-600 disabled:invisible"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveItem(item.id, 'down')}
                        disabled={idx === items.length - 1}
                        className="px-1 text-[10px] text-gray-400 hover:text-gray-600 disabled:invisible"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-xs text-gray-300 hover:text-red-500"
                      title="삭제"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Manual add */}
          <div className="mt-3">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs text-gray-500 hover:border-emerald-400 hover:text-emerald-600"
            >
              + 에셋 수동 추가
            </button>

            {showAddMenu && (
              <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-md border border-gray-100 bg-gray-50 p-2">
                {ASSET_TYPE_PRESETS.filter((p) => p.key !== 'custom').map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => addManualAsset(preset.key)}
                    className="rounded border border-gray-200 bg-white px-2 py-1.5 text-left text-xs hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    <div className="font-medium text-gray-600">{preset.labelKo}</div>
                    <div className="text-[9px] text-gray-400">
                      {preset.maxLength}{preset.lengthUnit === 'byte' ? 'B' : '자'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <span className="text-xs text-gray-400">
            {enabledCount}개 에셋 선택됨
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={enabledCount === 0}
              className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              추가하기 ({enabledCount})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
