'use client';

import { useState, useCallback, useEffect } from 'react';
import type { TranslateRequest, TranslateResponse, TranslationGrid } from '@/types/translation';

const STORAGE_KEY = 'promolingo_translations';

export function useTranslation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grid, setGrid] = useState<TranslationGrid>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(grid));
    } catch { /* ignore */ }
  }, [grid]);

  const translate = useCallback(async (request: TranslateRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Translation failed');
      }

      const data: TranslateResponse = await response.json();

      // Merge new translations into existing grid instead of replacing
      setGrid((prev) => {
        const merged = { ...prev };
        for (const result of data.translations) {
          if (!merged[result.assetId]) {
            merged[result.assetId] = {};
          }
          merged[result.assetId][result.language] = result;
        }
        return merged;
      });

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCell = useCallback(
    (assetId: string, language: string, translation: string) => {
      setGrid((prev) => {
        const existing = prev[assetId]?.[language];
        if (!existing) {
          // Create new entry if it doesn't exist (e.g., from retranslate)
          return {
            ...prev,
            [assetId]: {
              ...prev[assetId],
              [language]: {
                assetKey: '',
                assetId,
                language,
                translation,
                charCount: translation.length,
                maxAllowed: 0,
                status: 'normal' as const,
                warnings: [],
                alternatives: [],
              },
            },
          };
        }
        return {
          ...prev,
          [assetId]: {
            ...prev[assetId],
            [language]: {
              ...existing,
              translation,
              charCount: translation.length,
              status:
                existing.maxAllowed > 0 && translation.length > existing.maxAllowed
                  ? 'error'
                  : 'normal',
            },
          },
        };
      });
    },
    []
  );

  return { grid, isLoading, error, translate, updateCell, setGrid };
}
