import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'input is required' }, { status: 400 });
    }

    const openai = getClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            '당신은 이커머스 프로모션 이벤트 타이틀을 생성하는 전문가입니다. 사용자가 입력한 ClickUp 태스크 제목, URL, 또는 설명을 보고 간결한 이벤트 타이틀(15자 이내, 한국어)을 생성하세요. 이벤트의 핵심을 담되, 불필요한 접두어나 날짜는 제외하세요. 타이틀만 출력하세요.',
        },
        {
          role: 'user',
          content: input,
        },
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    const title = response.choices[0]?.message?.content?.trim() || input;

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Summarize title error:', error);
    return NextResponse.json(
      { error: 'Failed to summarize title' },
      { status: 500 }
    );
  }
}
