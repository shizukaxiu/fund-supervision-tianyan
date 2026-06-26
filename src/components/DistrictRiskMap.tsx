import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { OverviewData } from '../types';


interface DistrictRiskMapProps {
  overview: OverviewData | null;
}

export function DistrictRiskMap({ overview }: DistrictRiskMapProps) {
  const districts = overview ? Object.entries(overview.districtRisk).sort((a, b) => b[1] - a[1]) : [];
  const maxValue = districts.length > 0 ? Math.max(...districts.map(([, value]) => value)) : 1;

  return (
    <div className="tech-panel corner-decoration h-full flex flex-col p-4">
      <div className="panel-title">
        <MapPin className="w-4 h-4" />
        <span>南京市各区风险分布</span>
      </div>
      
      <div className="flex-1 grid grid-cols-2 gap-3 content-start">
        {districts.length === 0 && (
          <div className="col-span-2 flex items-center justify-center text-slate-500 text-sm">
            暂无风险分布数据
          </div>
        )}
        {districts.map(([district, value], index) => {
          const intensity = maxValue > 0 ? value / maxValue : 0;
          
          return (
            <motion.div
              key={district}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-200">{district}</span>
                <span className="text-sm font-semibold text-slate-100">
                  {value} 条
                </span>
              </div>
              <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${intensity * 100}%` }}
                  transition={{ duration: 1, delay: 0.3 + index * 0.05 }}
                  className="h-full rounded-full bg-cyan-500/80"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
