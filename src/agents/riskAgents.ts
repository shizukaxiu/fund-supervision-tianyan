import type { MedicalRecord, OverviewData, Alert } from '../types';

/**
 * 基金监管天眼 - 批量风险识别 Agent 逻辑
 * 
 * 模拟 5 个 Agent 并行扫描 200 条就诊记录
 */

export interface RiskAgent {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'pending' | 'running' | 'completed';
  result?: string;
  abnormalCount?: number;
  confidence?: number;
}

export interface ScanResult {
  agents: RiskAgent[];
  overview: OverviewData;
  alerts: Alert[];
}

/**
 * 创建初始的 5 个风险识别 Agent
 */
export function createRiskAgents(): RiskAgent[] {
  return [
    {
      id: 'statistical',
      name: '统计异常检测 Agent',
      icon: '📊',
      description: '识别高频、高额、超量等统计异常',
      status: 'pending',
    },
    {
      id: 'behavior',
      name: '行为模式识别 Agent',
      icon: '🔍',
      description: '识别跨院就医、虚假住院等模式异常',
      status: 'pending',
    },
    {
      id: 'medical',
      name: '医学合理性 Agent',
      icon: '🏥',
      description: '判断诊疗和用药是否符合医学规范',
      status: 'pending',
    },
    {
      id: 'drug',
      name: '药品耗材异常 Agent',
      icon: '💊',
      description: '识别追溯码异常、串换药品等问题',
      status: 'pending',
    },
    {
      id: 'gang',
      name: '团伙挖掘 Agent',
      icon: '🕸️',
      description: '基于关系网络发现异常聚集和团伙',
      status: 'pending',
    },
  ];
}

/**
 * 模拟批量扫描过程
 * @param records 就诊记录
 * @param onAgentUpdate Agent 状态更新回调
 * @param onProgress 进度更新回调
 * @returns 扫描结果
 */
export async function runBatchScan(
  records: MedicalRecord[],
  onAgentUpdate: (agent: RiskAgent) => void,
  onProgress: (progress: number) => void
): Promise<ScanResult> {
  const agents = createRiskAgents();
  
  // 初始化所有 Agent 为运行中
  agents.forEach(agent => {
    agent.status = 'running';
    onAgentUpdate({ ...agent });
  });
  
  onProgress(0);
  
  // 模拟 5 个 Agent 并行扫描
  const scanPromises = agents.map((agent, index) => {
    return new Promise<void>((resolve) => {
      // 每个 Agent 扫描时间不同，模拟真实差异
      const duration = 800 + Math.random() * 1200;
      
      setTimeout(() => {
        const result = analyzeByAgent(agent.id, records);
        agent.status = 'completed';
        agent.result = result.summary;
        agent.abnormalCount = result.count;
        agent.confidence = result.confidence;
        onAgentUpdate({ ...agent });
        onProgress(Math.min(100, ((index + 1) / agents.length) * 100));
        resolve();
      }, duration);
    });
  });
  
  await Promise.all(scanPromises);
  onProgress(100);
  
  // 生成扫描结果
  const overview = generateScanOverview(records);
  const alerts = generateScanAlerts(records);
  
  return { agents, overview, alerts };
}

/**
 * 单个 Agent 的分析逻辑
 */
