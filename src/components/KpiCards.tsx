import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { Eye, DollarSign, AlertTriangle, ShieldAlert, Users, Activity } from 'lucide-react';
import type { OverviewData } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';

/**
 * KPI 数字动画卡片组件
 */

interface KpiCardsProps {
  overview: OverviewData;
}

interface KpiItem {
  key: keyof OverviewData;
  title: string;
  icon: React.ReactNode;
  isCurrency: boolean;
  isAbnormal: boolean;
}

function AnimatedNumber({ value, isCurrency }: { value: number; isCurrency: boolean }) {
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { duration: 800, bounce: 0 });
  const displayValue = useTransform(springValue, (latest) =>
    isCurrency ? formatCurrency(latest) : formatNumber(Math.round(latest))
  );

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  return <motion.span className="tabular-nums">{displayValue}</motion.span>;
}

export function KpiCards({ overview }: KpiCardsProps) {
  const kpis: KpiItem[] = [
    {
      key: 'totalRecords',
      title: '扫描记录数',
      icon: <Eye className="w-5 h-5" />,
      isCurrency: false,
      isAbnormal: false,
    },
    {
      key: 'totalAmount',
      title: '涉及总金额',
      icon: <DollarSign className="w-5 h-5" />,
      isCurrency: true,
      isAbnormal: false,
    },
    {
      key: 'abnormalRecords',
      title: '异常记录数',
      icon: <AlertTriangle className="w-5 h-5" />,
      isCurrency: false,
      isAbnormal: true,
    },
    {
      key: 'abnormalAmount',
      title: '异常金额',
      icon: <ShieldAlert className="w-5 h-5" />,
      isCurrency: true,
      isAbnormal: true,
    },
    {
      key: 'highRiskRecords',
      title: '高风险记录',
      icon: <Users className="w-5 h-5" />,
      isCurrency: false,
      isAbnormal: true,
    },
    {
      key: 'suspectedGangs',
      title: '疑似团伙数',
      icon: <Activity className="w-5 h-5" />,
      isCurrency: false,
      isAbnormal: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4 h-full">
      {kpis.map((kpi, index) => {
        const value = overview[kpi.key] as number;
        const isAbnormal = kpi.isAbnormal;

        return (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05 }}
            className={`
              tech-panel corner-decoration p-4 flex flex-col justify-center gap-2
              ${isAbnormal ? 'hover:border-rose-500/30' : 'hover:border-cyan-500/30'}
              transition-colors duration-200
            `}
          >
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <span className={isAbnormal ? 'text-rose-400' : 'text-cyan-400'}>
                {kpi.icon}
              </span>
              <span>{kpi.title}</span>
            </div>
            <div
              className={`
                text-2xl font-bold tracking-tight
                ${isAbnormal ? 'text-rose-400' : 'text-cyan-400'}
              `}
            >
              <AnimatedNumber value={value} isCurrency={kpi.isCurrency} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
