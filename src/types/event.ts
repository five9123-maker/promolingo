export interface Asset {
  id: string;
  assetType: string;
  sourceText: string;
  maxLength: number;
  lengthUnit: 'char' | 'byte';
  langMaxLengths: Record<string, number>;
}

export interface AssetLengthOverride {
  assetType: string;
  maxLength: number;
  lengthUnit: 'char' | 'byte';
}

export interface ProjectSettings {
  targetLanguages: string[];
  assetLengthOverrides: AssetLengthOverride[];
}

export interface EventContext {
  eventType: string;
  toneKeywords: string;
  targetAudience: string;
  keySellingPoints: string;
  forbiddenExpressions: string[];
  brandVoice: string;
}

export interface EventSet {
  id: string;
  name: string;
  sourceLanguage: string;
  assets: Asset[];
  context: EventContext;
  settings: ProjectSettings;
  createdAt: string;
  updatedAt: string;
}