function analyzeByAgent(agentId: string, records: MedicalRecord[]) {
  switch (agentId) {
    case 'statistical': {
      const statisticalAbnormal = records.filter(
        r => r.visitCount7Days >= 7 || r.sameDrugCount30Days >= 5 || r.quantity > 90
      );
      return {
        count: statisticalAbnormal.length,
        confidence: 88,
        summary: `发现 ${statisticalAbnormal.length} 条统计异常记录，包括频繁就医、超量开药等`,
      };
    }

    case 'behavior': {
      const behaviorAbnormal = records.filter(
        r => r.crossHospitalCount >= 3 || (r.visitType === '住院' && r.totalAmount < 500) || r.isDuplicatePrescription
      );
      return {
        count: behaviorAbnormal.length,
        confidence: 85,
        summary: `发现 ${behaviorAbnormal.length} 条行为模式异常，包括跨院重复开药、疑似挂床等`,
      };
    }

    case 'medical': {
      const medicalAbnormal = records.filter(
        r => r.isOverDose || r.isOverIndication
      );
      return {
        count: medicalAbnormal.length,
        confidence: 92,
        summary: `发现 ${medicalAbnormal.length} 条医学合理性异常，包括超剂量、超适应症用药等`,
      };
    }

    case 'drug': {
      // 追溯码重复检测
      const traceCodeMap = new Map<string, number>();
      records.forEach(r => {
        traceCodeMap.set(r.traceCode, (traceCodeMap.get(r.traceCode) || 0) + 1);
      });
      const traceAbnormal = records.filter(r => (traceCodeMap.get(r.traceCode) || 0) > 1);
      return {
        count: traceAbnormal.length,
        confidence: 96,
        summary: `发现 ${traceAbnormal.length} 条药品追溯码异常，疑似串换药品或回流药`,
      };
    }

    case 'gang': {
      // 团伙检测：同一医生 + 同一药品 + 多个患者
      const doctorDrugMap = new Map<string, Set<string>>();
      records.forEach(r => {
        const key = `${r.doctorId}_${r.drugCode}`;
        if (!doctorDrugMap.has(key)) {
          doctorDrugMap.set(key, new Set());
        }
        doctorDrugMap.get(key)!.add(r.patientId);
      });
      const gangCount = Array.from(doctorDrugMap.values()).filter(set => set.size >= 3).length;
      return {
        count: gangCount,
        confidence: 82,
        summary: `发现 ${gangCount} 个疑似骗保团伙，涉及同一医生同一药品多个患者`,
      };
    }

    default:
      return { count: 0, confidence: 0, summary: '未识别异常' };
  }
}

/**
 * 生成扫描总览数据
 */
function generateScanOverview(records: MedicalRecord[]): OverviewData {
  const abnormalRecords = records.filter(r => r.abnormalType);
  const highRiskTypes = ['trace_code_abnormal', 'fake_hospitalization', 'frequent_visit'];
  const highRiskRecords = abnormalRecords.filter(r => highRiskTypes.includes(r.abnormalType || ''));
  
  const totalAmount = records.reduce((sum, r) => sum + r.totalAmount, 0);
  const abnormalAmount = abnormalRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  
  const districtRisk: Record<string, number> = {};
  abnormalRecords.forEach(r => {
    districtRisk[r.district] = (districtRisk[r.district] || 0) + r.totalAmount;
  });
  
  const abnormalTypeCount: Record<string, number> = {};
  abnormalRecords.forEach(r => {
    if (r.abnormalType) {
      abnormalTypeCount[r.abnormalType] = (abnormalTypeCount[r.abnormalType] || 0) + 1;
    }
  });
  
  return {
    scanDate: new Date().toISOString().split('T')[0],
    totalRecords: records.length,
    totalAmount: Math.round(totalAmount * 100) / 100,
    abnormalRecords: abnormalRecords.length,
    abnormalAmount: Math.round(abnormalAmount * 100) / 100,
    highRiskRecords: highRiskRecords.length,
    highRiskAmount: Math.round(highRiskRecords.reduce((sum, r) => sum + r.totalAmount, 0) * 100) / 100,
    suspectedGangs: 8, // 模拟值
    districtRisk,
    abnormalTypeCount,
  };
}

/**
 * 生成扫描告警列表
 */
function generateScanAlerts(records: MedicalRecord[]) {
  const abnormalTypeNames: Record<string, string> = {
    frequent_visit: '频繁就医',
    over_dose: '超量开药',
    cross_hospital: '跨院重复开药',
    trace_code_abnormal: '追溯码异常（疑似串换药品）',
    fake_hospitalization: '疑似虚假住院/挂床',
    over_indication: '超适应症用药',
  };
  
  const riskLevels: Record<string, string> = {
    frequent_visit: '中',
    over_dose: '中',
    cross_hospital: '高',
    trace_code_abnormal: '极高',
    fake_hospitalization: '高',
    over_indication: '中',
  };
  
  return records
    .filter(r => r.abnormalType)
    .map((r, index) => ({
      id: `A${String(index + 1).padStart(8, '0')}`,
      recordId: r.recordId,
      type: abnormalTypeNames[r.abnormalType!],
      level: riskLevels[r.abnormalType!],
      status: '待研判',
      patientId: r.patientId,
      patient: r.name,
      hospital: r.hospitalName,
      doctor: r.doctorName,
      amount: r.totalAmount,
      district: r.district,
      reason: `患者 ${r.name} 在 ${r.hospitalName} 就诊，${abnormalTypeNames[r.abnormalType!]}`,
      time: r.visitTime,
    }));
}
