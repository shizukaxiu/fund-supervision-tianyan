import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle2, Brain, Play } from 'lucide-react';
import type { MedicalRecord, OverviewData, Alert } from '../types';
import { runBatchScan, type RiskAgent } from '../agents/riskAgents';
import { formatNumber } from '../utils/formatters';

interface ScanModalProps {
  isOpen: boolean;
  records: MedicalRecord[];
  onClose: () => void;
  onScanComplete: (overview: OverviewData, alerts: Alert[]) => void;
}

export function ScanModal({ isOpen, records, onClose, onScanComplete }: ScanModalProps) {
  const [agents, setAgents] = useState<RiskAgent[]>([]);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const startScan = async () => {
    setIsScanning(true);
    setProgress(0);
    setIsComplete(false);
    setAgents([]);

    const handleAgentUpdate = (updatedAgent: RiskAgent) => {
      setAgents(prev => {
        const exists = prev.find(a => a.id === updatedAgent.id);
        if (exists) {
          return prev.map(a => (a.id === updatedAgent.id ? updatedAgent : a));
        }
        return [...prev, updatedAgent];
      });
    };

    const result = await runBatchScan(records, handleAgentUpdate, setProgress);

    setIsScanning(false);
    setIsComplete(true);
    onScanComplete(result.overview, result.alerts);
  };

  const handleClose = () => {
    if (isScanning) return;
    setAgents([]);
    setProgress(0);
    setIsComplete(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-4xl tech-panel corner-decoration p-6"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <Brain className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100">多 Agent 协同批量扫描</h2>
                  <p className="text-sm text-slate-400">
                    对 {formatNumber(records.length)} 条就诊记录进行智能风险识别
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isScanning}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 未开始状态 */}
            {!isScanning && !isComplete && agents.length === 0 && (
              <div className="mb-6 text-center py-8">
                <button
                  onClick={startScan}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/35 transition-colors text-base font-medium"
                >
                  <Play className="w-5 h-5" />
                  <span>开始扫描</span>
                </button>
                <p className="mt-3 text-sm text-slate-500">5 个风险识别 Agent 将并行分析全部记录</p>
              </div>
            )}

            {/* 进度条 */}
            {(isScanning || isComplete) && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">扫描进度</span>
                  <span className="text-cyan-400 font-mono tabular-nums">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-cyan-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            )}

            {/* Agent 卡片网格 */}
            {agents.length > 0 && (
              <div className="grid grid-cols-5 gap-4 mb-6">
                {agents.map((agent, index) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      p-4 rounded-xl border text-center transition-colors duration-200
                      ${agent.status === 'completed'
                        ? 'bg-emerald-500/8 border-emerald-500/25'
                        : agent.status === 'running'
                        ? 'bg-cyan-500/8 border-cyan-500/25'
                        : 'bg-slate-800/50 border-slate-700/50'
                      }
                    `}
                  >
                    <div className="text-3xl mb-2">{agent.icon}</div>
                    <div className="text-xs text-slate-300 font-medium mb-1">{agent.name}</div>
                    <div className="text-xs text-slate-500 mb-2">{agent.description}</div>

                    {agent.status === 'running' && (
                      <Loader2 className="w-5 h-5 text-cyan-400 animate-spin mx-auto" />
                    )}
                    {agent.status === 'completed' && (
                      <div className="flex flex-col items-center gap-1 w-full">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs text-emerald-400">{agent.abnormalCount} 条异常</span>
                        {agent.confidence && (
                          <>
                            <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden mt-1">
                              <div
                                className="h-full bg-emerald-400 rounded-full"
                                style={{ width: `${agent.confidence}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400">置信度 {agent.confidence}%</span>
                          </>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* 扫描结果摘要 */}
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center"
              >
                <div className="text-emerald-400 font-semibold mb-2">扫描完成</div>
                <div className="text-sm text-slate-300">
                  5 个风险识别 Agent 已完成协同分析，请查看左侧告警列表
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
