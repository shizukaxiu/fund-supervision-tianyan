import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Graph } from '@antv/g6';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Map as MapIcon, Network } from 'lucide-react';
import type { NetworkData, Alert, MedicalRecord, NetworkNode } from '../types';
import { NodeDetailDrawer } from './NodeDetailDrawer';
import { NanjingMapBackground } from './NanjingMapBackground';

interface NetworkMapModalProps {
  network: NetworkData;
  records: MedicalRecord[];
  selectedAlert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 医院在南京市区的示意坐标（与 NanjingMapBackground 的 viewBox 0-1000 对应）
 */
const HOSPITAL_COORDS: Record<string, { x: number; y: number }> = {
  H001: { x: 330, y: 310 }, // 南京鼓楼医院
  H002: { x: 390, y: 290 }, // 江苏省人民医院
  H003: { x: 470, y: 400 }, // 南京市第一医院
  H004: { x: 360, y: 250 }, // 东南大学附属中大医院
  H005: { x: 490, y: 430 }, // 南京市中医院
  H006: { x: 300, y: 340 }, // 南京医科大学第二附属医院
  H007: { x: 540, y: 740 }, // 江宁医院
  H008: { x: 670, y: 360 }, // 南京市栖霞区医院
  H009: { x: 440, y: 600 }, // 南京市雨花台区中心医院
  H010: { x: 350, y: 550 }, // 南京市建邺医院
};

const MAP_SIZE = 1000;

/**
 * 为地图模式计算节点初始位置：
 * - 医院节点固定在地图坐标
 * - 医生节点均匀分布在其所属医院周围
 * - 患者节点均匀分布在其所属医生周围
 */
function computeMapPositions(network: NetworkData): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  // 1. 医院固定
  network.nodes
    .filter((n) => n.type === 'hospital')
    .forEach((n) => {
      positions[n.id] = HOSPITAL_COORDS[n.id] ?? { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };
    });

  // 构建邻接关系：source -> target
  const outEdges = new Map<string, string[]>();
  network.edges.forEach((edge) => {
    const list = outEdges.get(edge.source) ?? [];
    list.push(edge.target);
    outEdges.set(edge.source, list);
  });

  // 2. 医生节点：找到其归属医院，在医院周围扇形分布
  const doctors = network.nodes.filter((n) => n.type === 'doctor');
  const doctorsByHospital = new Map<string, string[]>();
  doctors.forEach((doc) => {
    const hospitalId = outEdges.get(doc.id)?.find((tid) => network.nodes.find((n) => n.id === tid)?.type === 'hospital');
    if (hospitalId) {
      const list = doctorsByHospital.get(hospitalId) ?? [];
      list.push(doc.id);
      doctorsByHospital.set(hospitalId, list);
    }
  });

  doctorsByHospital.forEach((docIds, hospitalId) => {
    const center = positions[hospitalId] ?? { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };
    const count = docIds.length;
    const radius = 240;
    docIds.forEach((id, index) => {
      const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
      positions[id] = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      };
    });
  });

  // 处理未找到归属医院的医生
  doctors
    .filter((doc) => !positions[doc.id])
    .forEach((doc, index, arr) => {
      const angle = (index / Math.max(arr.length, 1)) * Math.PI * 2;
      positions[doc.id] = {
        x: MAP_SIZE / 2 + Math.cos(angle) * 300,
        y: MAP_SIZE / 2 + Math.sin(angle) * 300,
      };
    });

  // 3. 患者节点：找到其归属医生，在医生周围扇形分布
  const patients = network.nodes.filter((n) => n.type === 'patient');
  const patientsByDoctor = new Map<string, string[]>();
  patients.forEach((pat) => {
    const doctorId = outEdges.get(pat.id)?.find((tid) => network.nodes.find((n) => n.id === tid)?.type === 'doctor');
    if (doctorId) {
      const list = patientsByDoctor.get(doctorId) ?? [];
      list.push(pat.id);
      patientsByDoctor.set(doctorId, list);
    }
  });

  patientsByDoctor.forEach((patIds, doctorId) => {
    const center = positions[doctorId] ?? { x: MAP_SIZE / 2, y: MAP_SIZE / 2 };
    const count = patIds.length;
    const radius = 130;
    patIds.forEach((id, index) => {
      const angle = (index / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
      positions[id] = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius,
      };
    });
  });

  // 处理未找到归属医生的患者
  patients
    .filter((pat) => !positions[pat.id])
    .forEach((pat, index, arr) => {
      const angle = (index / Math.max(arr.length, 1)) * Math.PI * 2;
      positions[pat.id] = {
        x: MAP_SIZE / 2 + Math.cos(angle) * 400,
        y: MAP_SIZE / 2 + Math.sin(angle) * 400,
      };
    });

  return positions;
}

