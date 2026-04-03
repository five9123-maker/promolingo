import OpenAI from 'openai';
import { buildSystemPrompt } from '@/constants/prompts';
import { LANGUAGE_MAP } from '@/constants/languages';
import { ASSET_TYPE_PRESETS } from '@/constants/assetTypes';

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return client;
}

const MODEL = 'gpt-4o-mini';

interface TranslateParams {
  assets: {
    id: string;
    assetType: string;
    sourceText: string;
    maxLength: number;
    lengthUnit: 'char' | 'byte';
  }[];
  targetLanguages: string[];
  context: {
    eventType: string;
    toneKeywords: string;
    targetAudience: string;
    keySellingPoints: string;
  };
  sourceLanguage: string;
}

export interface BriefAnalysisResult {
  eventName: string;
  eventType: string;
  toneKeywords: string;
  targetAudience: string;
  keySellingPoints: string;
  suggestedAssets: {
    assetType: string;
    reason: string;
    suggestedMaxLength: number;
    suggestedSourceText?: string;
    enabled: boolean;
  }[];
}

export async function analyzeBrief(briefText: string): Promise<BriefAnalysisResult> {
  const openai = getClient();

  const assetTypeList = ASSET_TYPE_PRESETS.filter((p) => p.key !== 'custom')
    .map((p) => `- ${p.key}: ${p.labelKo} (기본 ${p.maxLength}${p.lengthUnit === 'byte' ? 'bytes' : '자'}) — ${p.description}`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `당신은 이커머스 프로모션 기획서를 분석하고 카피라이팅을 하는 전문가입니다.
기획서를 읽고 이벤트 정보, 필요한 에셋 목록, 그리고 각 에셋의 실제 카피를 생성합니다.

사용 가능한 에셋 타입:
${assetTypeList}

반드시 아래 JSON 형식으로만 응답하세요.
{
  "eventName": "이벤트명",
  "eventType": "할인/기획전/시즌/콜라보 등",
  "toneKeywords": "톤 키워드 (쉼표 구분)",
  "targetAudience": "타겟 고객",
  "keySellingPoints": "핵심 셀링 포인트",
  "suggestedAssets": [
    {
      "assetType": "에셋 타입 key (위 목록에서 선택)",
      "reason": "이 에셋이 필요한 이유 (한 줄)",
      "suggestedMaxLength": 숫자,
      "suggestedSourceText": "기획서 내용 기반 실제 카피 (글자수 제한 준수, 기획서와 동일한 언어로 작성)",
      "enabled": true
    }
  ]
}

규칙:
- 기획서에서 언급된 구좌/배너/푸시 등을 파악하여 적절한 에셋 타입을 매핑
- 기획서에 명시적으로 언급되지 않더라도 일반적으로 필요한 에셋은 enabled: false로 포함
- suggestedMaxLength는 기획서 맥락에 맞게 기본값을 조정 (필요시)
- 기획서에 특별한 글자수 언급이 없으면 에셋 타입의 기본값 사용
- suggestedSourceText는 반드시 suggestedMaxLength 이내로 작성
- suggestedSourceText는 기획서에서 언급된 이벤트명, 할인율, 혜택 등을 반영한 실제 사용 가능한 카피`,
      },
      {
        role: 'user',
        content: `다음 기획서를 분석해주세요:\n\n${briefText}`,
      },
    ],
  });

  const rawText = response.choices[0]?.message?.content || '';

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('기획서 분석 결과를 파싱할 수 없습니다');
  }

  return JSON.parse(jsonMatch[0]);
}

