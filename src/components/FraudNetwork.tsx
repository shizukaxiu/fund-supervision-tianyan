import { useEffect, useRef, useState } from 'react';
import { Graph } from '@antv/g6';
import { Network, Map as MapIcon } from 'lucide-react';
import type { NetworkData, Alert, MedicalRecord, NetworkNode, OverviewData } from '../types';
import { NodeDetailDrawer } from './NodeDetailDrawer';
import { NetworkMapModal } from './NetworkMapModal';

interface FraudNetworkProps {
  network: NetworkData;
  records: MedicalRecord[];
  alerts: Alert[];
  selectedAlert: Alert | null;
  overview: OverviewData | null;
}

/**
 * 基金监管天眼 - 风险网络图谱组件（AntV G6 v5）
 */
// 节点类型对应的颜色
const typeColors: Record<string, string> = {
  hospital: '#22d3ee',   // 科技蓝
  doctor: '#fbbf24',     // 琥珀黄
  patient: '#f43f5e',    // 玫瑰红
  pharmacy: '#10b981',   // 翡翠绿
};

// 团伙颜色池
const gangColors = [
  '#f43f5e', '#22d3ee', '#fbbf24', '#10b981',
  '#a78bfa', '#fb923c', '#60a5fa', '#c084fc',
];

export function FraudNetwork({ network, records, alerts, selectedAlert, overview }: FraudNetworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // 未启动扫描时只保留卡片框架，不渲染节点和连线
    if (!overview) {
      if (graphRef.current) {
        try {
          graphRef.current.destroy();
        } catch {
          // ignore
        }
        graphRef.current = null;
      }
      return;
    }

    // 构建 G6 数据
    const nodes = network.nodes.map(node => {
      const baseSize = Math.max(20, Math.min(60, node.value / 100));
      const gangColor = node.gangId
        ? gangColors[parseInt(node.gangId.replace('G', '')) % gangColors.length]
        : typeColors[node.type];

      return {
        id: node.id,
        style: {
          labelText: node.name,
          labelFill: '#e2e8f0',
          labelFontSize: 10,
          labelMaxWidth: 100,
          size: baseSize,
          fill: gangColor,
          stroke: node.gangId ? '#fff' : gangColor,
          lineWidth: node.gangId ? 2 : 1,
          opacity: 0.9,
        },
        data: {
          type: node.type,
          value: node.value,
          gangId: node.gangId,
          baseSize,
          gangColor,
        },
      };
    });

    const edges = network.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      style: {
        stroke: 'rgba(34, 211, 238, 0.3)',
        lineWidth: Math.max(1, Math.min(4, edge.value / 3)),
        opacity: 0.6,
      },
      data: {
        value: edge.value,
      },
    }));

    const graph = new Graph({
      container: containerRef.current,
      data: { nodes, edges },
      layout: {
        type: 'force',
        preventOverlap: true,
        linkDistance: 80,
        nodeStrength: -50,
        edgeStrength: 0.5,
      },
      node: {
        state: {
          highlight: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            size: (d: any) => d.data.baseSize * 1.3,
            lineWidth: 3,
            stroke: '#fff',
            opacity: 1,
            labelFontSize: 12,
            labelFontWeight: 'bold',
          },
          dim: {
            opacity: 0.2,
            labelOpacity: 0.2,
          },
        },
      },
      edge: {
        state: {
          highlight: {
            stroke: '#22d3ee',
            lineWidth: 3,
            opacity: 1,
          },
          dim: {
            opacity: 0.1,
          },
        },
      },
      behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
      autoFit: 'view',
      background: 'transparent',
    });

    graphRef.current = graph;

    graph.render();

    // 监听节点点击事件
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    graph.on('node:click', (event: any) => {
      const nodeId = event.target?.id || event?.data?.id;
      if (nodeId) {
        const node = network.nodes.find(n => n.id === nodeId);
        if (node) {
          setSelectedNode(node);
        }
      }
    });

    return () => {
      graph.destroy();
      graphRef.current = null;
    };
  }, [network, overview]);

  // 当选中告警变化时，聚焦并高亮相关节点路径
  useEffect(() => {
    if (!graphRef.current) return;

    const graph = graphRef.current;
    const allNodeIds = network.nodes.map(n => n.id);

    // 重置所有节点状态
    allNodeIds.forEach(id => {
      graph.setElementState(id, []);
    });
    // 重置所有边状态
    network.edges.forEach(edge => {
      graph.setElementState(`${edge.source}-${edge.target}`, []);
    });

    if (!selectedAlert) return;

    // 找到该告警对应的记录
    const record = records.find(r => r.recordId === selectedAlert.recordId);
    if (!record) {
      // 如果没有找到记录，只聚焦患者节点
      graph.focusElement(selectedAlert.patientId, { duration: 500 });
      graph.setElementState(selectedAlert.patientId, ['highlight']);
      allNodeIds
        .filter(id => id !== selectedAlert.patientId)
        .forEach(id => graph.setElementState(id, ['dim']));
      network.edges.forEach(edge => {
        graph.setElementState(`${edge.source}-${edge.target}`, ['dim']);
      });
      return;
    }

    // 高亮路径：患者 → 医生 → 医院
    const highlightIds = [record.patientId, record.doctorId, record.hospitalId];
    const dimIds = allNodeIds.filter(id => !highlightIds.includes(id));

    // 设置节点状态
    highlightIds.forEach(id => {
      graph.setElementState(id, ['highlight']);
    });
    dimIds.forEach(id => {
      graph.setElementState(id, ['dim']);
    });

    // 设置边状态
    network.edges.forEach(edge => {
      const isHighlighted =
        (edge.source === record.patientId && edge.target === record.doctorId) ||
        (edge.source === record.doctorId && edge.target === record.hospitalId);
      const edgeId = `${edge.source}-${edge.target}`;
      graph.setElementState(edgeId, isHighlighted ? ['highlight'] : ['dim']);
    });

    // 聚焦到患者节点
    graph.focusElement(record.patientId, { duration: 500 });
  }, [selectedAlert, network, records]);

  return (
    <div className="tech-panel corner-decoration h-full flex flex-col p-4">
      <div className="panel-title">
        <Network className="w-4 h-4" />
        <span>风险网络图谱</span>
        {overview && (
          <button
            onClick={() => setIsMapOpen(true)}
            className="ml-auto mr-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition-colors text-xs"
            title="地图模式"
          >
            <MapIcon className="w-3 h-3" />
            <span>地图模式</span>
          </button>
        )}
        <span className="text-xs text-slate-500">
          {overview
            ? `${network.nodes.length} 节点 · ${network.edges.length} 关系 · ${network.gangs} 团伙`
            : '—'}
        </span>
      </div>
      
      <div className="flex items-center gap-4 mb-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-slate-400">医院</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-slate-400">医生</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-slate-400">患者</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-slate-400">药店</span>
        </div>
      </div>
      
      <div ref={containerRef} className="flex-1 min-h-0 relative">
        {!overview && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm z-10">
            暂无风险网络数据，请先启动智能扫描
          </div>
        )}
        <NodeDetailDrawer
          node={selectedNode}
          records={records}
          onClose={() => setSelectedNode(null)}
        />
      </div>

      <NetworkMapModal
        network={network}
        records={records}
        alerts={alerts}
        selectedAlert={selectedAlert}
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
      />
    </div>
  );
}