export function NetworkMapModal({ network, records, selectedAlert, isOpen, onClose }: NetworkMapModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);

  const typeColors: Record<string, string> = {
    hospital: '#22d3ee',
    doctor: '#fbbf24',
    patient: '#f43f5e',
    pharmacy: '#10b981',
  };

  const gangColors = [
    '#f43f5e', '#22d3ee', '#fbbf24', '#10b981',
    '#a78bfa', '#fb923c', '#60a5fa', '#c084fc',
  ];

  const positions = useMemo(() => computeMapPositions(network), [network]);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    // 根据容器实际尺寸缩放地图坐标，保证与 SVG 背景对齐
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;
    const displaySize = Math.min(containerWidth, containerHeight);
    const scale = displaySize / MAP_SIZE;
    const offsetX = (containerWidth - displaySize) / 2;
    const offsetY = (containerHeight - displaySize) / 2;

    const nodes = network.nodes.map((node) => {
      const pos = positions[node.id];
      const baseSize = Math.max(20, Math.min(60, node.value / 100));
      const gangColor = node.gangId
        ? gangColors[parseInt(node.gangId.replace('G', '')) % gangColors.length]
        : typeColors[node.type];

      return {
        id: node.id,
        style: {
          x: pos.x * scale + offsetX,
          y: pos.y * scale + offsetY,
          labelText: node.name,
          labelFill: '#e2e8f0',
          labelFontSize: node.type === 'hospital' ? 12 : 10,
          labelMaxWidth: 120,
          size: node.type === 'hospital' ? baseSize * 1.3 : baseSize,
          fill: gangColor,
          stroke: node.gangId ? '#fff' : gangColor,
          lineWidth: node.gangId ? 2 : 1,
          opacity: 0.95,
          labelBackground: node.type === 'hospital',
          labelBackgroundFill: 'rgba(15,23,42,0.7)',
          labelBackgroundRadius: 4,
          labelBackgroundPadding: [2, 4],
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

    const edges = network.edges.map((edge) => ({
      id: `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      style: {
        stroke: 'rgba(34, 211, 238, 0.25)',
        lineWidth: Math.max(1, Math.min(3, edge.value / 2)),
        opacity: 0.55,
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
        nodeSize: (d: any) => d.data.baseSize,
        linkDistance: 90,
        nodeStrength: -60,
        edgeStrength: 0.4,
        damping: 0.85,
        maxSpeed: 80,
        // 医院节点不参与力导向，保持地图固定位置
        nodeFilter: (d: any) => d.data.type !== 'hospital',
      },
      node: {
        state: {
          highlight: {
            size: (d: any) => d.data.baseSize * 1.3,
            lineWidth: 3,
            stroke: '#fff',
            opacity: 1,
            labelFontSize: 12,
            labelFontWeight: 'bold',
          },
          dim: {
            opacity: 0.15,
            labelOpacity: 0.15,
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
            opacity: 0.08,
          },
        },
      },
      behaviors: [
        'drag-canvas',
        'zoom-canvas',
        {
          type: 'drag-element',
          enable: (event: any) => {
            const id = event.target?.id;
            // 禁止拖动医院节点（保持地图位置固定）
            return typeof id === 'string' && !id.startsWith('H');
          },
        },
      ],
      background: 'transparent',
    });

    graphRef.current = graph;
    graph.render();

    graph.on('node:click', (event: any) => {
      const nodeId = event.target?.id || event?.data?.id;
      if (nodeId) {
        const node = network.nodes.find((n) => n.id === nodeId);
        if (node) setSelectedNode(node);
      }
    });

    return () => {
      graph.destroy();
      graphRef.current = null;
    };
  }, [isOpen, network, positions]);

  // 当选中告警变化时高亮路径
  useEffect(() => {
    if (!graphRef.current || !isOpen) return;
    const graph = graphRef.current;
    const allNodeIds = network.nodes.map((n) => n.id);

    allNodeIds.forEach((id) => graph.setElementState(id, []));
    network.edges.forEach((edge) => {
      graph.setElementState(`${edge.source}-${edge.target}`, []);
    });

    if (!selectedAlert) return;

    const record = records.find((r) => r.recordId === selectedAlert.recordId);
    const highlightIds = record
      ? [record.patientId, record.doctorId, record.hospitalId]
      : [selectedAlert.patientId];

    allNodeIds.forEach((id) => {
      graph.setElementState(id, highlightIds.includes(id) ? ['highlight'] : ['dim']);
    });
    network.edges.forEach((edge) => {
      const isHighlighted = record
        ? (edge.source === record.patientId && edge.target === record.doctorId) ||
          (edge.source === record.doctorId && edge.target === record.hospitalId)
        : false;
      graph.setElementState(`${edge.source}-${edge.target}`, isHighlighted ? ['highlight'] : ['dim']);
    });
  }, [selectedAlert, network, records, isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm"
        >
          {/* 顶部工具栏 */}
          <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <MapIcon className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">风险网络地图模式</h2>
                <p className="text-xs text-slate-400">医院固定于南京市区示意位置 · 医生与患者可拖拽</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-slate-700/80 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>关闭</span>
            </button>
          </div>

          {/* 地图 + 图谱容器 */}
          <div className="absolute inset-0">
            <NanjingMapBackground />
            <div ref={containerRef} className="absolute inset-0 w-full h-full">
              <NodeDetailDrawer
                node={selectedNode}
                records={records}
                onClose={() => setSelectedNode(null)}
              />
            </div>
          </div>

          {/* 底部图例 */}
          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-6 px-4 py-2 rounded-lg bg-slate-900/80 border border-slate-700/50 text-xs">
              <div className="flex items-center gap-2">
                <Network className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-slate-300">
                  {network.nodes.length} 节点 · {network.edges.length} 关系 · {network.gangs} 团伙
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  <span className="text-slate-400">医院（固定）</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-slate-400">医生（可拖拽）</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="text-slate-400">患者（可拖拽）</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
