import { NextRequest, NextResponse } from 'next/server';
import { translateAssets } from '@/lib/openai';
import type { TranslateRequest, TranslationResult, CellStatus } from '@/types/translation';
import { LANGUAGE_MAP } from '@/constants/languages';

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();

    if (!body.assets?.length || !body.targetLanguages?.length) {
      return NextResponse.json(
        { error: 'Assets and target languages are required' },
        { status: 400 }
      );
    }

    const result = await translateAssets({
      assets: body.assets,
      targetLanguages: body.targetLanguages,
      context: body.context,
      sourceLanguage: body.sourceLanguage || 'ko',
    });

    const translations: TranslationResult[] = result.translations.map(
      (t: Record<string, unknown>) => {
        const maxAllowed = calculateMaxLength(
          Number(t.max_allowed) || 0,
          String(t.language),
          String(t.asset_key)
        );
        const charCount = String(t.translation).length;
        const status: CellStatus =
          charCount > maxAllowed ? 'error' : (t.warnings as string[])?.length ? 'warning' : 'normal';

        return {
          assetKey: String(t.asset_key),
          assetId: String(t.asset_id || t.asset_key),
          language: String(t.language),
          translation: String(t.translation),
          charCount,
          maxAllowed,
          status,
          warnings: (t.warnings as string[]) || [],
          alternatives: (t.alternatives as string[]) || [],
        };
      }
    );

    return NextResponse.json({
      translations,
      totalTokensUsed:
        (result.usage?.prompt_tokens || 0) + (result.usage?.completion_tokens || 0),
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Translation failed' },
      { status: 500 }
    );
  }
}

function calculateMaxLength(
  baseMaxLength: number,
  languageCode: string,
  _assetKey: string
): number {
  if (!baseMaxLength) return 100;
  const lang = LANGUAGE_MAP[languageCode];
  if (!lang) return baseMaxLength;
  const avgCoefficient =
    (lang.lengthCoefficient.min + lang.lengthCoefficient.max) / 2;
  return Math.round(baseMaxLength * avgCoefficient);
}
