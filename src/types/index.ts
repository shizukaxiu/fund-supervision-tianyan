/**
 * 基金监管天眼 - TypeScript 类型定义
 */

/** 单条就诊取药记录 */
export interface MedicalRecord {
  recordId: string;
  patientId: string;
  name: string;
  gender: string;
  age: number;
  insuranceType: string;
  insuredCity: string;
  visitTime: string;
  hospitalId: string;
  hospitalName: string;
  hospitalLevel: string;
  department: string;
  doctorId: string;
  doctorName: string;
  visitType: string;
  diagnosis: string;
  icd10Code: string;
  isChronic: boolean;
  severity: string;
  drugName: string;
  drugCode: string;
  drugCategory: string;
  isInsuranceCovered: boolean;
  isCentralizedProcurement: boolean;
  dailyDose: number;
  duration: number;
  quantity: number;
  unitPrice: number;
  drugAmount: number;
  traceCode: string;
  prescriptionType: string;
  totalAmount: number;
  insurancePay: number;
  selfPay: number;
  visitCount7Days: number;
  sameDrugCount30Days: number;
  crossHospitalCount: number;
  isOverDose: boolean;
  isOverIndication: boolean;
  isDuplicatePrescription: boolean;
  city: string;
  district: string;
  abnormalType: string | null;
}

/** 监管总览数据 */
export interface OverviewData {
  scanDate: string;
  totalRecords: number;
  totalAmount: number;
  abnormalRecords: number;
  abnormalAmount: number;
  highRiskRecords: number;
  highRiskAmount: number;
  suspectedGangs: number;
  districtRisk: Record<string, number>;
  abnormalTypeCount: Record<string, number>;
}

/** 风险告警 */
export interface Alert {
  id: string;
  recordId: string;
  type: string;
  level: string;
  status: string;
  patientId: string;
  patient: string;
  hospital: string;
  doctor: string;
  amount: number;
  district: string;
  reason: string;
  time: string;
}

/** 关系网络节点 */
export interface NetworkNode {
  id: string;
  name: string;
  type: 'hospital' | 'doctor' | 'patient' | 'pharmacy';
  value: number;
  gangId?: string;
}

/** 关系网络边 */
export interface NetworkEdge {
  source: string;
  target: string;
  value: number;
}

/** 地图投影坐标 */
export interface MapPosition {
  x: number;
  y: number;
}

/** 关系网络数据 */
export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  gangs: number;
  gangDetails?: Array<{
    id: string;
    members: string[];
  }>;
  mapPositions?: Record<string, MapPosition>;
}

/** 单个 Agent 研判结果 */
export interface AgentResult {
  role: string;
  result: string;
  confidence: number; // 置信度 0-100
}

/** 研判报告 */
export interface AnalysisReport {
  summary: string;
  riskLevel: string;
  basis: string;
  associationRisk: string;
  suggestion: string;
}

/** 飞检任务 */
export interface InspectionTask {
  taskNo: string;
  target: string;
  points: string[];
  deadline: string;
  level: string;
}

/** 典型案例研判结果 */
export interface CaseAnalysis {
  alertId: string;
  recordId: string;
  agents: AgentResult[];
  coordinator: AgentResult;
  report: AnalysisReport;
  task: InspectionTask;
}
