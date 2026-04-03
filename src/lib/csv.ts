import type { TranslationGrid } from '@/types/translation';
import type { Asset } from '@/types/event';

const BOM = '\uFEFF';

export function generateCSV(params: {
  eventName: string;
  assets: Asset[];
  translations: TranslationGrid;
  targetLanguages: string[];
  sourceLanguage: string;
}): string {
  const { eventName, assets, translations, targetLanguages, sourceLanguage } =
    params;

  const headers = [
    'event_name',
    'asset_type',
    'source_lang',
    'source_text',
    sourceLanguage,
    ...targetLanguages,
    'warnings',
  ];

  const rows = assets.map((asset) => {
    const langCells = targetLanguages.map((lang) => {
      const result = translations[asset.id]?.[lang];
      return result ? escapeCSV(result.translation) : '';
    });

    const warnings = targetLanguages
      .flatMap((lang) => {
        const result = translations[asset.id]?.[lang];
        return result?.warnings || [];
      })
      .filter(Boolean)
      .join('; ');

    return [
      escapeCSV(eventName),
      escapeCSV(asset.assetType),
      sourceLanguage,
      escapeCSV(asset.sourceText),
      escapeCSV(asset.sourceText),
      ...langCells,
      escapeCSV(warnings),
    ].join(',');
  });

  return BOM + [headers.join(','), ...rows].join('\n');
}

function escapeCSV(value: string): string {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
