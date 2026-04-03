'use client';

import { useState, useCallback, useRef } from 'react';
import Header from '@/components/layout/Header';
import SpreadsheetGrid from '@/components/spreadsheet/SpreadsheetGrid';
import BriefSidePanel from '@/components/brief/BriefSidePanel';
import AssetConfigModal, {
  type AssetConfigItem,
} from '@/components/event/AssetConfigModal';
import Modal from '@/components/common/Modal';
import AssetTypeSelector from '@/components/event/AssetTypeSelector';
import AssetPresetDBModal from '@/components/settings/AssetPresetDBModal';
import Toast from '@/components/common/Toast';
import TutorialOverlay from '@/components/onboarding/TutorialOverlay';
import { useSpreadsheet } from '@/hooks/useSpreadsheet';
import { useTranslation } from '@/hooks/useTranslation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { generateCSV, downloadCSV } from '@/lib/csv';
import { LANGUAGES, SOURCE_LANGUAGES, LANGUAGE_MAP } from '@/constants/languages';
import type { BriefAnalysisResult } from '@/lib/openai';

function getDefaultTargetLanguages(sourceLanguage: string) {
  return LANGUAGES.filter((l) => l.code !== sourceLanguage).map((l) => l.code);
}

interface EventContext {
  eventType: string;
  toneKeywords: string;
  targetAudience: string;
  keySellingPoints: string;
}

const DEFAULT_CONTEXT: EventContext = {
  eventType: '일반 프로모션',
  toneKeywords: '기본',
  targetAudience: '일반',
  keySellingPoints: '',
};

