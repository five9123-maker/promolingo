export interface Language {
  code: string;
  name: string;
  nameKo: string;
  lengthCoefficient: { min: number; max: number };
  charType: 'single-byte' | 'multi-byte' | 'mixed';
}

export const LANGUAGES: Language[] = [
  { code: 'ko', name: 'Korean', nameKo: '한국어', lengthCoefficient: { min: 1.0, max: 1.0 }, charType: 'multi-byte' },
  { code: 'en', name: 'English', nameKo: '영어', lengthCoefficient: { min: 1.2, max: 1.5 }, charType: 'single-byte' },
  { code: 'ja', name: 'Japanese', nameKo: '일본어', lengthCoefficient: { min: 0.9, max: 1.1 }, charType: 'mixed' },
  { code: 'fr', name: 'French', nameKo: '프랑스어', lengthCoefficient: { min: 1.3, max: 1.6 }, charType: 'single-byte' },
  { code: 'th', name: 'Thai', nameKo: '태국어', lengthCoefficient: { min: 1.0, max: 1.3 }, charType: 'multi-byte' },
  { code: 'id', name: 'Indonesian', nameKo: '인도네시아어', lengthCoefficient: { min: 1.2, max: 1.5 }, charType: 'single-byte' },
  { code: 'vi', name: 'Vietnamese', nameKo: '베트남어', lengthCoefficient: { min: 1.1, max: 1.4 }, charType: 'single-byte' },
  { code: 'zh-TW', name: 'Traditional Chinese', nameKo: '중국어 번체', lengthCoefficient: { min: 0.6, max: 0.8 }, charType: 'multi-byte' },
  { code: 'es', name: 'Spanish', nameKo: '스페인어', lengthCoefficient: { min: 1.2, max: 1.5 }, charType: 'single-byte' },
  { code: 'pt', name: 'Portuguese', nameKo: '포르투갈어', lengthCoefficient: { min: 1.3, max: 1.5 }, charType: 'single-byte' },
  { code: 'zh-CN', name: 'Simplified Chinese', nameKo: '중국어 간체', lengthCoefficient: { min: 0.6, max: 0.8 }, charType: 'multi-byte' },
];

export const LANGUAGE_MAP = Object.fromEntries(
  LANGUAGES.map((lang) => [lang.code, lang])
);

export const DEFAULT_SOURCE_LANGUAGE = 'ko';

export const SOURCE_LANGUAGES = ['ko', 'en', 'ja'] as const;
export type SourceLanguageCode = (typeof SOURCE_LANGUAGES)[number];
