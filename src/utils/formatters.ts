/**
 * 基金监管天眼 - 格式化工具函数
 */

/**
 * 金额格式化：添加千分位和小数点
 * @param value 数值
 * @param prefix 前缀，默认 ¥
 * @returns 格式化后的字符串
 */
export function formatCurrency(value: number, prefix: string = '¥'): string {
  return `${prefix}${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * 数字格式化：添加千分位
 * @param value 数值
 * @returns 格式化后的字符串
 */
export function formatNumber(value: number): string {
  return value.toLocaleString('zh-CN');
}

/**
 * 百分比格式化
 * @param value 数值（0-1）
 * @returns 格式化后的百分比字符串
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * 日期时间格式化
 * @param dateStr ISO 格式或标准格式日期字符串
 * @returns 格式化后的日期时间字符串
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 获取风险等级对应的颜色类名
 * @param level 风险等级：极高/高/中/低
 * @returns Tailwind 颜色类名
 */
export function getRiskLevelColor(level: string): string {
  switch (level) {
    case '极高':
      return 'text-rose-500 bg-rose-500/10 border-rose-500/30';
    case '高':
      return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    case '中':
      return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    case '低':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
    default:
      return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
  }
}

/**
 * 获取异常类型对应的中文标签
 * @param type 异常类型编码
 * @returns 中文标签
 */
export function getAbnormalTypeName(type: string | null): string {
  if (!type) return '正常';
  
  const typeMap: Record<string, string> = {
    frequent_visit: '频繁就医',
    over_dose: '超量开药',
    cross_hospital: '跨院重复开药',
    trace_code_abnormal: '追溯码异常',
    fake_hospitalization: '虚假住院',
    over_indication: '超适应症用药',
  };
  
  return typeMap[type] || type;
}
