import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import type { Alert } from '../types';

interface RiskReportProps {
  alert: Alert | null;
}

export function RiskReport({ alert }: RiskReportProps) {
  if (!alert) {
    return (
      <div className="tech-panel corner-decoration h-full flex flex-col p-4">
        <div className="panel-title">
          <FileText className="w-4 h-4" />
          <span>AI 风险研判</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          点击左侧告警查看详细研判报告
        </div>
      </div>
    );
  }

  return (
    <div className="tech-panel corner-decoration h-full flex flex-col p-4">
      <div className="panel-title">
        <FileText className="w-4 h-4" />
        <span>AI 风险研判</span>
      </div>
      
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 space-y-3 overflow-y-auto"
      >
        <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">异常类型</div>
          <div className="text-base text-slate-200 font-medium">{alert.type}</div>
        </div>
        
        <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">风险等级</div>
          <div className="text-base text-rose-400 font-medium">{alert.level}</div>
        </div>
        
        <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">涉及金额</div>
          <div className="text-base text-cyan-400 font-medium">¥{alert.amount.toFixed(2)}</div>
        </div>
        
        <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">异常说明</div>
          <div className="text-sm text-slate-300 leading-relaxed">{alert.reason}</div>
        </div>
      </motion.div>
    </div>
  );
}
