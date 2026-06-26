import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Alert } from '../types';

interface RankBoardProps {
  alerts: Alert[];
}

export function RankBoard({ alerts }: RankBoardProps) {
  // 按医院聚合风险金额
  const hospitalRisk = alerts.reduce((acc, alert) => {
    acc[alert.hospital] = (acc[alert.hospital] || 0) + alert.amount;
    return acc;
  }, {} as Record<string, number>);

  const ranked = Object.entries(hospitalRisk)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="tech-panel corner-decoration h-full flex flex-col p-4">
      <div className="panel-title">
        <Trophy className="w-4 h-4" />
        <span>风险机构 TOP10</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {ranked.length === 0 && (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            暂无风险机构数据
          </div>
        )}
        {ranked.map(([hospital, amount], index) => (
          <motion.div
            key={hospital}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}
            className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
          >
            <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              ${index < 3 ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700 text-slate-400'}
            `}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-100 truncate">{hospital}</div>
            </div>
            <div className="text-sm font-semibold text-rose-400">
              ¥{amount.toFixed(2)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