export default function Home() {
  const [eventName, setEventName] = useLocalStorage('promolingo_eventName', '');
  const [sourceLanguage, setSourceLanguage] = useLocalStorage('promolingo_sourceLanguage', 'ko');
  const [targetLanguages, setTargetLanguages] = useLocalStorage<string[]>(
    'promolingo_targetLanguages',
    getDefaultTargetLanguages('ko')
  );
  const [tutorialSeen, setTutorialSeen] = useLocalStorage('promolingo_tutorial_seen', false);
  const [showTutorial, setShowTutorial] = useState(!tutorialSeen);
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [showPresetSettings, setShowPresetSettings] = useState(false);
  const [assetConfigModal, setAssetConfigModal] = useState<{
    isOpen: boolean;
    items: AssetConfigItem[];
    title?: string;
    subtitle?: string;
  }>({ isOpen: false, items: [] });
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // 원문 언어 변경 → 출력 언어에서 제외
  const handleSourceLanguageChange = useCallback(
    (lang: string) => {
      setSourceLanguage(lang);
      // Remove new source language from targets, add old source language back
      setTargetLanguages((prev) => {
        const filtered = prev.filter((l) => l !== lang);
        if (!filtered.includes(sourceLanguage) && sourceLanguage !== lang) {
          filtered.push(sourceLanguage);
        }
        return filtered;
      });
    },
    [sourceLanguage, setSourceLanguage, setTargetLanguages]
  );

  // 기획서 분석 결과 컨텍스트
  const eventContext = useRef<EventContext>(DEFAULT_CONTEXT);

  const { assets, addAsset, updateAsset, removeAsset, updateLangMaxLength, ensureLangMaxLengths } =
    useSpreadsheet();

  const { grid, isLoading, error, translate, updateCell } = useTranslation();

  // 기획서 분석 완료 → 이벤트명 + 컨텍스트 설정
  const handleAnalysisComplete = useCallback(
    (result: BriefAnalysisResult) => {
      if (result.eventName && !eventName) {
        setEventName(result.eventName);
      }
      eventContext.current = {
        eventType: result.eventType || DEFAULT_CONTEXT.eventType,
        toneKeywords: result.toneKeywords || DEFAULT_CONTEXT.toneKeywords,
        targetAudience: result.targetAudience || DEFAULT_CONTEXT.targetAudience,
        keySellingPoints: result.keySellingPoints || DEFAULT_CONTEXT.keySellingPoints,
      };
    },
    [eventName, setEventName]
  );

  // 사이드패널에서 에셋 확정
  const handleSidePanelAssetsConfirm = useCallback(
    (panelAssets: { assetType: string; maxLength: number; suggestedSourceText?: string }[]) => {
      for (const item of panelAssets) {
        const newAsset = addAsset(item.assetType, item.suggestedSourceText || '', targetLanguages);
        if (newAsset && item.maxLength !== newAsset.maxLength) {
          updateAsset(newAsset.id, { maxLength: item.maxLength });
        }
      }
      setToast({
        message: `${panelAssets.length}개 에셋이 추가되었습니다`,
        type: 'success',
      });
    },
    [addAsset, updateAsset, targetLanguages]
  );

  // AssetConfigModal에서 확정 → 에셋 일괄 추가
  const handleAssetConfigConfirm = useCallback(
    (items: AssetConfigItem[]) => {
      for (const item of items) {
        const newAsset = addAsset(item.assetType, '', targetLanguages);
        if (newAsset && item.maxLength !== newAsset.maxLength) {
          updateAsset(newAsset.id, { maxLength: item.maxLength });
        }
      }
      setAssetConfigModal({ isOpen: false, items: [] });
      setToast({
        message: `${items.length}개 에셋이 추가되었습니다`,
        type: 'success',
      });
    },
    [addAsset, updateAsset, targetLanguages]
  );

  // 단순 에셋 추가
  const handleAddAsset = useCallback(
    (assetType: string) => {
      addAsset(assetType, '', targetLanguages);
      setShowAssetSelector(false);
    },
    [addAsset, targetLanguages]
  );

  const handleTranslate = useCallback(async () => {
    const assetsWithText = assets.filter((a) => a.sourceText.trim());
    if (assetsWithText.length === 0) {
      setToast({ message: '원문이 입력된 에셋이 없습니다', type: 'info' });
      return;
    }
    if (targetLanguages.length === 0) {
      setToast({ message: '출력 언어를 선택해주세요', type: 'info' });
      return;
    }

    try {
      await translate({
        eventSetId: 'current',
        assets: assetsWithText.map((a) => ({
          id: a.id,
          assetType: a.assetType,
          sourceText: a.sourceText,
          maxLength: a.maxLength,
          lengthUnit: a.lengthUnit,
        })),
        targetLanguages,
        sourceLanguage,
        context: eventContext.current,
      });
      setToast({ message: '번역이 완료되었습니다', type: 'success' });
    } catch {
      setToast({
        message: error || '번역 중 오류가 발생했습니다',
        type: 'error',
      });
    }
  }, [assets, targetLanguages, sourceLanguage, translate, error]);

  const handleRetranslateError = useCallback((message: string) => {
    setToast({ message, type: 'error' });
  }, []);

  const handleDownloadCSV = useCallback(() => {
    if (assets.length === 0) return;
    const csv = generateCSV({
      eventName: eventName || 'untitled',
      assets,
      translations: grid,
      targetLanguages,
      sourceLanguage,
    });
    const filename = `${eventName || 'promolingo'}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(csv, filename);
    setToast({ message: 'CSV 다운로드 완료', type: 'success' });
  }, [assets, eventName, grid, targetLanguages, sourceLanguage]);

  return (
    <div className="flex h-screen flex-col">
      <Header
        onTranslate={handleTranslate}
        onDownloadCSV={handleDownloadCSV}
        isTranslating={isLoading}
        assetCount={assets.length}
        hasSourceText={assets.some((a) => a.sourceText.trim())}
        eventName={eventName}
        onEventNameChange={setEventName}
        onShowTutorial={() => setShowTutorial(true)}
      />
      {/* Main content: side panel + spreadsheet */}
      <div className="flex flex-1 overflow-hidden">
        <BriefSidePanel
          onAnalysisComplete={handleAnalysisComplete}
          onAssetsConfirm={handleSidePanelAssetsConfirm}
          onAddAsset={() => setShowAssetSelector(true)}
          onEventNameChange={setEventName}
        />
        <SpreadsheetGrid
          assets={assets}
          sourceLanguage={sourceLanguage}
          targetLanguages={targetLanguages}
          translations={grid}
          isLoading={isLoading}
          eventContext={eventContext.current}
          eventName={eventName}
          onSourceTextChange={(id, text) => updateAsset(id, { sourceText: text })}
          onTranslationChange={updateCell}
          onMaxLengthChange={(id, maxLength) => updateAsset(id, { maxLength })}
          onLangMaxLengthChange={updateLangMaxLength}
          onRemoveAsset={removeAsset}
          onRetranslateError={handleRetranslateError}
          onSourceLanguageChange={handleSourceLanguageChange}
          onTargetLanguagesChange={(langs) => {
            setTargetLanguages(langs);
            ensureLangMaxLengths(langs);
          }}
        />
      </div>

      {/* AI 분석 결과 에셋 설정 모달 */}
      <AssetConfigModal
        isOpen={assetConfigModal.isOpen}
        onClose={() => setAssetConfigModal({ isOpen: false, items: [] })}
        onConfirm={handleAssetConfigConfirm}
        initialItems={assetConfigModal.items}
        title={assetConfigModal.title}
        subtitle={assetConfigModal.subtitle}
      />

      {/* 기존 단순 에셋 추가 모달 */}
      <Modal
        isOpen={showAssetSelector}
        onClose={() => setShowAssetSelector(false)}
        title="에셋(구좌) 타입 선택"
        headerAction={
          <button
            onClick={() => setShowPresetSettings(true)}
            className="flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 text-[11px] text-gray-500 hover:bg-gray-50"
            title="프리셋 설정"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            프리셋 설정
          </button>
        }
      >
        <AssetTypeSelector onSelect={handleAddAsset} />
      </Modal>

      <AssetPresetDBModal
        isOpen={showPresetSettings}
        onClose={() => setShowPresetSettings(false)}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <TutorialOverlay
        isOpen={showTutorial}
        onClose={() => {
          setShowTutorial(false);
          setTutorialSeen(true);
        }}
      />
    </div>
  );
}
