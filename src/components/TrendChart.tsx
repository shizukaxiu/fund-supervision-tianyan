import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import type { OverviewData } from '../types';

interface TrendChartProps {
  overview: OverviewData;
}

export function TrendChart({ overview }: TrendChartProps) {
  const types = Object.entries(overview.abnormalTypeCount);
  const maxCount = Math.max(...types.map(([, count]) => count));

  return (
    <div className="tech-panel corner-decoration h-full flex flex-col p-4">
      <div className="panel-title">
        <TrendingUp className="w-4 h-4" />
        <span>异常类型分布</span>
      </div>
      
      <div className="flex-1 flex items-end justify-around gap-4 px-4 pb-2">
        {types.map(([type, count], index) => {
          const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
          const typeNames: Record<string, string> = {
            over_dose: '超量开药',
            frequent_visit: '频繁就医',
            trace_code_abnormal: '追溯码异常',
            cross_hospital: '跨院重复',
            fake_hospitalization: '虚假住院',
            over_indication: '超适应症',
          };

          return (
            <div key={type} className="flex flex-col items-center gap-2 flex-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="w-full max-w-[60px] rounded-t-md bg-cyan-500/70"
              />
              <div className="text-xs text-slate-300 text-center">{typeNames[type] || type}</div>
              <div className="text-sm font-semibold text-cyan-400">{count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
