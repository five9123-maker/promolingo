'use client';

import { ASSET_TYPE_PRESETS } from '@/constants/assetTypes';

interface AssetTypeSelectorProps {
  onSelect: (assetTypeKey: string) => void;
}

export default function AssetTypeSelector({ onSelect }: AssetTypeSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2 p-2">
      {ASSET_TYPE_PRESETS.map((preset) => (
        <button
          key={preset.key}
          onClick={() => onSelect(preset.key)}
          className="rounded-md border border-gray-200 px-3 py-2 text-left text-sm hover:border-emerald-300 hover:bg-emerald-50"
        >
          <div className="font-medium text-gray-700">{preset.labelKo}</div>
          <div className="text-[10px] text-gray-400">
            max {preset.maxLength}
            {preset.lengthUnit === 'byte' ? 'bytes' : '자'}
          </div>
        </button>
      ))}
    </div>
  );
}