export async function translateAssets(params: TranslateParams) {
  const openai = getClient();

  const systemPrompt = buildSystemPrompt({
    eventType: params.context.eventType,
    toneKeywords: params.context.toneKeywords,
    targetAudience: params.context.targetAudience,
    keySellingPoints: params.context.keySellingPoints,
  });

  const languageNames = params.targetLanguages
    .map((code) => {
      const lang = LANGUAGE_MAP[code];
      return lang ? `${lang.name} (${code})` : code;
    })
    .join(', ');

  const assetsDescription = params.assets
    .map(
      (a) =>
        `- ${a.assetType} (ID: ${a.id}): "${a.sourceText}" (max ${a.maxLength}${a.lengthUnit === 'byte' ? ' bytes' : '자'})`
    )
    .join('\n');

  const userMessage = `다음 에셋들을 ${languageNames}로 번역해주세요.

원문 언어: ${params.sourceLanguage}

에셋 목록:
${assetsDescription}

각 에셋을 모든 타겟 언어로 번역하고, JSON 형식으로 반환해주세요.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 8192,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const rawText = response.choices[0]?.message?.content || '';

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse translation response as JSON');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    translations: parsed.translations || [],
    usage: response.usage,
  };
}

interface RetranslateParams {
  assetType: string;
  sourceText: string;
  currentTranslation: string;
  targetLanguage: string;
  maxLength: number;
  mode: 'refresh' | 'shorten';
  sourceLanguage?: string;
  context: {
    eventType: string;
    toneKeywords: string;
    targetAudience: string;
    keySellingPoints: string;
  };
}

export async function retranslateCell(params: RetranslateParams) {
  const openai = getClient();

  const lang = LANGUAGE_MAP[params.targetLanguage];
  const langName = lang ? `${lang.name} (${params.targetLanguage})` : params.targetLanguage;
  const srcLang = LANGUAGE_MAP[params.sourceLanguage || 'ko'];
  const srcLangName = srcLang ? `${srcLang.name} (${params.sourceLanguage})` : (params.sourceLanguage || 'ko');

  const modeInstruction =
    params.mode === 'shorten'
      ? `현재 ${langName} 번역 "${params.currentTranslation}"이 글자수 제한(${params.maxLength}자)을 초과합니다.
${langName}로 의미를 최대한 유지하면서 ${params.maxLength}자 이내로 줄여주세요.
원문: "${params.sourceText}"`
      : `"${params.sourceText}"를 ${langName}로 새롭게 번역해주세요.
기존 번역: "${params.currentTranslation}"과 다른 표현을 사용해주세요.
글자수 제한: ${params.maxLength}자 이내`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `당신은 이커머스 프로모션 전문 트랜스크리에이터입니다.
원문 언어: ${srcLangName}
타겟 언어: ${langName}
에셋 타입: ${params.assetType}
글자수 제한: ${params.maxLength}자 (반드시 준수)
이벤트 유형: ${params.context.eventType}
톤: ${params.context.toneKeywords}

반드시 ${langName}로 번역 결과를 제공하세요.
JSON으로 응답:
{ "translation": "번역 결과", "char_count": N }`,
      },
      {
        role: 'user',
        content: modeInstruction,
      },
    ],
  });

  const rawText = response.choices[0]?.message?.content || '';
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse retranslation response');
  }
  return JSON.parse(jsonMatch[0]);
}

interface GenerateSourceOptionsParams {
  assetType: string;
  currentText?: string;
  sourceLanguage: string;
  context: {
    eventName?: string;
    eventType: string;
    toneKeywords: string;
    targetAudience: string;
    keySellingPoints: string;
  };
}

export async function generateSourceOptions(params: GenerateSourceOptionsParams): Promise<string[]> {
  const openai = getClient();
  const preset = ASSET_TYPE_PRESETS.find((p) => p.key === params.assetType);
  const lang = LANGUAGE_MAP[params.sourceLanguage];
  const langName = lang ? lang.nameKo : params.sourceLanguage;
  const maxLen = preset?.maxLength || 100;
  const unit = preset?.lengthUnit === 'byte' ? 'bytes' : '자';

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `당신은 이커머스 프로모션 카피라이터입니다.
에셋 타입: ${preset?.labelKo || params.assetType}
글자수 제한: ${maxLen}${unit} (반드시 준수)
작성 언어: ${langName}
이벤트명: ${params.context.eventName || ''}
이벤트 유형: ${params.context.eventType}
톤: ${params.context.toneKeywords}
타겟: ${params.context.targetAudience}
핵심 셀링포인트: ${params.context.keySellingPoints}

위 조건에 맞는 ${langName} 카피 옵션 4개를 생성해주세요.
${params.currentText ? `현재 원문 "${params.currentText}"과 다른 표현으로 다양하게 생성해주세요.` : ''}
각 옵션은 글자수 제한(${maxLen}${unit})을 반드시 준수하세요.

JSON으로 응답:
{ "options": ["옵션1", "옵션2", "옵션3", "옵션4"] }`,
      },
      {
        role: 'user',
        content: `${preset?.labelKo || params.assetType} 에셋 카피 옵션을 생성해주세요.`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content || '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return [];
  const parsed = JSON.parse(match[0]);
  return Array.isArray(parsed.options) ? parsed.options : [];
}
