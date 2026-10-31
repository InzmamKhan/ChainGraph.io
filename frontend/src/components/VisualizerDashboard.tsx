import React, { useState, useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { AnalysisResponse } from '../types/graph';
import { RGBNode } from './RGBNode';
import { ImportModal } from './ImportModal';
import { Database } from 'lucide-react';

const nodeTypes = {
  customRGB: RGBNode,
};

export const VisualizerDashboard: React.FC = () => {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Convert Python/Spring response into ReactFlow layout
  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };

    // Layout calculation (Circular/Force distribution layout)
    const count = data.nodes.length;
    const radius = Math.max(300, count * 28);
    const centerX = 600;
    const centerY = 450;

    const flowNodes: Node[] = data.nodes.map((n, i) => {
      const angle = (i / count) * 2 * Math.PI;
      return {
        id: n.id,
        type: 'customRGB',
        position: {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
        },
        data: n,
      };
    });

    const flowEdges: Edge[] = data.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.isHighFrequency,
      style: {
        stroke: e.isHighFrequency ? '#00E5FF' : 'rgba(0, 229, 255, 0.45)',
        strokeWidth: e.edgeThickness,
      },
      label: e.transactionCount > 1 ? `${e.transactionCount} txs` : undefined,
      labelStyle: { fill: '#00E5FF', fontSize: 10, fontFamily: 'monospace' },
      labelBgStyle: { fill: '#0a0a0c', fillOpacity: 0.8 },
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [data]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0c', color: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
      {/* Top Cyber Navigation Bar */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0e0f15'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#00FF66', boxShadow: '0 0 10px #00FF66' }} />
          <h2 style={{ margin: 0, fontSize: '18px', letterSpacing: '1px', fontWeight: 700 }}>
            CHAINGRAPH <span style={{ color: '#00E5FF', fontSize: '12px' }}>ML DETECTOR</span>
          </h2>
        </div>

        {/* Import Data Trigger Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #00E5FF 0%, #7928CA 100%)',
              color: '#FFF',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '7px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              boxShadow: '0 0 16px rgba(0, 229, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'transform 0.15s ease',
            }}
          >
            <Database size={16} />
            <span>IMPORT DATA</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Area */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Metric Sidebar */}
        <aside style={{
          width: '320px',
          background: '#0e0f15',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 10
        }}>
          <div>
            <h4 style={{ color: '#8E9297', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Summary & Forensics
            </h4>
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#8E9297' }}>Total Wallets:</span>
                <span style={{ fontWeight: 'bold' }}>{data?.summary.uniqueWallets || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#8E9297' }}>Total Tx Volume:</span>
                <span style={{ fontWeight: 'bold', color: '#00FF66' }}>
                  ${data?.summary.totalVolume ? data.summary.totalVolume.toLocaleString() : '0.00'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#8E9297' }}>Anomalies Flagged:</span>
                <span style={{ fontWeight: 'bold', color: '#FF0055' }}>{data?.summary.anomalyCount || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#8E9297' }}>Network Risk:</span>
                <span style={{ fontWeight: 'bold', color: (data?.summary.overallRiskScore || 0) > 50 ? '#FF0055' : '#00FF66' }}>
                  {data?.summary.overallRiskScore || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Color Legend */}
          <div>
            <h4 style={{ color: '#8E9297', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              RGB Anomaly Legend
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px', fontSize: '12px' }}>
              <div><span style={{ color: '#00FF66' }}>●</span> Normal / Benign</div>
              <div><span style={{ color: '#FF0055' }}>●</span> Circular Repetition / Peeling</div>
              <div><span style={{ color: '#FF9900' }}>●</span> Fan-in / Fan-out Hub</div>
              <div><span style={{ color: '#00E5FF' }}>●</span> High-Frequency Ping-Pong</div>
            </div>
          </div>

          {/* Anomalies List */}
          {data && data.detectedAnomalies && data.detectedAnomalies.length > 0 && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <h4 style={{ color: '#8E9297', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Threat Detection Feed ({data.detectedAnomalies.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {data.detectedAnomalies.map((anom, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px',
                      background: '#12141f',
                      borderLeft: `3px solid ${anom.type.includes('CIRCULAR') || anom.type.includes('PEELING') ? '#FF0055' : '#FF9900'}`,
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ color: '#FFF', fontWeight: 600 }}>{anom.type}</div>
                    <div style={{ color: '#8E9297', fontSize: '10px', fontFamily: 'monospace' }}>
                      {anom.wallet.substring(0, 14)}...
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ReactFlow Canvas */}
        <div style={{ flex: 1, height: '100%', background: '#0a0a0c' }}>
          {nodes.length === 0 ? (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#5A5E6B',
              gap: '12px'
            }}>
              <Database size={42} color="#00E5FF" opacity={0.4} />
              <div style={{ fontSize: '15px', color: '#8E9297', fontWeight: 500 }}>
                No active graph loaded
              </div>
              <div style={{ fontSize: '12px' }}>
                Click <strong>IMPORT DATA</strong> in the top-right to upload a file or insert records manually.
              </div>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background color="#1f2230" gap={20} size={1} />
              <Controls />
              <MiniMap style={{ background: '#0e0f15' }} nodeColor={(n) => (n.data as any)?.color || '#00FF66'} />
            </ReactFlow>
          )}
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDataLoaded={(newData) => setData(newData)}
      />
    </div>
  );
};
export default VisualizerDashboard;
