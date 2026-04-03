import { NextRequest, NextResponse } from 'next/server';
import { retranslateCell } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { assetType, sourceText, currentTranslation, targetLanguage, maxLength, mode, context, sourceLanguage } = body;

    if (!sourceText || !targetLanguage || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await retranslateCell({
      assetType,
      sourceText,
      currentTranslation,
      targetLanguage,
      maxLength,
      mode,
      sourceLanguage: sourceLanguage || 'ko',
      context: context || {
        eventType: '일반 프로모션',
        toneKeywords: '기본',
        targetAudience: '일반',
        keySellingPoints: '',
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Retranslate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Retranslation failed' },
      { status: 500 }
    );
  }
}
