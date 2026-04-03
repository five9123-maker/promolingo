export type CellStatus = 'normal' | 'warning' | 'error';

export interface TranslationResult {
  assetKey: string;
  assetId: string;
  language: string;
  translation: string;
  charCount: number;
  maxAllowed: number;
  status: CellStatus;
  warnings: string[];
  alternatives: string[];
}

export interface TranslationGrid {
  [assetId: string]: {
    [languageCode: string]: TranslationResult;
  };
}

export interface TranslateRequest {
  eventSetId: string;
  assets: {
    id: string;
    assetType: string;
    sourceText: string;
    maxLength: number;
    lengthUnit: 'char' | 'byte';
  }[];
  targetLanguages: string[];
  sourceLanguage: string;
  context: {
    eventType: string;
    toneKeywords: string;
    targetAudience: string;
    keySellingPoints: string;
  };
}

export interface TranslateResponse {
  translations: TranslationResult[];
  totalTokensUsed: number;
}
