'use client';

import { useState } from 'react';
import StepBadge from '@/components/common/StepBadge';

interface ClickUpSearchBarProps {
  onTaskLoaded?: (data: { title: string }) => void;
}

export default function ClickUpSearchBar({ onTaskLoaded }: ClickUpSearchBarProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    // ClickUp API 연동 전 — 입력값을 AI로 요약하여 이벤트 타이틀 생성
    setIsLoading(true);
    try {
      const res = await fetch('/api/summarize-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: query.trim() }),
      });
      if (res.ok) {
        const { title } = await res.json();
        onTaskLoaded?.({ title });
      } else {
        setShowNotice(true);
        setTimeout(() => setShowNotice(false), 2500);
      }
    } catch {
      setShowNotice(true);
      setTimeout(() => setShowNotice(false), 2500);
    } finally {
      setIsLoading(false);
    }
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
          disabled={isLoading}
        />
        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="shrink-0 rounded bg-[#7B68EE] px-2 py-1 text-[11px] font-medium text-white transition-colors hover:bg-[#6A5ACD] active:bg-[#5B4DBF] disabled:opacity-50"
        >
          {isLoading ? '...' : '불러오기'}
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
