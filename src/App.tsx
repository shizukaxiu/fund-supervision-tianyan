import { useEffect, useRef, useState } from 'react';
import { Shield, ScanLine, Upload, Maximize2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDashboardStore } from './store/dashboardStore';
import { KpiCards } from './components/KpiCards';
import { AlertList } from './components/AlertList';
import { DistrictRiskMap } from './components/DistrictRiskMap';
import { AnalysisPanel } from './components/AnalysisPanel';
import { useAlertStream } from './hooks/useAlertStream';
import { TrendChart } from './components/TrendChart';
import { RankBoard } from './components/RankBoard';
import { ScanModal } from './components/ScanModal';
import { FraudNetwork } from './components/FraudNetwork';
import type { OverviewData, Alert as AlertType, MedicalRecord } from './types';

/**
 * 基金监管天眼 - 主应用组件
 */

function App() {
  const {
    overview,
    alerts,
    records,
    network,
    caseAnalysis,
    selectedAlert,
    isLoading,
    currentTime,
    loadData,
    clearScanResults,
    selectAlert,
    addAlert,
    updateTime,
  } = useDashboardStore();

  // 实时告警推送
  useAlertStream(alerts, addAlert, 10000);

  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 上传数据：支持单 JSON 文件（整合全部 mock 数据）或仅 records 数组
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = String(e.target?.result || '');
        const data: unknown = JSON.parse(text);

        let uploadedRecords: MedicalRecord[] | undefined;

        if (Array.isArray(data)) {
          uploadedRecords = data as MedicalRecord[];
        } else if (data && typeof data === 'object') {
          const bundle = data as Record<string, unknown>;
          uploadedRecords = Array.isArray(bundle.records) ? bundle.records as MedicalRecord[] : undefined;
        }

        if (!Array.isArray(uploadedRecords)) {
          window.alert('文件格式错误：请上传整合 mock 数据对象或 records 数组');
          return;
        }

        useDashboardStore.setState({
          records: uploadedRecords,
          overview: null,
          alerts: [],
          selectedAlert: null,
        });
        window.alert(`数据上传成功：共 ${uploadedRecords.length} 条记录，请点击“启动智能扫描”开始分析`);
      } catch (error) {
        console.error('上传数据解析失败:', error);
        window.alert('无法解析该文件，请确保是有效的 JSON');
      }
    };
    reader.readAsText(file);

    // 允许重复上传同一文件
    event.target.value = '';
  };

  // 全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // 刷新：清空扫描结果，恢复未扫描状态
  const handleRefresh = () => {
    clearScanResults();
  };

  // 加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      updateTime();
    }, 1000);
    return () => clearInterval(timer);
  }, [updateTime]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-400 rounded-full"
        />
        <span className="ml-3 text-slate-300 text-base">数据加载中...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-screen p-3 lg:p-4 flex flex-col gap-3 lg:gap-4 bg-slate-950 overflow-hidden">
      {/* 顶部标题栏 */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-cyan-400 tracking-tight">
              基金监管天眼
            </h1>
            <p className="text-xs text-slate-400">南京市医保基金智能监管指挥台 · 演示数据</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/35 transition-colors"
          >
            <ScanLine className="w-4 h-4" />
            <span>启动智能扫描</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/35 transition-colors"
            title="上传数据"
          >
            <Upload className="w-4 h-4" />
            <span>上传数据</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300 hover:bg-slate-700/60 transition-colors"
            title="刷新数据"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300 hover:bg-slate-700/60 transition-colors"
            title="全屏显示"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="text-sm text-slate-300 font-mono tabular-nums">
            {currentTime}
          </div>
        </div>
      </header>

      {/* KPI 卡片区 */}
      <section className="shrink-0 h-[100px] lg:h-[120px]">
        <KpiCards overview={overview} />
      </section>

      {/* 主体内容区 - 大屏幕固定高度三栏，面板内部滚动 */}
      <section className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[300px_1fr_340px] 2xl:grid-cols-[320px_1fr_360px] gap-3 lg:gap-4">
        {/* 左侧：告警列表 */}
        <div className="h-[400px] xl:h-full overflow-hidden">
          <AlertList
            alerts={alerts}
            selectedAlert={selectedAlert}
            onSelectAlert={selectAlert}
          />
        </div>

        {/* 中间：南京市风险分布 + 网络图谱 */}
        <div className="flex flex-col gap-3 lg:gap-4 h-[600px] xl:h-full overflow-hidden">
          <div className="h-1/2 xl:h-[40%] overflow-hidden">
            <DistrictRiskMap overview={overview} />
          </div>
          {network && (
            <div className="h-1/2 xl:h-[60%] overflow-hidden">
              <FraudNetwork
                network={network}
                records={records}
                alerts={alerts}
                selectedAlert={selectedAlert}
                overview={overview}
              />
            </div>
          )}
        </div>

        {/* 右侧：多 Agent 协同研判 */}
        <div className="h-[500px] xl:h-full overflow-hidden">
          <AnalysisPanel alert={selectedAlert} records={records} caseAnalysis={caseAnalysis} />
        </div>
      </section>

      {/* 底部：趋势图 + 排行榜 */}
      <section className="shrink-0 h-[180px] lg:h-[200px] grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
        <div className="h-full overflow-hidden">
          <TrendChart overview={overview} />
        </div>
        <div className="h-full overflow-hidden">
          <RankBoard alerts={alerts} />
        </div>
      </section>

      {/* 批量扫描弹窗 */}
      <ScanModal
        isOpen={isScanModalOpen}
        records={records}
        onClose={() => setIsScanModalOpen(false)}
        onScanComplete={(newOverview: OverviewData, newAlerts: AlertType[]) => {
          // 更新 store 中的数据
          useDashboardStore.setState({
            overview: newOverview,
            alerts: newAlerts,
          });
        }}
      />
    </div>
  );
}

export default App;
