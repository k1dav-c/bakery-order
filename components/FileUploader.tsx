
import React from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { RawData } from '../types';

interface FileUploaderProps {
  onUpload: (data: RawData) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUpload }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }) as any[][];
      
      if (data.length > 0) {
        onUpload({
          headers: data[0].map(h => String(h || '')),
          rows: data.slice(1).filter(row => row.some(cell => cell !== null && cell !== ''))
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-md mx-auto py-20 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-50 text-orange-500 rounded-full mb-4">
        <Upload className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">上傳訂單 Excel</h2>
      <p className="text-gray-500 text-sm mb-8">請選擇您要處理的 Bakery 訂單匯出檔。</p>
      
      <label className="block">
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-12 hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer">
          <FileSpreadsheet className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-600">點擊選取檔案</p>
          <p className="text-xs text-gray-400 mt-1">支援 XLSX, CSV</p>
          <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
        </div>
      </label>

      <div className="mt-8 text-left bg-blue-50 p-4 rounded-md border border-blue-100">
        <p className="text-xs text-blue-700 leading-relaxed">
          <strong>小提醒：</strong> 第一列需為標題。若品項名稱包含如 "$50" 的字樣，系統會自動嘗試辨識為單價。
        </p>
      </div>
    </div>
  );
};

export default FileUploader;
