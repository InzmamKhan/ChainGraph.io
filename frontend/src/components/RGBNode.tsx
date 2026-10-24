import React from 'react';
import { Handle, Position } from 'reactflow';

interface RGBNodeProps {
  data: {
    label: string;
    anomalyType: string;
    riskScore: number;
    color: string;
    inDegree: number;
    outDegree: number;
  };
}

export const RGBNode: React.FC<RGBNodeProps> = ({ data }) => {
  const isHighRisk = data.riskScore >= 70;

  return (
    <div
      style={{
        padding: '10px 14px',
        borderRadius: '10px',
        background: '#12131a',
        border: `2px solid ${data.color}`,
        boxShadow: `0 0 16px ${data.color}88, inset 0 0 8px ${data.color}33`,
        color: '#FFFFFF',
        fontFamily: 'monospace',
        minWidth: '130px',
        textAlign: 'center',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: data.color }} />
      <div style={{ fontSize: '11px', fontWeight: 'bold', color: data.color, textTransform: 'uppercase' }}>
        {data.anomalyType}
      </div>
      <div style={{ fontSize: '13px', margin: '4px 0', letterSpacing: '0.5px' }}>
        {data.label}
      </div>
      <div style={{ fontSize: '10px', color: '#8E9297' }}>
        In: {data.inDegree} | Out: {data.outDegree}
      </div>
      {isHighRisk && (
        <div style={{
          marginTop: '4px',
          fontSize: '9px',
          background: 'rgba(255, 0, 85, 0.2)',
          color: '#FF0055',
          borderRadius: '4px',
          padding: '2px 4px',
          border: '1px solid #FF0055'
        }}>
          RISK: {data.riskScore}%
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: data.color }} />
    </div>
  );
};
