
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { ProcessedResults, RawData, PriceConfig, ProcessedOrder } from '../types';
import { Download, ExternalLink, Filter, AlertCircle } from 'lucide-react';

interface ResultsViewProps {
  results: ProcessedResults;
  rawData: RawData;
  prices: PriceConfig[];
}

const ResultsView: React.FC<ResultsViewProps> = ({ results, rawData, prices }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'shipping' | 'pickup' | string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // 過濾 Excel 工作表名稱中不合法的字元
  const sanitizeSheetName = (name: string) => {
    // Excel 不允許的工作表字元: \ / ? * [ ] :
    // 長度上限 31 個字元
    return name.replace(/[\\/?*[\]:]/g, '_').slice(0, 31);
  };

  const exportToExcel = async () => {
    setIsExporting(true);
    console.log("正在準備匯出資料...");
    try {
      if (!XLSX || !XLSX.utils) {
        throw new Error("Excel 函式庫尚未準備就緒");
      }

      const wb = XLSX.utils.book_new();
      
      const prepareSheetData = (orders: ProcessedOrder[]) => {
        const sheetData: any[][] = [results.headers];
        
        orders.forEach(o => {
          sheetData.push([o.status, o.totalAmount, o.igUrl, ...o.originalData]);
        });
        
        // 頁尾統計列
        const footerRow: any[] = ["總計", orders.reduce((sum, o) => sum + o.totalAmount, 0), ""];
        prices.forEach((pConfig) => {
          const colIdxInRaw = rawData.headers.indexOf(pConfig.itemName);
          let statValue = 0;
          if (colIdxInRaw !== -1) {
            if (pConfig.price > 0) {
              statValue = orders.reduce((sum, o) => sum + (parseFloat(o.originalData[colIdxInRaw]) || 0), 0);
            } else {
              statValue = orders.reduce((sum, o) => sum + (o.originalData[colIdxInRaw] ? 1 : 0), 0);
            }
          }
          footerRow.push(statValue);
        });
        sheetData.push(footerRow);
        return sheetData;
      };

      const addSheet = (name: string, orders: ProcessedOrder[], isMain = false) => {
        if (orders.length === 0 && !isMain) return;
        const data = prepareSheetData(orders);
        const ws = XLSX.utils.aoa_to_sheet(data);
        const cleanName = sanitizeSheetName(name);
        XLSX.utils.book_append_sheet(wb, ws, cleanName);
      };

      // 建立各個工作表
      addSheet("所有訂單", results.all, true);
      addSheet("寄送訂單", results.shipping);
      addSheet("面交訂單", results.pickup);
      
      // 加入分群工作表
      Object.entries(results.groups).forEach(([name, orders]) => {
        addSheet(name, orders);
      });
      
      // 下載檔案
      const fileName = `BakeryReport_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      console.log("匯出成功！檔案名稱：" + fileName);
    } catch (error) {
      console.error("匯出過程出錯：", error);
      alert("匯出失敗，請檢查瀏覽器控制台 (Console) 以獲取更多詳細資訊。錯誤訊息：" + (error instanceof Error ? error.message : "未知錯誤"));
    } finally {
      setIsExporting(false);
    }
  };

  const getActiveOrders = () => {
    if (activeTab === 'all') return results.all;
    if (activeTab === 'shipping') return results.shipping;
    if (activeTab === 'pickup') return results.pickup;
    return results.groups[activeTab] || [];
  };

  const currentOrders = getActiveOrders();
  const totalAmount = currentOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const tabs = [
    { id: 'all', name: '全部', count: results.all.length },
    { id: 'shipping', name: '寄送', count: results.shipping.length },
    { id: 'pickup', name: '面交', count: results.pickup.length },
    ...Object.keys(results.groups).map(key => ({
      id: key, name: key, count: results.groups[key].length
    }))
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-black text-orange-900 tracking-tight">報表預覽與匯出</h2>
          <p className="text-orange-700 text-sm font-medium">資料處理完成，共 {results.all.length} 筆訂單。</p>
        </div>
        <button
          onClick={exportToExcel}
          disabled={isExporting}
          className="px-6 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-black hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
        >
          {isExporting ? '處理中...' : <><Download className="w-4 h-4" /> 匯出 Excel</>}
        </button>
      </div>

      <div className="flex gap-4 mb-4 items-center">
        <Filter className="w-4 h-4 text-orange-300" />
        <div className="flex border-b border-orange-100 w-full overflow-x-auto custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-black whitespace-nowrap transition-all border-b-2
                ${activeTab === tab.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-orange-200 hover:text-orange-400'}`}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl shadow-sm">
          <p className="text-[10px] text-orange-500 font-black uppercase tracking-wider mb-1">分類金額小計</p>
          <p className="text-2xl font-black text-orange-700">NT$ {totalAmount.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-white border border-orange-100 rounded-2xl shadow-sm">
          <p className="text-[10px] text-orange-400 font-black uppercase tracking-wider mb-1">訂單數量</p>
          <p className="text-2xl font-black text-orange-900">{currentOrders.length} <span className="text-xs font-bold opacity-50">筆</span></p>
        </div>
      </div>

      <div className="border border-orange-100 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto custom-scrollbar max-h-[420px]">
          <table className="w-full text-left text-[11px] border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-[#FFF9F2] border-b border-orange-100 h-[30px]">
                <th className="px-4 py-0 font-black text-orange-800 align-middle">小計</th>
                <th className="px-4 py-0 font-black text-orange-800 align-middle">IG</th>
                {prices.map((p, i) => (
                  <th key={i} className="px-4 py-0 font-black text-orange-800 text-center align-middle whitespace-nowrap">{p.displayName}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-orange-50">
              {currentOrders.map((order, oIdx) => (
                <tr key={oIdx} className="hover:bg-orange-50/20 group">
                  <td className="px-4 py-2 font-black text-orange-900 tracking-tight whitespace-nowrap">${order.totalAmount.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <a href={order.igUrl} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline flex items-center gap-1 font-bold whitespace-nowrap">
                      @{order.igUrl.split('/').pop()} <ExternalLink className="w-3 h-3 opacity-30" />
                    </a>
                  </td>
                  {prices.map((p, hIdx) => {
                    const colIdx = rawData.headers.indexOf(p.itemName);
                    const val = order.originalData[colIdx];
                    return (
                      <td key={hIdx} className={`px-4 py-2 text-center ${val ? 'font-black text-orange-600 bg-orange-50/30' : 'text-orange-200'}`}>
                        {val || '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#FFF9F2] border-t-2 border-orange-100 sticky bottom-0 z-10">
              <tr className="h-[35px]">
                <td className="px-4 py-0 font-black text-orange-900 align-middle whitespace-nowrap">${totalAmount.toLocaleString()}</td>
                <td className="px-4 py-0"></td>
                {prices.map((p, hIdx) => {
                  const colIdx = rawData.headers.indexOf(p.itemName);
                  const stat = p.price > 0 
                    ? currentOrders.reduce((s, o) => s + (parseFloat(o.originalData[colIdx]) || 0), 0)
                    : currentOrders.reduce((s, o) => s + (o.originalData[colIdx] ? 1 : 0), 0);
                  return (
                    <td key={hIdx} className="px-4 py-0 text-center font-black text-orange-900 align-middle">
                      {stat || '-'}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs font-bold text-blue-700 leading-relaxed">
          匯出提示：系統會自動移除分群名稱中 Excel 不支援的特殊字元（如 \ / ? * [ ] :），並將其替換為底線，以確保匯出檔案能正常開啟。
        </p>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #FFF9F2;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #FED7AA;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #F97316;
        }
      `}</style>
    </div>
  );
};

export default ResultsView;
