'use client';

import { useState } from 'react';
import { LANGUAGES, SOURCE_LANGUAGES, LANGUAGE_MAP } from '@/constants/languages';
import StepBadge from '@/components/common/StepBadge';

interface EventSetFormProps {
  sourceLanguage: string;
  targetLanguages: string[];
  onSourceLanguageChange: (language: string) => void;
  onTargetLanguagesChange: (languages: string[]) => void;
}

export default function EventSetForm({
  sourceLanguage,
  targetLanguages,
  onSourceLanguageChange,
  onTargetLanguagesChange,
}: EventSetFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleLanguage = (code: string) => {
    if (targetLanguages.includes(code)) {
      onTargetLanguagesChange(targetLanguages.filter((l) => l !== code));
    } else {
      onTargetLanguagesChange([...targetLanguages, code]);
    }
  };

  const selectAll = () => {
    onTargetLanguagesChange(
      LANGUAGES.filter((l) => l.code !== sourceLanguage).map((l) => l.code)
    );
  };

  const deselectAll = () => {
    onTargetLanguagesChange([]);
  };

  return (
    <div className="flex items-center gap-4 overflow-x-clip overflow-y-visible border-b border-gray-200 bg-white px-4 py-2">
      <StepBadge step={3} label="원문 언어 선택" />
      <div className="group relative flex shrink-0 items-center gap-1 rounded-md border border-gray-200">
        <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          번역 출발 언어 - &apos;원문&apos; 설정을 해주세요
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
        </div>
        {SOURCE_LANGUAGES.map((code) => {
          const lang = LANGUAGE_MAP[code];
          const isActive = sourceLanguage === code;
          return (
            <button
              key={code}
              onClick={() => onSourceLanguageChange(code)}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              } ${code === SOURCE_LANGUAGES[0] ? 'rounded-l-md' : ''} ${code === SOURCE_LANGUAGES[SOURCE_LANGUAGES.length - 1] ? 'rounded-r-md' : ''}`}
            >
              {lang?.nameKo || code}
            </button>
          );
        })}
      </div>

      <StepBadge step={4} label="출력 언어 선택" />
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50"
          >
            출력 언어 ({targetLanguages.length}개)
            <svg
              className={`h-3.5 w-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
              <div className="mb-2 flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-emerald-600 hover:underline"
                >
                  전체 선택
                </button>
                <button
                  onClick={deselectAll}
                  className="text-xs text-gray-400 hover:underline"
                >
                  전체 해제
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {LANGUAGES.filter((l) => l.code !== sourceLanguage).map((lang) => (
                  <label
                    key={lang.code}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={targetLanguages.includes(lang.code)}
                      onChange={() => toggleLanguage(lang.code)}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-gray-700">{lang.nameKo}</span>
                    <span className="text-[10px] text-gray-400">
                      {lang.code}
                    </span>
                  </label>
                ))}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="mt-2 w-full rounded bg-gray-100 py-1 text-xs text-gray-600 hover:bg-gray-200"
              >
                닫기
              </button>
            </div>
          )}
        </div>

        {targetLanguages.length > 0 && (
          <div className="flex flex-nowrap gap-1">
            {targetLanguages.map((code) => {
              const lang = LANGUAGES.find((l) => l.code === code);
              return (
                <span
                  key={code}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                >
                  {lang?.nameKo || code}
                  <button
                    onClick={() => toggleLanguage(code)}
                    className="ml-0.5 text-emerald-400 hover:text-emerald-600"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
