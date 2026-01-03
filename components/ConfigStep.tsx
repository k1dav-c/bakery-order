
import React from 'react';
import { AppConfig } from '../types';
import { User, Calendar, MapPin, ChevronRight } from 'lucide-react';

interface ConfigStepProps {
  headers: string[];
  config: AppConfig;
  onChange: (config: AppConfig) => void;
}

const ConfigStep: React.FC<ConfigStepProps> = ({ headers, config, onChange }) => {
  const handleChange = (field: keyof AppConfig, value: string) => {
    onChange({ ...config, [field]: value });
  };

  const fields = [
    { key: 'igColumn', label: 'IG 名稱欄位', icon: User, desc: '對應訂購者的 Instagram 帳號' },
    { key: 'dateColumn', label: '日期/時間欄位', icon: Calendar, desc: '用於面交梯次或出貨日期' },
    { key: 'shippingColumn', label: '取貨方式欄位', icon: MapPin, desc: '區分面交（包含「面交」字樣）與寄送' },
  ];

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-black text-[#7C2D12] mb-3">欄位對應設定</h2>
        <p className="text-[#9A3412] font-bold">告訴系統哪些欄位是訂單的關鍵資訊。</p>
      </div>

      <div className="space-y-6">
        {fields.map((field) => (
          <div key={field.key} className="p-8 bg-white border-2 border-[#FFD8A8] rounded-[2rem] shadow-sm hover:border-[#F97316] transition-all">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-[#FFEDD5] rounded-2xl border-2 border-[#FB923C]/30">
                <field.icon className="w-7 h-7 text-[#F97316]" />
              </div>
              <div className="flex-1">
                <label className="block text-base font-black text-[#7C2D12] mb-1">{field.label}</label>
                <p className="text-xs text-[#9A3412] mb-5 font-bold">{field.desc}</p>
                <div className="relative group">
                  <select
                    value={config[field.key as keyof AppConfig]}
                    onChange={(e) => handleChange(field.key as keyof AppConfig, e.target.value)}
                    className="w-full bg-[#FFF9F2] border-2 border-[#FFD8A8] rounded-2xl px-6 py-4 text-sm font-black text-[#7C2D12] focus:ring-4 focus:ring-[#F97316]/10 focus:border-[#F97316] transition-all outline-none appearance-none cursor-pointer group-hover:bg-white"
                  >
                    {headers.map((h, idx) => (
                      <option key={idx} value={h}>{h}</option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#F97316]">
                    <ChevronRight className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConfigStep;
