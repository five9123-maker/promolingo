export type GlossaryLayer = 'company' | 'category' | 'event';
export type GlossaryPriority = 'mandatory' | 'preferred' | 'reference';

export interface GlossaryEntry {
  id: string;
  sourceTerm: string;
  category: string;
  layer: GlossaryLayer;
  translations: Record<string, string>;
  priority: GlossaryPriority;
  note: string;
}

export type CautionWordType =
  | 'forbidden'
  | 'legal_risk'
  | 'sensitive'
  | 'tone_mismatch'
  | 'cultural';

export interface CautionWord {
  id: string;
  word: string;
  language: string;
  type: CautionWordType;
  description: string;
  alternatives: string[];
}
