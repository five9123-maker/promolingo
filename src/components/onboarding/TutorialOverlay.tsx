'use client';

import { useState } from 'react';

const STEPS = [
  {
    step: 1,
    title: 'ClickUp 카드 불러오기',
    description:
      'ClickUp에서 할당받은 태스크 카드를 검색하여 이벤트 개요와 구좌(에셋) 정보를 자동으로 가져옵니다.',
    icon: '🔍',
  },
  {
    step: 2,
    title: '기획서 AI 분석',
    description:
      'Wiki 기획서 또는 텍스트를 입력하면 AI가 이벤트의 목적, 타겟, 톤앤매너를 분석하고 에셋별 원문 초안을 자동 생성합니다.',
    icon: '🤖',
  },
  {
    step: 3,
    title: '원문 언어 선택',
    description:
      '번역의 출발 언어를 선택합니다. 한국어, 영어, 일본어 중 하나를 원문 언어로 지정하세요.',
    icon: '🌐',
  },
  {
    step: 4,
    title: '출력 언어 선택',
    description:
      '번역할 대상 언어를 선택합니다. 일본어, 프랑스어, 태국어 등 필요한 언어를 복수 선택할 수 있습니다.',
    icon: '🗣️',
  },
  {
    step: 5,
    title: '번역하기',
    description:
      '원문과 기획서 분석 컨텍스트를 바탕으로 AI가 선택한 모든 언어로 동시에 번역을 수행합니다.',
    icon: '⚡',
  },
  {
    step: 6,
    title: '시트에서 수정',
    description:
      '번역 결과를 시트에서 직접 확인하고, 재생성(↻)이나 글자수 줄이기(✂) 등의 도구로 최종 결과물을 다듬습니다.',
    icon: '✏️',
  },
  {
    step: 7,
    title: 'CSV 다운로드',
    description:
      '완성된 번역 결과를 CSV 파일로 내보내 실제 프로모션에 적용합니다.',
    icon: '📥',
  },
  {
    step: '⚙',
    title: '관리자 설정',
    description:
      '헤더 우측 ⚙ 버튼에서 관리자 설정에 접근할 수 있습니다.\n\n• 번역 TMS 관리 — 글로서리, 금칙어, 번역 지침 프롬프트 등 전체 번역 품질을 관리합니다.\n• 구좌 프리셋 관리 — 구좌별 역할 정의와 언어별 글자수 제한을 설정합니다.',
    icon: '🛠️',
  },
];

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TutorialOverlay({ isOpen, onClose }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === STEPS.length - 1;

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Progress dots */}
        <div className="mb-5 flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === currentStep
                  ? 'w-6 bg-emerald-600'
                  : i < currentStep
                    ? 'w-1.5 bg-emerald-300'
                    : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="text-center">
          <div className="mb-3 text-4xl">{step.icon}</div>
          <div className="mb-1 flex items-center justify-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              {step.step}
            </span>
            <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
          </div>
          <p className={`mt-3 whitespace-pre-line text-sm leading-relaxed text-gray-600 ${typeof step.step === 'string' ? 'text-left' : ''}`}>
            {step.description}
          </p>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleClose}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            건너뛰기
          </button>

          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={() => setCurrentStep((s) => s - 1)}
                className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                이전
              </button>
            )}
            {isLast ? (
              <button
                onClick={handleClose}
                className="rounded-lg bg-emerald-600 px-5 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                시작하기
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep((s) => s + 1)}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                다음
              </button>
            )}
          </div>
        </div>

        {/* Step counter */}
        <p className="mt-4 text-center text-[11px] text-gray-400">
          {currentStep + 1} / {STEPS.length}
        </p>
      </div>
    </div>
  );
}
