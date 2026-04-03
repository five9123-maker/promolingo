import { NextRequest, NextResponse } from 'next/server';
import { analyzeBrief } from '@/lib/openai';
import { PDFParse } from 'pdf-parse';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let briefText = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const text = formData.get('text') as string | null;

      if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        if (file.name.endsWith('.pdf')) {
          const parser = new PDFParse({ data: buffer });
          const result = await parser.getText();
          briefText = result.text;
        } else {
          briefText = buffer.toString('utf-8');
        }
      } else if (text) {
        briefText = text;
      }
    } else {
      const body = await request.json();
      briefText = body.briefText || '';
    }

    if (!briefText.trim()) {
      return NextResponse.json(
        { error: '기획서 내용을 입력해주세요' },
        { status: 400 }
      );
    }

    const result = await analyzeBrief(briefText);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Brief analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '기획서 분석에 실패했습니다' },
      { status: 500 }
    );
  }
}
