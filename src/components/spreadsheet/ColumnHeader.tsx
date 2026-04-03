'use client';

import { LANGUAGE_MAP } from '@/constants/languages';

interface ColumnHeaderProps {
  languageCode: string;
}

export default function ColumnHeader({ languageCode }: ColumnHeaderProps) {
  const lang = LANGUAGE_MAP[languageCode];
  if (!lang) return <span>{languageCode}</span>;

  return (
    <span className="text-xs font-semibold text-gray-700">{lang.code.toUpperCase()}</span>
  );
}
