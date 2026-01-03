
import React, { useState, useCallback } from 'react';
import { Upload, Settings, DollarSign, Calculator, ChevronRight, LayoutGrid, Cookie } from 'lucide-react';
import { RawData, AppConfig, PriceConfig, GroupConfig, ProcessedResults, ProcessedOrder } from './types';
import FileUploader from './components/FileUploader';
import ConfigStep from './components/ConfigStep';
import PriceStep from './components/PriceStep';
import GroupStep from './components/GroupStep';
import ResultsView from './components/ResultsView';

const STEPS = [
  { id: 'upload', name: '1. 上傳', icon: Upload },
  { id: 'config', name: '2. 欄位', icon: Settings },
  { id: 'price', name: '3. 價格', icon: DollarSign },
  { id: 'group', name: '4. 分群', icon: LayoutGrid },
  { id: 'process', name: '5. 結果', icon: Calculator },
];

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [config, setConfig] = useState<AppConfig>({
    igColumn: '',
    dateColumn: '',
    shippingColumn: '取貨方式'
  });
  const [prices, setPrices] = useState<PriceConfig[]>([]);
  const [groups, setGroups] = useState<GroupConfig[]>([]);
  const [results, setResults] = useState<ProcessedResults | null>(null);

  const handleFileUpload = (data: RawData) => {
    setRawData(data);
    const headers = data.headers;
    const igIdx = headers.findIndex(h => h.toLowerCase().includes('ig') || h.includes('帳號'));
    let dateIdx = headers.findIndex(h => h.includes('面交的日期') || h.includes('取貨的日期'));
    if (dateIdx === -1) {
      dateIdx = headers.findIndex(h => h.toLowerCase().includes('時間') || h.toLowerCase().includes('日期'));
    }
    const shipIdx = headers.findIndex(h => h.toLowerCase().includes('取貨') || h.toLowerCase().includes('方式'));

    setConfig({
      igColumn: igIdx !== -1 ? headers[igIdx] : headers[0],
      dateColumn: dateIdx !== -1 ? headers[dateIdx] : (headers[1] || headers[0]),
      shippingColumn: shipIdx !== -1 ? headers[shipIdx] : '取貨方式'
    });

    const initialPrices = headers.map(h => {
      const matchName = h.match(/\[(.*?)\]/);
      const matchPrice = h.match(/\$(\d+)/);
      return {
        itemName: h,
        price: matchPrice ? parseFloat(matchPrice[1]) : 0,
        displayName: matchName ? matchName[1] : h
      };
    });
    setPrices(initialPrices);
    setCurrentStep(1);
  };

  const processData = useCallback(() => {
    if (!rawData) return;
    const { headers, rows } = rawData;
    const priceMap = new Map<string, PriceConfig>(prices.map(p => [p.itemName, p]));
    const igIdx = headers.indexOf(config.igColumn);
    const dateIdx = headers.indexOf(config.dateColumn);
    const shipIdx = headers.indexOf(config.shippingColumn);

    const results: ProcessedResults = {
      all: [],
      shipping: [],
      pickup: [],
      groups: {},
      headers: ["選項", "總額", "IG 網址", ...prices.map(p => p.displayName)]
    };

    rows.forEach((row) => {
      let totalAmount = 0;
      headers.forEach((header, idx) => {
        const pConfig = priceMap.get(header);
        if (pConfig && pConfig.price > 0) {
          const quantity = parseFloat(row[idx]) || 0;
          totalAmount += (quantity * pConfig.price);
        }
      });

      const igName = row[igIdx] || '';
      const orderDate = row[dateIdx]?.toString() || '';
      const shippingValue = row[shipIdx]?.toString() || '';
      const isPickup = shippingValue.includes('面交');

      const processed: ProcessedOrder = {
        status: "待匯款",
        totalAmount,
        igUrl: `https://www.instagram.com/${igName}`,
        originalData: row,
        shippingType: isPickup ? 'Pickup' : 'Shipping'
      };

      const group = groups.find(g => g.dates.includes(orderDate));
      if (group) {
        processed.groupKey = group.name;
        if (!results.groups[group.name]) results.groups[group.name] = [];
        results.groups[group.name].push(processed);
      }

      results.all.push(processed);
      if (isPickup) results.pickup.push(processed);
      else results.shipping.push(processed);
    });

    setResults(results);
    setCurrentStep(4);
  }, [rawData, prices, config, groups]);

  const goToNext = () => {
    if (currentStep === 3) processData();
    else setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const goToPrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF8]">
      <header className="bg-white border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cookie className="text-orange-500 w-5 h-5" />
            <h1 className="text-lg font-black text-orange-900 tracking-tight">Bakery Order Processor</h1>
          </div>
          
          <nav className="flex items-center gap-3">
            {STEPS.map((step, idx) => (
              <div key={step.id} className={`flex items-center gap-1.5 text-xs font-bold transition-all
                ${idx <= currentStep ? 'text-orange-600' : 'text-orange-200'}`}>
                <span>{step.name}</span>
                {idx < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-orange-100" />}
              </div>
            ))}
          </nav>

          <button 
            onClick={() => window.location.reload()}
            className="text-orange-300 hover:text-orange-600 text-xs font-black uppercase tracking-wider transition-colors"
          >
            重設
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-3xl shadow-xl shadow-orange-900/5 border border-orange-100 min-h-[600px] flex flex-col overflow-hidden">
          <div className="p-10 flex-1 flex flex-col">
            {currentStep === 0 && <FileUploader onUpload={handleFileUpload} />}
            {currentStep === 1 && rawData && (
              <ConfigStep 
                headers={rawData.headers} 
                config={config} 
                onChange={setConfig} 
              />
            )}
            {currentStep === 2 && (
              <PriceStep 
                prices={prices} 
                onChange={setPrices} 
              />
            )}
            {currentStep === 3 && rawData && (
              <GroupStep 
                data={rawData} 
                dateColumn={config.dateColumn}
                groups={groups} 
                onChange={setGroups} 
              />
            )}
            {currentStep === 4 && results && rawData && (
              <ResultsView 
                results={results} 
                rawData={rawData}
                prices={prices}
              />
            )}
          </div>

          {currentStep > 0 && (
            <div className="px-10 py-6 bg-orange-50/30 border-t border-orange-100 flex justify-between">
              <button
                onClick={goToPrev}
                className="px-6 py-2.5 rounded-xl border-2 border-orange-200 bg-white text-orange-700 text-sm font-black hover:bg-orange-50 transition-all active:scale-95"
              >
                上一步
              </button>
              {currentStep < 4 && (
                <button
                  onClick={goToNext}
                  className="px-8 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-black hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                >
                  {currentStep === 3 ? '完成，開始分析' : '下一步'}
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
