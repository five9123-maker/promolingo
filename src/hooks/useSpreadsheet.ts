'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Asset, AssetLengthOverride } from '@/types/event';
import { ASSET_TYPE_MAP } from '@/constants/assetTypes';
import { LANGUAGE_MAP } from '@/constants/languages';
import { generateId } from '@/lib/storage';

const STORAGE_KEY = 'promolingo_assets';

function calcLangMaxLengths(baseMaxLength: number, targetLanguages: string[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const code of targetLanguages) {
    const lang = LANGUAGE_MAP[code];
    if (lang) {
      const avg = (lang.lengthCoefficient.min + lang.lengthCoefficient.max) / 2;
      result[code] = Math.round(baseMaxLength * avg);
    } else {
      result[code] = baseMaxLength;
    }
  }
  return result;
}

export function useSpreadsheet() {
  const [assets, setAssets] = useState<Asset[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [overrides, setOverrides] = useState<AssetLengthOverride[]>([]);
  const manualLangOverrides = useRef<Set<string>>(new Set());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
    } catch { /* ignore */ }
  }, [assets]);

  const addAsset = useCallback((assetType: string, sourceText: string = '', targetLanguages: string[] = []) => {
    const preset = ASSET_TYPE_MAP[assetType];
    const baseMax = preset?.maxLength ?? 100;
    const newAsset: Asset = {
      id: generateId(),
      assetType,
      sourceText,
      maxLength: baseMax,
      lengthUnit: preset?.lengthUnit ?? 'char',
      langMaxLengths: calcLangMaxLengths(baseMax, targetLanguages),
    };
    setAssets((prev) => [...prev, newAsset]);
    return newAsset;
  }, []);

  const updateAsset = useCallback(
    (id: string, updates: Partial<Pick<Asset, 'sourceText' | 'maxLength' | 'lengthUnit'>>) => {
      setAssets((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const updated = { ...a, ...updates };
          if (updates.maxLength !== undefined && updates.maxLength !== a.maxLength) {
            const existingLangs = Object.keys(a.langMaxLengths);
            const recalculated = calcLangMaxLengths(updates.maxLength, existingLangs);
            // Preserve manually overridden language values
            const merged: Record<string, number> = {};
            for (const lang of existingLangs) {
              const key = `${id}_${lang}`;
              merged[lang] = manualLangOverrides.current.has(key)
                ? a.langMaxLengths[lang]
                : recalculated[lang];
            }
            updated.langMaxLengths = merged;
          }
          return updated;
        })
      );
    },
    []
  );

  const updateLangMaxLength = useCallback(
    (assetId: string, langCode: string, maxLength: number) => {
      manualLangOverrides.current.add(`${assetId}_${langCode}`);
      setAssets((prev) =>
        prev.map((a) =>
          a.id === assetId
            ? { ...a, langMaxLengths: { ...a.langMaxLengths, [langCode]: maxLength } }
            : a
        )
      );
    },
    []
  );

  const ensureLangMaxLengths = useCallback(
    (targetLanguages: string[]) => {
      setAssets((prev) =>
        prev.map((a) => {
          const updated = { ...a.langMaxLengths };
          let changed = false;
          for (const code of targetLanguages) {
            if (updated[code] === undefined) {
              const lang = LANGUAGE_MAP[code];
              const avg = lang
                ? (lang.lengthCoefficient.min + lang.lengthCoefficient.max) / 2
                : 1;
              updated[code] = Math.round(a.maxLength * avg);
              changed = true;
            }
          }
          return changed ? { ...a, langMaxLengths: updated } : a;
        })
      );
    },
    []
  );

  const removeAsset = useCallback((id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getEffectiveMaxLength = useCallback(
    (assetType: string): number => {
      const override = overrides.find((o) => o.assetType === assetType);
      if (override) return override.maxLength;
      return ASSET_TYPE_MAP[assetType]?.maxLength ?? 100;
    },
    [overrides]
  );

  const setLengthOverride = useCallback(
    (assetType: string, maxLength: number, lengthUnit: 'char' | 'byte' = 'char') => {
      setOverrides((prev) => {
        const existing = prev.findIndex((o) => o.assetType === assetType);
        const newOverride = { assetType, maxLength, lengthUnit };
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newOverride;
          return updated;
        }
        return [...prev, newOverride];
      });
    },
    []
  );

  return {
    assets,
    setAssets,
    addAsset,
    updateAsset,
    removeAsset,
    updateLangMaxLength,
    ensureLangMaxLengths,
    overrides,
    getEffectiveMaxLength,
    setLengthOverride,
  };
}
