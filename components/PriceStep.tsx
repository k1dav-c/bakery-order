
import React, { useRef } from 'react';
import { PriceConfig } from '../types';
import { Download, Upload as UploadIcon, Info, FileJson } from 'lucide-react';

interface PriceStepProps {
  prices: PriceConfig[];
  onChange: (prices: PriceConfig[]) => void;
}

const PriceStep: React.FC<PriceStepProps> = ({ prices, onChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = (idx: number, field: keyof PriceConfig, value: string | number) => {
    const updated = [...prices];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const exportPrices = () => {
    const dataStr = JSON.stringify(prices, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `prices_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importPrices = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string) as PriceConfig[];
        const importMap = new Map(importedData.map(item => [item.itemName, item]));
        const updatedPrices = prices.map(current => {
          const match = importMap.get(current.itemName);
          if (match) return { ...current, price: match.price ?? current.price, displayName: match.displayName ?? current.displayName };
          return current;
        });
        onChange(updatedPrices);
      } catch (err) { alert('匯入格式錯誤'); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black text-orange-900">價格與品名設定</h2>
          <p className="text-orange-700 text-sm font-medium">設定各品項於報表中顯示的名稱與單價。</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 border-2 border-orange-100 rounded-xl text-xs font-black text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition-all">
            <UploadIcon className="w-4 h-4" /> 匯入
          </button>
          <button onClick={exportPrices} className="px-4 py-2 border-2 border-orange-100 rounded-xl text-xs font-black text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition-all">
            <Download className="w-4 h-4" /> 備份
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={importPrices} />
        </div>
      </div>

      <div className="border-2 border-orange-100 rounded-2xl overflow-hidden bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#FFF9F2] border-b-2 border-orange-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-orange-800 uppercase tracking-wider">原始品項名稱 (完整顯示)</th>
              <th className="px-6 py-4 text-xs font-black text-orange-800 uppercase tracking-wider w-40 text-center">單價 (NT$)</th>
              <th className="px-6 py-4 text-xs font-black text-orange-800 uppercase tracking-wider">報表顯示名稱</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-orange-50">
            {prices.map((p, idx) => (
              <tr key={idx} className="hover:bg-orange-50/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-start gap-3">
                    <FileJson className="w-4 h-4 text-orange-300 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-bold text-orange-900 leading-tight break-words">{p.itemName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="number"
                    value={p.price}
                    onChange={(e) => handleUpdate(idx, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white text-black border-2 border-gray-200 rounded-xl text-sm font-black text-center focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all shadow-inner"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    value={p.displayName}
                    onChange={(e) => handleUpdate(idx, 'displayName', e.target.value)}
                    className="w-full px-4 py-2 bg-white text-black border-2 border-gray-200 rounded-xl text-sm font-black focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all shadow-inner"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-start gap-3 p-4 bg-orange-50 rounded-2xl border border-orange-100">
        <Info className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm font-bold text-orange-800 italic">
          提醒：黑色字體白色背景的輸入框為可編輯區域。請確實填寫品項單價。
        </p>
      </div>
    </div>
  );
};

export default PriceStep;
