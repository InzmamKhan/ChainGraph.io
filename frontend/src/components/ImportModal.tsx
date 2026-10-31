import React, { useState } from 'react';
import { HelpCircle, Upload, Plus, FileSpreadsheet, Trash2, ArrowRight, X, AlertCircle } from 'lucide-react';
import { AnalysisResponse } from '../types/graph';
import { API_ENDPOINTS } from '../services/api';
import axios from 'axios';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (data: AnalysisResponse) => void;
}

interface ManualRecord {
  txHash: string;
  timestamp: string;
  fromWallet: string;
  toWallet: string;
  amount: string;
  tokenSymbol: string;
  gasFee: string;
  walletAgeDays: string;
}

const emptyForm: ManualRecord = {
  txHash: '',
  timestamp: '',
  fromWallet: '',
  toWallet: '',
  amount: '',
  tokenSymbol: 'USDT',
  gasFee: '0.001',
  walletAgeDays: '30',
};

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onDataLoaded }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual input state
  const [formData, setFormData] = useState<ManualRecord>(emptyForm);
  const [recordsQueue, setRecordsQueue] = useState<ManualRecord[]>([]);

  if (!isOpen) return null;

  // File Upload flow
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select an Excel or CSV file first.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      const res = await axios.post<AnalysisResponse>(API_ENDPOINTS.UPLOAD_FILE, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onDataLoaded(res.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to analyze file.');
    } finally {
      setLoading(false);
    }
  };

  // Manual records flow
  const handleAddRecord = () => {
    if (!formData.fromWallet || !formData.toWallet || !formData.amount) {
      setErrorMsg('From Wallet, To Wallet, and Amount are required fields.');
      return;
    }
    const cleanRecord: ManualRecord = {
      ...formData,
      txHash: formData.txHash.trim() || `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
      timestamp: formData.timestamp.trim() || new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    setRecordsQueue([...recordsQueue, cleanRecord]);
    setFormData(emptyForm);
    setErrorMsg(null);
  };

  const handleRemoveRecord = (idx: number) => {
    setRecordsQueue(recordsQueue.filter((_, i) => i !== idx));
  };

  const handleAnalyzeManualRecords = async () => {
    if (recordsQueue.length === 0) {
      setErrorMsg('Please add at least 1 record to the queue.');
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const payload = recordsQueue.map((r) => ({
        txHash: r.txHash,
        timestamp: r.timestamp,
        fromWallet: r.fromWallet,
        toWallet: r.toWallet,
        amount: parseFloat(r.amount) || 0.0,
        tokenSymbol: r.tokenSymbol || 'USDT',
        gasFee: parseFloat(r.gasFee) || 0.001,
        walletAgeDays: parseInt(r.walletAgeDays, 10) || 30,
      }));

      const res = await axios.post<AnalysisResponse>(API_ENDPOINTS.ANALYZE_MANUAL, payload);
      onDataLoaded(res.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to analyze manual records.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 5, 8, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '950px',
          maxWidth: '96vw',
          maxHeight: '90vh',
          backgroundColor: '#0e0f15',
          border: '1px solid rgba(0, 229, 255, 0.3)',
          borderRadius: '14px',
          boxShadow: '0 0 35px rgba(0, 229, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#FFF',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#12131b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileSpreadsheet color="#00E5FF" size={20} />
            <h3 style={{ margin: 0, fontSize: '16px', letterSpacing: '0.5px', fontWeight: 600 }}>
              IMPORT TRANSACTION DATA
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8E9297',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div
            style={{
              background: 'rgba(255, 0, 85, 0.15)',
              borderBottom: '1px solid #FF0055',
              color: '#FF4D80',
              padding: '10px 24px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            {errorMsg}
          </div>
        )}

        {/* 2-Column Split Body */}
        <div style={{ display: 'flex', flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {/* LEFT COLUMN: Local File Import */}
          <div
            style={{
              flex: 1,
              padding: '24px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '13px', color: '#00E5FF', textTransform: 'uppercase' }}>
                1. Upload File From Local Storage
              </h4>
              {/* Question mark help icon */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#8E9297',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="View required schema format"
                >
                  <HelpCircle size={17} />
                </button>

                {/* Pop-up explaining schema format */}
                {showHelp && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '28px',
                      width: '320px',
                      backgroundColor: '#161822',
                      border: '1px solid #00E5FF',
                      borderRadius: '8px',
                      padding: '14px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8)',
                      zIndex: 20,
                      fontSize: '11px',
                      lineHeight: '1.5',
                      color: '#E0E0E0',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#00E5FF', marginBottom: '8px' }}>
                      Required Sheet Schema
                    </div>
                    <div>Your <code>.xlsx</code>, <code>.xls</code>, or <code>.csv</code> file must include the following headers:</div>
                    <ul style={{ paddingLeft: '18px', margin: '6px 0', fontFamily: 'monospace' }}>
                      <li><strong>tx_hash</strong> (string)</li>
                      <li><strong>timestamp</strong> (YYYY-MM-DD HH:MM:SS)</li>
                      <li><strong>from_wallet</strong> (0x... address)</li>
                      <li><strong>to_wallet</strong> (0x... address)</li>
                      <li><strong>amount</strong> (numeric float)</li>
                      <li><strong>token_symbol</strong> (e.g. USDT, ETH)</li>
                      <li><strong>gas_fee</strong> (numeric, optional)</li>
                      <li><strong>wallet_age_days</strong> (integer, optional)</li>
                    </ul>
                    <div style={{ marginTop: '8px', color: '#8E9297', fontSize: '10px' }}>
                      Click question mark icon again to dismiss.
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: '#8E9297', lineHeight: 1.4 }}>
              Choose a pre-existing <code>.xlsx</code> or <code>.csv</code> file from your machine to batch-analyze thousands of transactions.
            </p>

            {/* Drop / File Select Box */}
            <label
              style={{
                border: '2px dashed rgba(0, 229, 255, 0.35)',
                borderRadius: '10px',
                padding: '36px 20px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(0, 229, 255, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                transition: 'border 0.2s ease',
              }}
            >
              <Upload size={32} color="#00E5FF" />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>
                {selectedFile ? selectedFile.name : 'Select .xlsx or .csv from Local Storage'}
              </span>
              <span style={{ fontSize: '11px', color: '#6A6F7D' }}>Supports Excel 97-2004, XLSX, and CSV</span>
              <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileChange} style={{ display: 'none' }} />
            </label>

            {selectedFile && (
              <div
                style={{
                  fontSize: '11px',
                  color: '#00FF66',
                  background: 'rgba(0, 255, 102, 0.08)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>File ready: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={handleFileUpload}
                disabled={loading || !selectedFile}
                style={{
                  width: '100%',
                  background: !selectedFile ? '#1b1d28' : 'linear-gradient(135deg, #00E5FF 0%, #0088FF 100%)',
                  color: !selectedFile ? '#5A5E6B' : '#000',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '12px',
                  letterSpacing: '0.5px',
                  cursor: !selectedFile || loading ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                }}
              >
                {loading ? 'ANALYZING NETWORK...' : 'PROCESS SELECTED FILE'}
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Manual Record-by-Record Creation */}
          <div
            style={{
              flex: 1.2,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h4 style={{ margin: 0, fontSize: '13px', color: '#00FF66', textTransform: 'uppercase' }}>
                2. Insert Records Manually (One by One)
              </h4>
              <span style={{ fontSize: '11px', color: '#8E9297' }}>
                Queued: <strong>{recordsQueue.length}</strong>
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: '#8E9297', lineHeight: 1.4 }}>
              Fill in the parameters below. Press <strong>Next</strong> to admit each record and queue it for analysis.
            </p>

            {/* Input Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#8E9297', display: 'block', marginBottom: '3px' }}>
                  From Wallet *
                </label>
                <input
                  type="text"
                  placeholder="0xSender..."
                  value={formData.fromWallet}
                  onChange={(e) => setFormData({ ...formData, fromWallet: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#8E9297', display: 'block', marginBottom: '3px' }}>
                  To Wallet *
                </label>
                <input
                  type="text"
                  placeholder="0xRecipient..."
                  value={formData.toWallet}
                  onChange={(e) => setFormData({ ...formData, toWallet: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#8E9297', display: 'block', marginBottom: '3px' }}>
                  Amount *
                </label>
                <input
                  type="number"
                  placeholder="1000.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#8E9297', display: 'block', marginBottom: '3px' }}>
                  Token Symbol
                </label>
                <input
                  type="text"
                  placeholder="USDT"
                  value={formData.tokenSymbol}
                  onChange={(e) => setFormData({ ...formData, tokenSymbol: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#8E9297', display: 'block', marginBottom: '3px' }}>
                  Transaction Hash (optional)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if empty"
                  value={formData.txHash}
                  onChange={(e) => setFormData({ ...formData, txHash: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#8E9297', display: 'block', marginBottom: '3px' }}>
                  Timestamp (optional)
                </label>
                <input
                  type="text"
                  placeholder="YYYY-MM-DD HH:MM:SS"
                  value={formData.timestamp}
                  onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* "Next" button to admit 1 record */}
            <button
              type="button"
              onClick={handleAddRecord}
              style={{
                alignSelf: 'flex-start',
                background: 'rgba(0, 255, 102, 0.12)',
                border: '1px solid #00FF66',
                color: '#00FF66',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>NEXT (ADMIT RECORD)</span>
              <ArrowRight size={14} />
            </button>

            {/* Queued records mini-table */}
            <div
              style={{
                flex: 1,
                minHeight: '110px',
                maxHeight: '160px',
                overflowY: 'auto',
                backgroundColor: '#090a0e',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '8px',
              }}
            >
              {recordsQueue.length === 0 ? (
                <div style={{ color: '#5A5E6B', fontSize: '11px', textAlign: 'center', padding: '30px 0' }}>
                  No records admitted yet. Fill out fields and click Next.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {recordsQueue.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: '#12141d',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                      }}
                    >
                      <span style={{ color: '#00E5FF' }}>#{i + 1}</span>
                      <span style={{ color: '#FFF' }}>{item.fromWallet.substring(0, 8)}...</span>
                      <span style={{ color: '#8E9297' }}>→</span>
                      <span style={{ color: '#FFF' }}>{item.toWallet.substring(0, 8)}...</span>
                      <span style={{ color: '#00FF66' }}>
                        {item.amount} {item.tokenSymbol}
                      </span>
                      <button
                        onClick={() => handleRemoveRecord(i)}
                        style={{ background: 'none', border: 'none', color: '#FF0055', cursor: 'pointer', padding: 0 }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Batch submit button */}
            <button
              type="button"
              onClick={handleAnalyzeManualRecords}
              disabled={loading || recordsQueue.length === 0}
              style={{
                width: '100%',
                background: recordsQueue.length === 0 ? '#1b1d28' : 'linear-gradient(135deg, #00FF66 0%, #009944 100%)',
                color: recordsQueue.length === 0 ? '#5A5E6B' : '#000',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '12px',
                letterSpacing: '0.5px',
                cursor: recordsQueue.length === 0 || loading ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'ANALYZING QUEUED RECORDS...' : `ANALYZE ${recordsQueue.length} ADMITTED RECORDS`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  background: '#12141e',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '5px',
  color: '#FFFFFF',
  padding: '7px 9px',
  fontSize: '11px',
  outline: 'none',
  fontFamily: 'monospace',
};
