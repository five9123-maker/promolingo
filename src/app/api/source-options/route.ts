import { NextRequest, NextResponse } from 'next/server';
import { generateSourceOptions } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetType, currentText, sourceLanguage, context } = body;

    if (!assetType) {
      return NextResponse.json({ error: 'assetType is required' }, { status: 400 });
    }

    const options = await generateSourceOptions({
      assetType,
      currentText,
      sourceLanguage: sourceLanguage || 'ko',
      context: context || { eventType: '일반 프로모션', toneKeywords: '기본', targetAudience: '일반', keySellingPoints: '' },
    });

    return NextResponse.json({ options });
  } catch (error) {
    console.error('Source options error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '옵션 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}
