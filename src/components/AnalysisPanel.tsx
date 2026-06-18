import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, ClipboardList, Sparkles, Search, Brain, Scale, AlertTriangle, ShieldCheck, Gavel, ChevronRight, CheckCircle2, GitMerge } from 'lucide-react';
import type { Alert, CaseAnalysis, AnalysisReport, InspectionTask, MedicalRecord } from '../types';
import { getRiskLevelColor } from '../utils/formatters';

interface AnalysisPanelProps {
  alert: Alert | null;
  records: MedicalRecord[];
  caseAnalysis: CaseAnalysis[];
}

// Agent 图标映射
const agentIcons: Record<string, React.ReactNode> = {
  '数据检索 Agent': <Search className="w-4 h-4" />,
  '模式识别 Agent': <Brain className="w-4 h-4" />,
  '规则匹配 Agent': <Scale className="w-4 h-4" />,
  '风险量化 Agent': <AlertTriangle className="w-4 h-4" />,
  '证据链整理 Agent': <ShieldCheck className="w-4 h-4" />,
  '协调器 Agent': <GitMerge className="w-4 h-4" />,
};

interface AnalysisAgentsProps {
  analysis: CaseAnalysis | null;
  onReportReady?: (ready: boolean) => void;
}

/**
 * Agent 动画子组件：每次 alert 变化时通过 key 重置，内部自行管理动画状态，
 * 避免在父组件 effect 中同步 setState 触发级联渲染。
 */
