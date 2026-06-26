import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import type { OverviewData } from '../types';

interface TrendChartProps {
  overview: OverviewData | null;
}

const TYPE_NAMES: Record<string, string> = {
  over_dose: '超量开药',
  frequent_visit: '频繁就医',
  trace_code_abnormal: '追溯码异常',
  cross_hospital: '跨院重复',
  fake_hospitalization: '虚假住院',
  over_indication: '超适应症',
};

const TYPE_COLORS: Record<string, string> = {
  over_dose: 'bg-amber-500',
  frequent_visit: 'bg-cyan-500',
  trace_code_abnormal: 'bg-rose-500',
  cross_hospital: 'bg-orange-500',
  fake_hospitalization: 'bg-purple-500',
  over_indication: 'bg-emerald-500',
};

export function TrendChart({ overview }: TrendChartProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const types = useMemo(() => overview ? Object.entries(overview.abnormalTypeCount) : [], [overview]);
  const maxCount = useMemo(() => Math.max(1, ...types.map(([, count]) => count)), [types]);
  const totalCount = useMemo(() => types.reduce((sum, [, count]) => sum + count, 0), [types]);

  return (
    <div className="tech-panel corner-decoration h-full flex flex-col p-4">
      <div className="panel-title">
        <TrendingUp className="w-4 h-4" />
        <span>异常类型分布</span>
        <span className="ml-auto text-xs text-slate-400">共 {totalCount} 条异常</span>
      </div>

      {types.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm mt-2">
          暂无异常类型数据
        </div>
      )}

      {types.length > 0 && (
      <div className="flex-1 min-h-0 flex gap-3 mt-2">
        {/* Y 轴 */}
        <div className="flex flex-col justify-between text-[10px] text-slate-500 py-1 pr-1 text-right w-8 shrink-0">
          <span>{maxCount}</span>
          <span>{Math.round(maxCount / 2)}</span>
          <span>0</span>
        </div>

        {/* 图表主体 */}
        <div className="flex-1 relative flex flex-col">
          {/* 网格线 */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-full border-t border-slate-700/40"
                style={{ top: `${(i / 2) * 100}%` }}
              />
            ))}
          </div>

          {/* 柱状图 */}
          <div className="flex-1 flex items-end justify-around gap-2 sm:gap-4 z-10 px-1">
            {types.map(([type, count], index) => {
              const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const colorClass = TYPE_COLORS[type] || 'bg-cyan-500';
              const label = TYPE_NAMES[type] || type;
              const percent = totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : '0.0';
              const isHovered = hovered === type;

              return (
                <div
                  key={type}
                  className="relative flex flex-col items-center gap-1 flex-1 min-w-0 h-full justify-end group"
                  onMouseEnter={() => setHovered(type)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* 数值 & 占比 */}
                  <div
                    className={`text-[10px] sm:text-xs font-semibold transition-colors ${
                      isHovered ? 'text-slate-100' : 'text-slate-400'
                    }`}
                  >
                    {count}
                  </div>

                  {/* 柱体轨道 */}
                  <div className="w-full max-w-[56px] h-full flex items-end rounded-t-md bg-slate-800/40 overflow-hidden">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.6, delay: index * 0.08 }}
                      className={`w-full rounded-t-md ${colorClass} opacity-80 group-hover:opacity-100 transition-opacity`}
                      title={`${label}: ${count} 条（占比 ${percent}%）`}
                    />
                  </div>

                  {/* 类型标签 */}
                  <div className="text-[10px] sm:text-xs text-slate-300 text-center truncate w-full">
                    {label}
                  </div>

                  {/* 悬浮提示 */}
                  <div
                    className={`absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] bg-slate-800 border border-slate-600 text-slate-200 whitespace-nowrap pointer-events-none transition-opacity z-20 ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {label}: {count} 条 ({percent}%)
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
