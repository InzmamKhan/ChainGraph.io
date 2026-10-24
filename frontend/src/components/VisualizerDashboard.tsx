import React, { useState, useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { AnalysisResponse } from '../types/graph';
import { RGBNode } from './RGBNode';
import axios from 'axios';

const nodeTypes = {
  customRGB: RGBNode,
};

export const VisualizerDashboard: React.FC = () => {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setSelectedFile(file);

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const response = await axios.post<AnalysisResponse>(
        'http://localhost:8080/api/transactions/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setData(response.data);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to analyze Excel/CSV file. Make sure Spring Boot and Python are running.');
    } finally {
      setLoading(false);
    }
  };

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

        {/* File Upload Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <label style={{
            background: 'linear-gradient(135deg, #FF0055 0%, #7928CA 100%)',
            color: '#FFF',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            boxShadow: '0 0 14px rgba(255, 0, 85, 0.4)'
          }}>
            {loading ? 'ANALYZING NETWORK...' : 'UPLOAD EXCEL / CSV'}
            <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
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
        </aside>

        {/* ReactFlow Canvas */}
        <div style={{ flex: 1, height: '100%', background: '#0a0a0c' }}>
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
        </div>
      </div>
    </div>
  );
};
export default VisualizerDashboard;
