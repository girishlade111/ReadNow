import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Download, Lock, RefreshCw, AlertTriangle, Eye, Server, FileText } from 'lucide-react';
import { AuditLog, EnterpriseSettings } from '../types';
import { api } from '../services/api';

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<EnterpriseSettings>({
    dlpEnabled: false,
    zeroDataRetention: true,
    autoDigestSchedule: 'weekly',
    retentionDays: 365
  });
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'logs' | 'governance'>('logs');

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedLogs, fetchedSettings] = await Promise.all([
        api.getAuditLogs(),
        api.getSettings()
      ]);
      setLogs(fetchedLogs);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Failed to load audit logs/settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleDlp = async () => {
    try {
      const updated = await api.updateSettings({ dlpEnabled: !settings.dlpEnabled });
      setSettings(updated);
      await loadData();
    } catch (err) {
      alert('Failed to update DLP settings');
    }
  };

  const handleToggleZeroData = async () => {
    try {
      const updated = await api.updateSettings({ zeroDataRetention: !settings.zeroDataRetention });
      setSettings(updated);
      await loadData();
    } catch (err) {
      alert('Failed to update zero data retention');
    }
  };

  const exportAuditCSV = () => {
    let csv = 'ID,Timestamp,Action,Actor,Details\n';
    logs.forEach(l => {
      csv += `"${l.id}","${l.timestamp}","${l.action}","${l.actor}","${l.details.replace(/"/g, '""')}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `readnow_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-4xl overflow-hidden font-sans">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-400 border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-xl tracking-tight uppercase">Enterprise Data Governance & Audit Log</h2>
              <p className="text-xs text-slate-300 font-medium">Compliance, PII DLP Masking & Action History</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white text-black border-2 border-black hover:bg-yellow-300 font-bold transition-transform active:translate-y-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex border-b-4 border-black bg-gray-100 font-extrabold text-xs uppercase">
          <button
            onClick={() => setTab('logs')}
            className={`flex-1 py-3 px-4 border-r-2 border-black flex items-center justify-center gap-2 ${
              tab === 'logs' ? 'bg-yellow-300 text-black' : 'hover:bg-gray-200 text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" /> Real-time Audit Trail ({logs.length})
          </button>
          <button
            onClick={() => setTab('governance')}
            className={`flex-1 py-3 px-4 flex items-center justify-center gap-2 ${
              tab === 'governance' ? 'bg-yellow-300 text-black' : 'hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Lock className="w-4 h-4" /> Security & DLP Controls
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {tab === 'logs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-gray-600">
                  Immutable record of all system events, document parses, exports, and AI queries.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={loadData}
                    className="px-3 py-1.5 bg-gray-100 border-2 border-black font-bold text-xs flex items-center gap-1 hover:bg-gray-200"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                  <button
                    onClick={exportAuditCSV}
                    className="px-3 py-1.5 bg-yellow-400 border-2 border-black font-extrabold text-xs flex items-center gap-1 hover:bg-yellow-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                </div>
              </div>

              <div className="border-2 border-black overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-slate-900 text-white font-sans uppercase text-[11px] border-b-2 border-black">
                    <tr>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5">Actor</th>
                      <th className="p-2.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-yellow-50/50">
                        <td className="p-2.5 whitespace-nowrap text-gray-500 text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 font-bold border border-black text-[10px] uppercase ${
                            log.action === 'ARTICLE_SAVED' ? 'bg-green-100 text-green-800' :
                            log.action === 'ARTICLE_DELETED' ? 'bg-red-100 text-red-800' :
                            log.action === 'AI_RAG_QUERY' ? 'bg-purple-100 text-purple-800' :
                            log.action === 'EXPORT_PERFORMED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-2.5 font-bold text-gray-800">{log.actor}</td>
                        <td className="p-2.5 text-gray-700">{log.details}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-gray-500">
                          No audit log entries recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'governance' && (
            <div className="space-y-6">
              {/* DLP Card */}
              <div className="p-5 border-3 border-black bg-purple-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-purple-950 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-purple-700" /> Data Loss Prevention (DLP) - PII Masking
                    </h3>
                    <p className="text-xs text-purple-900 font-medium">
                      Automatically detects and redacts emails, SSNs, and credit card numbers prior to sending text to AI models.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleDlp}
                    className={`px-4 py-2 font-black border-2 border-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      settings.dlpEnabled ? 'bg-emerald-400 text-black' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {settings.dlpEnabled ? 'Active (Enabled)' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Zero Data Retention */}
              <div className="p-5 border-3 border-black bg-blue-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-base text-blue-950 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-blue-700" /> Zero Data Retention Guarantee
                    </h3>
                    <p className="text-xs text-blue-900 font-medium">
                      Ensures model API prompts are strictly ephemeral and never retained or used to train public LLMs.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleZeroData}
                    className={`px-4 py-2 font-black border-2 border-black uppercase text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                      settings.zeroDataRetention ? 'bg-emerald-400 text-black' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {settings.zeroDataRetention ? 'Active (Strict)' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Encryption & Storage info */}
              <div className="p-5 border-3 border-black bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-2">
                <h3 className="font-extrabold text-base text-black flex items-center gap-2">
                  <Server className="w-5 h-5 text-amber-700" /> Data Storage & Security Profile
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono pt-2">
                  <div className="p-3 bg-white border border-black">
                    <span className="font-bold block text-gray-500">Storage Backend:</span>
                    <span className="font-extrabold text-black">Local Enterprise JSON / PostgreSQL Sync</span>
                  </div>
                  <div className="p-3 bg-white border border-black">
                    <span className="font-bold block text-gray-500">Encryption Standard:</span>
                    <span className="font-extrabold text-black">AES-256 (At Rest & In Transit)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-100 border-t-4 border-black flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black font-bold border-2 border-black hover:bg-yellow-300 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 text-sm uppercase"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
