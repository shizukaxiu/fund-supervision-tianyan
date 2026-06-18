import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bell, Filter, Search, X } from 'lucide-react';
import type { Alert } from '../types';
import { getRiskLevelColor } from '../utils/formatters';

interface AlertListProps {
  alerts: Alert[];
  selectedAlert: Alert | null;
  onSelectAlert: (alert: Alert | null) => void;
}

const LEVELS = ['全部', '极高', '高', '中', '低'] as const;
type LevelFilter = typeof LEVELS[number];

export function AlertList({ alerts, selectedAlert, onSelectAlert }: AlertListProps) {
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('全部');
  const [searchQuery, setSearchQuery] = useState('');

  // 根据等级和搜索关键词筛选告警
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // 等级筛选
      const levelMatch = levelFilter === '全部' || alert.level === levelFilter;
      
      // 搜索筛选
      const query = searchQuery.trim().toLowerCase();
      if (!query) return levelMatch;
      
      const searchMatch =
        alert.type.toLowerCase().includes(query) ||
        alert.hospital.toLowerCase().includes(query) ||
        alert.patient.toLowerCase().includes(query) ||
        alert.doctor.toLowerCase().includes(query) ||
        alert.id.toLowerCase().includes(query) ||
        alert.district.toLowerCase().includes(query);
      
      return levelMatch && searchMatch;
    });
  }, [alerts, levelFilter, searchQuery]);

  // 统计各等级数量（不受搜索影响，只按原始数据）
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { '全部': alerts.length };
    LEVELS.slice(1).forEach(level => {
      counts[level] = alerts.filter(a => a.level === level).length;
    });
    return counts;
  }, [alerts]);

  return (
    <div className="tech-panel corner-decoration h-full flex flex-col p-4">
      <div className="panel-title">
        <Bell className="w-4 h-4" />
        <span>实时告警中心</span>
        <span className="ml-auto text-xs text-slate-500">
          {filteredAlerts.length} / {alerts.length} 条
        </span>
      </div>

      {/* 搜索框 */}
      <div className="mb-3 relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索告警类型、医院、患者..."
          className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-slate-800/40 border border-slate-700/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 等级筛选器 */}
      <div className="mb-3">
        <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
          <Filter className="w-3 h-3" />
          <span>风险等级筛选</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`
                px-2 py-1 rounded text-xs border transition-all duration-200
                ${levelFilter === level
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600'
                }
              `}
            >
              {level}
              <span className="ml-1 text-slate-500">({levelCounts[level] || 0})</span>
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {filteredAlerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => onSelectAlert(selectedAlert?.id === alert.id ? null : alert)}
            className={`
              p-3 rounded-lg cursor-pointer border transition-all duration-200
              ${selectedAlert?.id === alert.id 
                ? 'bg-cyan-500/10 border-cyan-500/40' 
                : alert.status === '新发现'
                ? 'bg-rose-500/10 border-rose-500/40 animate-pulse-slow'
                : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
              }
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">{alert.id}</span>
              <span className={`text-xs px-2 py-0.5 rounded border ${getRiskLevelColor(alert.level)}`}>
                {alert.level}
              </span>
            </div>
            <div className="text-sm text-slate-200 font-medium truncate">
              {alert.type}
            </div>
            <div className="text-xs text-slate-400 truncate mt-1">
              {alert.hospital} · {alert.patient}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {alert.time}
            </div>
          </motion.div>
        ))}

        {filteredAlerts.length === 0 && (
          <div className="text-center text-slate-500 text-sm py-8">
            暂无符合条件的数据
          </div>
        )}
      </div>
    </div>
  );
}
