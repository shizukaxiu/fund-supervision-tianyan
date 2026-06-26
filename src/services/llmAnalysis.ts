import type { Alert, AnalysisReport, InspectionTask, MedicalRecord } from '../types';
import { chatCompletion, hasDeepSeekConfig } from './deepseek';

export interface LLMAnalysisResult {
  report: AnalysisReport;
  task: InspectionTask;
}

function formatRecord(record: MedicalRecord): string {
  return JSON.stringify(record, null, 2);
}

function formatAlert(alert: Alert): string {
  return JSON.stringify(alert, null, 2);
}

function stripJsonMarkdown(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();
}

function buildSystemPrompt(): string {
  return `你是医保基金监管领域的资深风控专家，擅长根据单条就诊记录与系统告警出具结构化研判报告和飞检任务建议。

请严格按以下 JSON 格式输出，不要包含任何额外解释或 markdown 代码块：
{
  "report": {
    "summary": "异常摘要（50字以内）",
    "riskLevel": "极高/高/中/低之一",
    "basis": "判定依据（列出关键事实和规则）",
    "associationRisk": "关联风险（患者、医生、医院、药品之间的潜在关联）",
    "suggestion": "处置建议（具体可执行）"
  },
  "task": {
    "taskNo": "任务编号，例如 FL-YYYYMMDD-序号",
    "target": "核查对象（医院/医生/患者/组合）",
    "points": ["核查要点1", "核查要点2", "核查要点3"],
    "deadline": "建议完成时限，例如 3个工作日内",
    "level": "任务级别（极高/高/中/低之一）"
  }
}`;
}

function buildUserPrompt(record: MedicalRecord, alert: Alert): string {
  return `请对以下医保就诊记录及告警进行专业研判，并生成综合研判报告和飞检任务建议。

【就诊记录】
${formatRecord(record)}

【系统告警】
${formatAlert(alert)}

请直接输出 JSON。`;
}

export function canUseLLM(): boolean {
  return hasDeepSeekConfig();
}

export async function generateLLMAnalysis(
  record: MedicalRecord,
  alert: Alert
): Promise<LLMAnalysisResult> {
  if (!hasDeepSeekConfig()) {
    throw new Error('DeepSeek API Key 未配置');
  }

  const raw = await chatCompletion(
    [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(record, alert) },
    ],
    {
      temperature: 0.3,
      maxTokens: 1200,
      responseFormat: { type: 'json_object' },
    }
  );

  const cleaned = stripJsonMarkdown(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('DeepSeek 返回内容不是有效 JSON');
  }

  const data = parsed as Partial<LLMAnalysisResult>;
  if (
    !data.report ||
    typeof data.report.summary !== 'string' ||
    typeof data.report.riskLevel !== 'string' ||
    typeof data.report.basis !== 'string' ||
    typeof data.report.associationRisk !== 'string' ||
    typeof data.report.suggestion !== 'string' ||
    !data.task ||
    typeof data.task.taskNo !== 'string' ||
    typeof data.task.target !== 'string' ||
    !Array.isArray(data.task.points) ||
    typeof data.task.deadline !== 'string' ||
    typeof data.task.level !== 'string'
  ) {
    throw new Error('DeepSeek 返回的 JSON 结构不完整');
  }

  return {
    report: data.report as AnalysisReport,
    task: {
      ...data.task,
      points: data.task.points.filter((p): p is string => typeof p === 'string'),
    } as InspectionTask,
  };
}
