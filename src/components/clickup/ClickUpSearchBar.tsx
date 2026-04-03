'use client';

import { useState } from 'react';
import StepBadge from '@/components/common/StepBadge';

export default function ClickUpSearchBar() {
  const [query, setQuery] = useState('');
  const [showNotice, setShowNotice] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setShowNotice(true);
    setTimeout(() => setShowNotice(false), 2500);
  };

  return (
    <div className="border-b border-gray-200 px-3 py-2">
      <div className="flex items-center gap-1.5">
        <StepBadge step={1} label="ClickUp 카드 불러오기" />
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0"
          fill="none"
        >
          <path
            d="M4.5 16.5L8.5 13L12 16L15.5 13L19.5 16.5"
            stroke="#7B68EE"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 11L12 6.5L17 11"
            stroke="#7B68EE"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          placeholder="ClickUp Task ID / URL"
          className="min-w-0 flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 placeholder-gray-400 outline-none focus:border-[#7B68EE] focus:ring-1 focus:ring-[#7B68EE]/30"
        />
        <button
          onClick={handleSearch}
          className="shrink-0 rounded bg-[#7B68EE] px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-[#6A5ACD] active:bg-[#5B4DBF]"
        >
          불러오기
        </button>
      </div>
      {showNotice && (
        <p className="mt-1.5 text-center text-[10px] text-[#7B68EE]">
          ClickUp API 연동 준비 중입니다
        </p>
      )}
    </div>
  );
}
