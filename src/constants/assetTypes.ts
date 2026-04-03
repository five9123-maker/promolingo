export interface AssetTypePreset {
  key: string;
  label: string;
  labelKo: string;
  description: string;
  maxLength: number;
  lengthUnit: 'char' | 'byte';
  assetCorrectionFactor: number;
  characteristics: string;
}

export const ASSET_TYPE_PRESETS: AssetTypePreset[] = [
  {
    key: 'banner_headline',
    label: 'Banner Headline',
    labelKo: '메인 배너 헤드카피',
    description: 'Main banner headline copy',
    maxLength: 20,
    lengthUnit: 'char',
    assetCorrectionFactor: 1.0,
    characteristics: '임팩트 최우선',
  },
  {
    key: 'banner_sub',
    label: 'Banner Sub',
    labelKo: '배너 서브카피',
    description: 'Banner sub-headline copy',
    maxLength: 40,
    lengthUnit: 'char',
    assetCorrectionFactor: 1.0,
    characteristics: '보조 설명',
  },
  {
    key: 'cta_button',
    label: 'CTA Button',
    labelKo: 'CTA 버튼 텍스트',
    description: 'Call-to-action button text',
    maxLength: 8,
    lengthUnit: 'char',
    assetCorrectionFactor: 1.1,
    characteristics: '초압축',
  },
  {
    key: 'coupon_name',
    label: 'Coupon Name',
    labelKo: '쿠폰 타이틀',
    description: 'Coupon title including discount rate',
    maxLength: 15,
    lengthUnit: 'char',
    assetCorrectionFactor: 1.0,
    characteristics: '할인율 포함',
  },
  {
    key: 'push_title',
    label: 'Push Title',
    labelKo: '앱 푸시 제목',
    description: 'App push notification title',
    maxLength: 25,
    lengthUnit: 'char',
    assetCorrectionFactor: 1.0,
    characteristics: '말줄임 주의',
  },
  {
    key: 'push_body',
    label: 'Push Body',
    labelKo: '앱 푸시 본문',
    description: 'App push notification body',
    maxLength: 60,
    lengthUnit: 'char',
    assetCorrectionFactor: 1.0,
    characteristics: '',
  },
  {
    key: 'product_badge',
    label: 'Product Badge',
    labelKo: '상품 뱃지',
    description: 'Product badge label',
    maxLength: 6,
    lengthUnit: 'char',
    assetCorrectionFactor: 1.0,
    characteristics: '극도로 짧음',
  },
  {
    key: 'event_desc',
    label: 'Event Description',
    labelKo: '이벤트 설명',
    description: 'Event description text',
    maxLength: 200,
    lengthUnit: 'char',
    assetCorrectionFactor: 1.0,
    characteristics: '줄바꿈 허용',
  },
  {
    key: 'seo_title',
    label: 'SEO Title',
    labelKo: 'SEO 타이틀',
    description: 'SEO title tag',
    maxLength: 60,
    lengthUnit: 'byte',
    assetCorrectionFactor: 1.0,
    characteristics: 'byte 기준',
  },
  {
    key: 'seo_desc',
    label: 'SEO Description',
    labelKo: 'SEO 디스크립션',
    description: 'SEO meta description',
    maxLength: 160,
    lengthUnit: 'byte',
    assetCorrectionFactor: 1.0,
    characteristics: 'byte 기준',
  },
  {
    key: 'custom',
    label: 'Custom',
    labelKo: '사용자 지정',
    description: 'User-defined asset type',
    maxLength: 100,
    lengthUnit: 'char',
    assetCorrectionFactor: 1.0,
    characteristics: '직접 입력',
  },
];

export const ASSET_TYPE_MAP = Object.fromEntries(
  ASSET_TYPE_PRESETS.map((preset) => [preset.key, preset])
);
