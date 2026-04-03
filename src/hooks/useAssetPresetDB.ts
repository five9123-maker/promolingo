'use client';

import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { ASSET_TYPE_PRESETS } from '@/constants/assetTypes';

export interface AssetPresetEntry {
  assetType: string;
  labelKo: string;
  maxLength: number;
  lengthUnit: 'char' | 'byte';
  active: boolean;
}

const DEFAULT_DB: AssetPresetEntry[] = ASSET_TYPE_PRESETS
  .filter((p) => p.key !== 'custom')
  .map((p) => ({
    assetType: p.key,
    labelKo: p.labelKo,
    maxLength: p.maxLength,
    lengthUnit: p.lengthUnit,
    active: true,
  }));

export function useAssetPresetDB() {
  const [rawDb, setDb] = useLocalStorage<AssetPresetEntry[]>(
    'promolingo_assetPresetDB',
    DEFAULT_DB
  );

  // Migrate entries that are missing labelKo (from old DB format)
  const db = rawDb.map((e) => {
    if (e.labelKo !== undefined) return e;
    const preset = ASSET_TYPE_PRESETS.find((p) => p.key === e.assetType);
    return { ...e, labelKo: preset?.labelKo ?? e.assetType };
  });

  const updateEntry = useCallback(
    (assetType: string, fields: Partial<Omit<AssetPresetEntry, 'assetType'>>) => {
      setDb((prev) =>
        prev.map((e) => (e.assetType === assetType ? { ...e, ...fields } : e))
      );
    },
    [setDb]
  );

  const addEntry = useCallback(() => {
    const newEntry: AssetPresetEntry = {
      assetType: `custom_${Date.now()}`,
      labelKo: '',
      maxLength: 50,
      lengthUnit: 'char',
      active: true,
    };
    setDb((prev) => [...prev, newEntry]);
  }, [setDb]);

  const renameKey = useCallback((oldKey: string, newKey: string) => {
    if (!newKey.trim() || newKey === oldKey) return;
    setDb((prev) =>
      prev.map((e) => (e.assetType === oldKey ? { ...e, assetType: newKey.trim() } : e))
    );
  }, [setDb]);

  const removeEntry = useCallback((assetType: string) => {
    setDb((prev) => prev.filter((e) => e.assetType !== assetType));
  }, [setDb]);

  const resetToDefaults = useCallback(() => {
    setDb(DEFAULT_DB);
  }, [setDb]);

  return { db, updateEntry, renameKey, addEntry, removeEntry, resetToDefaults };
}
