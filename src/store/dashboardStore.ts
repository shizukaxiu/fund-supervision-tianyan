import { create } from 'zustand';
import type { OverviewData, Alert, MedicalRecord, NetworkData, CaseAnalysis } from '../types';

/**
 * 基金监管天眼 - 全局状态管理
 */

interface DashboardState {
  // 数据状态
  overview: OverviewData | null;
  alerts: Alert[];
  records: MedicalRecord[];
  network: NetworkData | null;
  caseAnalysis: CaseAnalysis[];
  
  // UI 状态
  isLoading: boolean;
  isScanning: boolean;
  scanProgress: number;
  selectedAlert: Alert | null;
  currentTime: string;
}

interface DashboardActions {
  loadData: () => Promise<void>;
  selectAlert: (alert: Alert | null) => void;
  addAlert: (alert: Alert) => void;
  startScan: () => void;
  stopScan: () => void;
  updateScanProgress: (progress: number) => void;
  updateTime: () => void;
}

export const useDashboardStore = create<DashboardState & DashboardActions>((set) => ({
  // 初始状态
  overview: null,
  alerts: [],
  records: [],
  network: null,
  caseAnalysis: [],
  isLoading: true,
  isScanning: false,
  scanProgress: 0,
  selectedAlert: null,
  currentTime: new Date().toLocaleString('zh-CN'),

  /**
   * 加载所有 mock 数据
   */
  loadData: async () => {
    try {
      const [overviewRes, alertsRes, recordsRes, networkRes, caseAnalysisRes] = await Promise.all([
        fetch('/src/mock/overview.json'),
        fetch('/src/mock/alerts.json'),
        fetch('/src/mock/records.json'),
        fetch('/src/mock/network.json'),
        fetch('/src/mock/caseAnalysis.json'),
      ]);

      const [overview, alerts, records, network, caseAnalysis] = await Promise.all([
        overviewRes.json(),
        alertsRes.json(),
        recordsRes.json(),
        networkRes.json(),
        caseAnalysisRes.json(),
      ]);

      set({
        overview,
        alerts,
        records,
        network,
        caseAnalysis,
        isLoading: false,
      });
    } catch (error) {
      console.error('加载 mock 数据失败:', error);
      set({ isLoading: false });
    }
  },

  /**
   * 选中风控告警
   */
  selectAlert: (alert) => {
    set({ selectedAlert: alert });
  },

  /**
   * 添加新告警到列表顶部
   */
  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100), // 最多保留 100 条
    }));
  },

  /**
   * 开始批量扫描动画
   */
  startScan: () => {
    set({ isScanning: true, scanProgress: 0 });
  },

  /**
   * 结束批量扫描动画
   */
  stopScan: () => {
    set({ isScanning: false, scanProgress: 100 });
  },

  /**
   * 更新扫描进度
   */
  updateScanProgress: (progress) => {
    set({ scanProgress: Math.min(100, Math.max(0, progress)) });
  },

  /**
   * 更新当前时间
   */
  updateTime: () => {
    set({ currentTime: new Date().toLocaleString('zh-CN') });
  },
}));
