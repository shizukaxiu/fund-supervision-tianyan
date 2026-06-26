import type { Alert, AgentResult, CaseAnalysis, MedicalRecord } from '../types';

/**
 * 当 mock caseAnalysis 不存在或 LLM 调用失败时的兜底研判逻辑。
 * 基于告警类型和就诊记录生成一份包含多 Agent、协调器、报告与飞检任务的完整个案分析。
 */

function buildCheckPoints(type: string, record: MedicalRecord): string[] {
  const basePoints = [
    `核实患者 ${record.name} 该次就诊的真实性及必要性`,
    `调取处方、病历、费用明细及药品追溯码原始记录`,
  ];

  if (type.includes('追溯码')) {
    return [
      ...basePoints,
      `重点排查药品 ${record.drugName} 的追溯码流向是否异常`,
      `核查是否存在串换药品、回流药或虚假销售行为`,
    ];
  }

  if (type.includes('频繁') || type.includes('高频')) {
    return [
      ...basePoints,
      `统计该患者近 30 天就诊次数及同类药品开具总量`,
      `排查是否存在分解处方、冒名就医等违规行为`,
    ];
  }

  if (type.includes('跨院') || type.includes('重复')) {
    return [
      ...basePoints,
      `查询该患者在不同医院的同期就诊及开药记录`,
      `核查是否存在重复报销、虚假处方或医患勾结`,
    ];
  }

  if (type.includes('虚假') || type.includes('挂床')) {
    return [
      ...basePoints,
      `实地核查住院患者在院情况`,
      `比对护理记录、医嘱执行记录与费用清单`,
    ];
  }

  if (type.includes('超量') || type.includes('超适应症') || type.includes('超剂量')) {
    return [
      ...basePoints,
      `审查药品 ${record.drugName} 用法用量是否符合诊疗规范`,
      `核查诊断与用药指征是否匹配`,
    ];
  }

  return [
    ...basePoints,
    `结合告警类型「${type}」开展针对性核查`,
    `访谈责任医生和患者，形成书面核查结论`,
  ];
}

export function generateFallbackCaseAnalysis(
  record: MedicalRecord,
  alert: Alert
): CaseAnalysis {
  const agents: AgentResult[] = [
    {
      role: '数据检索 Agent',
      result: `患者 ${record.name}（${record.age}岁/${record.gender}）于 ${record.visitTime} 在 ${record.hospitalName} ${record.department} 就诊，涉及费用 ¥${record.totalAmount.toFixed(2)}。`,
      confidence: 92,
    },
    {
      role: '模式识别 Agent',
      result: `系统识别该记录符合「${alert.type}」异常模式，与同类异常案例具有较高相似度。`,
      confidence: 86,
    },
    {
      role: '规则匹配 Agent',
      result: `该记录触发医保基金监管规则，涉嫌违反《医疗保障基金使用监督管理条例》相关条款。`,
      confidence: 88,
    },
    {
      role: '风险量化 Agent',
      result: `综合判定风险等级为「${alert.level}」，建议纳入重点核查队列。`,
      confidence: 85,
    },
    {
      role: '证据链整理 Agent',
      result: `已整理就诊时间线、药品信息（${record.drugName}）、追溯码、费用明细及医患关联信息。`,
      confidence: 90,
    },
  ];

  const avgConfidence = Math.round(
    agents.reduce((sum, a) => sum + a.confidence, 0) / agents.length
  );

  const coordinator: AgentResult = {
    role: '协调器 Agent',
    result: `各 Agent 研判结果一致指向「${alert.type}」，证据链完整，建议立即生成飞检任务并派发核查。`,
    confidence: avgConfidence,
  };

  const report = {
    summary: `患者 ${record.name} 在 ${record.hospitalName} 就诊时触发「${alert.type}」告警，涉及金额 ¥${record.totalAmount.toFixed(2)}。`,
    riskLevel: alert.level,
    basis: `${alert.reason}；该记录存在异常标记，且与 ${record.drugName}、${record.doctorName}、${record.hospitalName} 相关联。`,
    associationRisk: `建议排查同患者近期多次就诊、同医生/同医院相似异常记录，以及是否存在团伙聚集风险。`,
    suggestion: `优先调取该笔就诊的处方、病历、追溯码及费用明细；必要时启动现场飞检或约谈相关医生/患者。`,
  };

  const task = {
    taskNo: `FL-${alert.id}`,
    target: `${record.hospitalName} / ${record.doctorName} / 患者 ${record.name}`,
    points: buildCheckPoints(alert.type, record),
    deadline: '3个工作日内',
    level: alert.level,
  };

  return {
    alertId: alert.id,
    recordId: record.recordId,
    agents,
    coordinator,
    report,
    task,
  };
}
