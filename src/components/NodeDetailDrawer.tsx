import { motion } from 'framer-motion';
import { X, User, Stethoscope, Building2, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import type { MedicalRecord, NetworkNode } from '../types';
import { formatCurrency } from '../utils/formatters';

interface NodeDetailDrawerProps {
  node: NetworkNode | null;
  records: MedicalRecord[];
  onClose: () => void;
}

export function NodeDetailDrawer({ node, records, onClose }: NodeDetailDrawerProps) {
  if (!node) return null;

  // 根据节点类型筛选相关记录
  const relatedRecords = records.filter(r => {
    if (node.type === 'patient') return r.patientId === node.id;
    if (node.type === 'doctor') return r.doctorId === node.id;
    if (node.type === 'hospital') return r.hospitalId === node.id;
    return false;
  });

  const abnormalRecords = relatedRecords.filter(r => r.abnormalType);
  const totalAmount = relatedRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  const abnormalAmount = abnormalRecords.reduce((sum, r) => sum + r.totalAmount, 0);

  // 获取节点图标
  const getIcon = () => {
    switch (node.type) {
      case 'patient': return <User className="w-5 h-5" />;
      case 'doctor': return <Stethoscope className="w-5 h-5" />;
      case 'hospital': return <Building2 className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  // 获取节点类型中文
  const getTypeName = () => {
    switch (node.type) {
      case 'patient': return '患者';
      case 'doctor': return '医生';
      case 'hospital': return '医院';
      default: return '未知';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 flex justify-end pointer-events-none"
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-80 h-full tech-panel border-l border-cyan-500/15 pointer-events-auto flex flex-col"
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/15 text-cyan-400">
              {getIcon()}
            </div>
            <div>
              <div className="text-xs text-slate-400">{getTypeName()}详情</div>
              <div className="text-base font-semibold text-slate-100">{node.name}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 统计卡片 */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              <Calendar className="w-3 h-3" />
              <span>关联记录</span>
            </div>
            <div className="text-xl font-bold text-cyan-400">{relatedRecords.length}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              <AlertTriangle className="w-3 h-3" />
              <span>异常记录</span>
            </div>
            <div className="text-xl font-bold text-rose-400">{abnormalRecords.length}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              <DollarSign className="w-3 h-3" />
              <span>涉及金额</span>
            </div>
            <div className="text-sm font-bold text-cyan-400">{formatCurrency(totalAmount)}</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
              <DollarSign className="w-3 h-3" />
              <span>异常金额</span>
            </div>
            <div className="text-sm font-bold text-rose-400">{formatCurrency(abnormalAmount)}</div>
          </div>
        </div>

        {/* 最近记录 */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="text-sm text-slate-200 font-medium mb-2">最近记录</div>
          <div className="space-y-2">
            {relatedRecords.slice(0, 10).map((record) => (
              <div
                key={record.recordId}
                className={`
                  p-2 rounded-lg border text-xs
                  ${record.abnormalType
                    ? 'bg-rose-500/5 border-rose-500/20'
                    : 'bg-slate-800/40 border-slate-700/50'
                  }
                `}
              >
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>{record.visitTime}</span>
                  <span className={record.abnormalType ? 'text-rose-400' : 'text-slate-500'}>
                    {record.abnormalType ? '异常' : '正常'}
                  </span>
                </div>
                <div className="text-slate-200">{record.diagnosis} · {record.drugName}</div>
                <div className="text-slate-400 mt-0.5">
                  {record.hospitalName} · ¥{record.totalAmount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
