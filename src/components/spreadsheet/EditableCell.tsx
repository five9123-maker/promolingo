'use client';

import { useState, useRef, useEffect } from 'react';
import type { CellStatus } from '@/types/translation';

interface EditableCellProps {
  value: string;
  maxLength: number;
  status: CellStatus;
  onChange: (value: string) => void;
  placeholder?: string;
}

const STATUS_STYLES: Record<CellStatus, string> = {
  normal: 'border-transparent',
  warning: 'border-amber-300 bg-amber-50',
  error: 'border-red-300 bg-red-50',
};

export default function EditableCell({
  value,
  maxLength,
  status,
  onChange,
  placeholder = '',
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const charCount = editValue.length;
  const isOverLimit = charCount > maxLength;

  if (isEditing) {
    return (
      <div className="relative h-[52px]">
        <textarea
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => {
            setIsEditing(false);
            if (editValue !== value) {
              onChange(editValue);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setEditValue(value);
              setIsEditing(false);
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              setIsEditing(false);
              if (editValue !== value) {
                onChange(editValue);
              }
            }
          }}
          className="h-full w-full resize-none rounded border border-blue-500 bg-white p-1 text-sm outline-none ring-2 ring-blue-200"
        />
        <span
          className={`absolute bottom-1 right-1 text-[10px] ${isOverLimit ? 'text-red-500 font-semibold' : 'text-gray-400'}`}
        >
          {charCount}/{maxLength}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`group relative h-[52px] cursor-text overflow-hidden rounded border p-1 text-sm hover:border-blue-300 ${STATUS_STYLES[status]}`}
    >
      {value ? (
        <span className="line-clamp-2">{value}</span>
      ) : (
        <span className="block truncate text-gray-300">{placeholder}</span>
      )}
      <span
        className={`absolute bottom-0 right-1 text-[10px] opacity-0 group-hover:opacity-100 ${isOverLimit ? 'text-red-500 font-semibold opacity-100' : 'text-gray-400'}`}
      >
        {charCount}/{maxLength}
      </span>
    </div>
  );
}