function AnalysisAgents({ analysis, onReportReady }: AnalysisAgentsProps) {
  const [visibleAgents, setVisibleAgents] = useState(0);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (!analysis) return;
    // 初始状态由 key 重置保证；此处仅在异步 interval 回调中更新状态
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      setVisibleAgents(current);
      if (current >= analysis.agents.length) {
        clearInterval(timer);
        setTimeout(() => {
          setShowReport(true);
          onReportReady?.(true);
        }, 500);
      }
    }, 600);

    return () => clearInterval(timer);
  }, [analysis, onReportReady]);

  if (!analysis) return null;

  return (
    <>
      {/* Agent 协同动画指示 */}
      {visibleAgents < analysis.agents.length && (
        <div className="flex items-center gap-2 text-sm text-cyan-400 mb-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full"
          />
          <span>多 Agent 协同研判中...</span>
        </div>
      )}

      {analysis.agents.map((agent, index) => (
        <AnimatePresence key={agent.role}>
          {index < visibleAgents && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
                  <span className="text-cyan-400">{agentIcons[agent.role] || <Brain className="w-4 h-4" />}</span>
                  <span>{agent.role}</span>
                </div>
                <span className="text-xs text-slate-400">置信度 {agent.confidence}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${agent.confidence}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`h-full rounded-full ${
                    agent.confidence >= 90 ? 'bg-emerald-400' :
                    agent.confidence >= 75 ? 'bg-cyan-400' : 'bg-amber-400'
                  }`}
                />
              </div>
              <div className="text-xs text-slate-300 leading-relaxed">{agent.result}</div>
            </motion.div>
          )}
        </AnimatePresence>
      ))}

      {/* 协调器 Agent */}
      <AnimatePresence>
        {showReport && analysis.coordinator && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="p-3 rounded-lg bg-slate-800/50 border border-cyan-500/20"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-slate-200 text-sm font-medium">
                <span className="text-cyan-400"><GitMerge className="w-4 h-4" /></span>
                <span>{analysis.coordinator.role}</span>
              </div>
              <span className="text-xs text-slate-400">综合置信度 {analysis.coordinator.confidence}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis.coordinator.confidence}%` }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-full rounded-full bg-cyan-400"
              />
            </div>
            <div className="text-xs text-slate-300 leading-relaxed">
              {analysis.coordinator.result}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 研判报告 */}
      <AnimatePresence>
        {showReport && analysis.report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
          >
            <div className="flex items-center gap-2 text-slate-100 font-semibold mb-3">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>综合研判报告</span>
            </div>
            <ReportContent report={analysis.report} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

interface TaskPanelProps {
  task: InspectionTask;
}

/**
 * 飞检任务书子组件：用 key 跟随 alert/task 重置，内部管理状态流转，
 * 避免父组件在 effect 中同步 setState。
 */
function TaskPanel({ task }: TaskPanelProps) {
  const [status, setStatus] = useState<string>('待派发');

  const statusSteps = ['待派发', '已派发', '已核查', '已办结'];
  const currentIndex = statusSteps.indexOf(status);

  const handleNext = () => {
    if (currentIndex < statusSteps.length - 1) {
      setStatus(statusSteps[currentIndex + 1]);
    }
  };

  const getStatusColor = (step: string) => {
    const stepIndex = statusSteps.indexOf(step);
    if (stepIndex < currentIndex) return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
    if (stepIndex === currentIndex) return 'bg-amber-500/20 border-amber-500/40 text-amber-400';
    return 'bg-slate-800/40 border-slate-700/50 text-slate-500';
  };

  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between">
        <span className="text-slate-400">任务编号：</span>
        <span className="text-slate-200 font-mono">{task.taskNo}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-400">核查对象：</span>
        <span className="text-slate-200">{task.target}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-400">任务级别：</span>
        <span className={`px-2 py-0.5 rounded text-xs border ${getRiskLevelColor(task.level)}`}>
          {task.level}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-400">完成时限：</span>
        <span className="text-slate-200">{task.deadline}</span>
      </div>
      <div>
        <div className="text-slate-400 mb-2">任务状态流转：</div>
        <div className="flex items-center gap-1">
          {statusSteps.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`px-2 py-1 rounded text-xs border ${getStatusColor(step)}`}>
                {index < currentIndex && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                {step}
              </div>
              {index < statusSteps.length - 1 && (
                <ChevronRight className="w-3 h-3 text-slate-600 mx-0.5" />
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-slate-400 mb-1">核查要点：</div>
        <ul className="space-y-1">
          {task.points.map((point, index) => (
            <li key={index} className="flex items-start gap-2 text-slate-300">
              <span className="text-amber-400 mt-1">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {status !== '已办结' && (
        <button
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/35 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          <span>
            {status === '待派发' && '派发任务'}
            {status === '已派发' && '标记已核查'}
            {status === '已核查' && '标记已办结'}
          </span>
        </button>
      )}
      
      {status === '已办结' && (
        <div className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
          <CheckCircle2 className="w-4 h-4" />
          <span>任务已办结</span>
        </div>
      )}
    </div>
  );
}

export function AnalysisPanel({ alert, records, caseAnalysis }: AnalysisPanelProps) {
  const [showTask, setShowTask] = useState(false);

  const currentRecord = useMemo(() => {
    if (!alert) return null;
    return records.find(r => r.recordId === alert.recordId) || null;
  }, [alert, records]);

  const currentAnalysis = useMemo(() => {
    if (!alert) return null;
    return caseAnalysis.find(a => a.alertId === alert.id) || null;
  }, [alert, caseAnalysis]);

  if (!alert) {
    return (
      <div className="tech-panel corner-decoration h-full flex flex-col p-4">
        <div className="panel-title">
          <FileText className="w-4 h-4" />
          <span>AI 风险研判</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
          点击左侧告警查看多 Agent 协同研判报告
        </div>
      </div>
    );
  }

  return (
    <div className="tech-panel corner-decoration h-full flex flex-col p-4">
      <div className="panel-title">
        <Sparkles className="w-4 h-4" />
        <span>多 Agent 协同研判</span>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded border ${getRiskLevelColor(alert.level)}`}>
          {alert.level}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {/* 原始记录详情 */}
        {currentRecord && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
          >
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium mb-2">
              <FileText className="w-4 h-4" />
              <span>原始就诊记录</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div><span className="text-slate-400">记录号：</span><span className="text-slate-200">{currentRecord.recordId}</span></div>
              <div><span className="text-slate-400">就诊时间：</span><span className="text-slate-200">{currentRecord.visitTime}</span></div>
              <div><span className="text-slate-400">患者：</span><span className="text-slate-200">{currentRecord.name}</span></div>
              <div><span className="text-slate-400">年龄/性别：</span><span className="text-slate-200">{currentRecord.age}岁/{currentRecord.gender}</span></div>
              <div><span className="text-slate-400">医院：</span><span className="text-slate-200">{currentRecord.hospitalName}</span></div>
              <div><span className="text-slate-400">医生：</span><span className="text-slate-200">{currentRecord.doctorName}</span></div>
              <div><span className="text-slate-400">科室：</span><span className="text-slate-200">{currentRecord.department}</span></div>
              <div><span className="text-slate-400">就诊类型：</span><span className="text-slate-200">{currentRecord.visitType}</span></div>
              <div><span className="text-slate-400">诊断：</span><span className="text-slate-200">{currentRecord.diagnosis}</span></div>
              <div><span className="text-slate-400">药品：</span><span className="text-slate-200">{currentRecord.drugName}</span></div>
              <div><span className="text-slate-400">数量：</span><span className="text-slate-200">{currentRecord.quantity}片/{currentRecord.duration}天</span></div>
              <div><span className="text-slate-400">追溯码：</span><span className="text-slate-200 font-mono">{currentRecord.traceCode}</span></div>
              <div className="col-span-2"><span className="text-slate-400">总费用：</span><span className="text-cyan-400 font-medium">¥{currentRecord.totalAmount.toFixed(2)}</span>（医保 ¥{currentRecord.insurancePay.toFixed(2)}，自费 ¥{currentRecord.selfPay.toFixed(2)}）</div>
            </div>
          </motion.div>
        )}

        {/* 告警摘要 */}
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">{alert.id}</div>
          <div className="text-base text-slate-100 font-medium">{alert.type}</div>
          <div className="text-sm text-slate-400 mt-1 leading-relaxed">{alert.reason}</div>
        </div>

        {/* Agent 协同动画 —— 用 key 重置 */}
        <AnalysisAgents
          key={alert.id}
          analysis={currentAnalysis}
          onReportReady={() => setShowTask(false)}
        />

        {/* 生成飞检任务按钮 */}
        {currentAnalysis?.report && (
          <button
            onClick={() => setShowTask(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/35 transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            <span>生成飞检任务</span>
          </button>
        )}

        {/* 飞检任务书 */}
        <AnimatePresence>
          {showTask && currentAnalysis?.task && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50"
            >
              <div className="flex items-center gap-2 text-slate-100 font-semibold mb-3">
                <Gavel className="w-4 h-4 text-amber-400" />
                <span>飞检任务书</span>
              </div>
              <TaskPanel key={currentAnalysis.task.taskNo} task={currentAnalysis.task} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ReportContent({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="text-slate-400">异常摘要：</span>
        <span className="text-slate-200">{report.summary}</span>
      </div>
      <div>
        <span className="text-slate-400">风险等级：</span>
        <span className="text-rose-400 font-medium">{report.riskLevel}</span>
      </div>
      <div>
        <span className="text-slate-400">判定依据：</span>
        <span className="text-slate-200">{report.basis}</span>
      </div>
      <div>
        <span className="text-slate-400">关联风险：</span>
        <span className="text-slate-200">{report.associationRisk}</span>
      </div>
      <div>
        <span className="text-slate-400">处置建议：</span>
        <span className="text-emerald-400">{report.suggestion}</span>
      </div>
    </div>
  );
}


