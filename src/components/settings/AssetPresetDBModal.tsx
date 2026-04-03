'use client';

import { useState } from 'react';
import { useAssetPresetDB } from '@/hooks/useAssetPresetDB';

interface AssetPresetDBModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssetPresetDBModal({ isOpen, onClose }: AssetPresetDBModalProps) {
  const { db, updateEntry, renameKey, addEntry, removeEntry, resetToDefaults } = useAssetPresetDB();
  // Local state for key editing (committed on blur)
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 flex max-h-[82vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">에셋 프리셋 설정</h3>
            <p className="mt-0.5 text-xs text-gray-400">
              기획서 분석 시 적용될 에셋 타입별 기본 설정입니다 · 변경사항은 자동 저장됩니다
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetToDefaults}
              className="rounded border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-50"
            >
              기본값 초기화
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">
              ×
            </button>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1.5rem_1fr_1fr_5rem_4.5rem_1.5rem] items-center gap-2 border-b border-gray-100 px-5 py-2 text-[10px] font-medium uppercase text-gray-400">
          <span>사용</span>
          <span>타이틀</span>
          <span>에셋 키</span>
          <span className="text-center">글자수</span>
          <span className="text-center">단위</span>
          <span />
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto px-5 py-2">
          <div className="space-y-1">
            {db.map((entry) => (
              <div
                key={entry.assetType}
                className={`grid grid-cols-[1.5rem_1fr_1fr_5rem_4.5rem_1.5rem] items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-gray-50 ${
                  !entry.active ? 'opacity-40' : ''
                }`}
              >
                {/* Active toggle */}
                <input
                  type="checkbox"
                  checked={entry.active}
                  onChange={(e) => updateEntry(entry.assetType, { active: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />

                {/* Label (editable) */}
                <input
                  type="text"
                  value={entry.labelKo}
                  onChange={(e) => updateEntry(entry.assetType, { labelKo: e.target.value })}
                  placeholder="타이틀 입력"
                  className="rounded border border-transparent px-1.5 py-0.5 text-sm font-medium text-gray-700 hover:border-gray-200 focus:border-emerald-400 focus:outline-none"
                />

                {/* Asset key (editable) */}
                <input
                  type="text"
                  value={editingKeys[entry.assetType] ?? entry.assetType}
                  onChange={(e) =>
                    setEditingKeys((prev) => ({ ...prev, [entry.assetType]: e.target.value }))
                  }
                  onBlur={(e) => {
                    const newKey = e.target.value.trim();
                    if (newKey && newKey !== entry.assetType) {
                      renameKey(entry.assetType, newKey);
                      setEditingKeys((prev) => {
                        const next = { ...prev };
                        delete next[entry.assetType];
                        return next;
                      });
                    } else {
                      setEditingKeys((prev) => {
                        const next = { ...prev };
                        delete next[entry.assetType];
                        return next;
                      });
                    }
                  }}
                  className="truncate rounded border border-transparent px-1.5 py-0.5 font-mono text-xs text-gray-400 hover:border-gray-200 focus:border-emerald-400 focus:text-gray-600 focus:outline-none"
                />

                {/* Max length */}
                <input
                  type="number"
                  value={entry.maxLength}
                  onChange={(e) =>
                    updateEntry(entry.assetType, { maxLength: parseInt(e.target.value) || 1 })
                  }
                  className="w-full rounded border border-gray-200 px-1.5 py-0.5 text-center text-sm text-gray-700 focus:border-emerald-400 focus:outline-none"
                  min={1}
                />

                {/* Unit toggle */}
                <div className="flex rounded border border-gray-200 text-[10px]">
                  <button
                    onClick={() => updateEntry(entry.assetType, { lengthUnit: 'char' })}
                    className={`flex-1 py-0.5 ${
                      entry.lengthUnit === 'char'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    자
                  </button>
                  <button
                    onClick={() => updateEntry(entry.assetType, { lengthUnit: 'byte' })}
                    className={`flex-1 py-0.5 ${
                      entry.lengthUnit === 'byte'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    byte
                  </button>
                </div>

                {/* Delete */}
                <button
                  onClick={() => removeEntry(entry.assetType)}
                  className="text-gray-300 hover:text-red-400"
                  title="삭제"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add new */}
          <button
            onClick={addEntry}
            className="mt-3 w-full rounded-md border border-dashed border-gray-300 py-2 text-xs text-gray-400 hover:border-emerald-400 hover:text-emerald-600"
          >
            + 새 에셋 타입 추가
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
          <span className="text-xs text-gray-400">
            {db.filter((e) => e.active).length}개 활성 · {db.length}개 전체
          </span>
          <button
            onClick={onClose}
            className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
