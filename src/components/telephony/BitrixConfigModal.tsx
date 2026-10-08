import React, { useState } from 'react';
import { 
  X, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Database, 
  Send,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

interface BitrixConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
  onSaveWebhook: (url: string) => void;
}

export const BitrixConfigModal: React.FC<BitrixConfigModalProps> = ({
  isOpen,
  onClose,
  webhookUrl,
  onSaveWebhook,
}) => {
  const [inputUrl, setInputUrl] = useState(webhookUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!inputUrl.trim()) {
      setTestResult({ ok: false, message: 'Please enter a Bitrix24 Webhook URL' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/bitrix/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: inputUrl.trim() }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ ok: false, message: `Network error: ${err.message}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveWebhook(inputUrl.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div 
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-orange-50 text-[#FF5A1F]">
              <Database size={16} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Bitrix24 REST API Webhook Settings</h3>
              <p className="text-[11px] text-gray-400">Connect your live Bitrix24 portal for real-time lead creation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-800 block mb-1.5">
              Bitrix24 Inbound Webhook URL
            </label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                setTestResult(null);
              }}
              placeholder="https://your-domain.bitrix24.com/rest/1/xxxxxx/crm.lead.add.json"
              className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-orange-400 focus:bg-white transition-all text-gray-900 placeholder:text-gray-400"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">
              Leave blank to use the built-in verified Bitrix24 simulator, or paste your real Bitrix24 webhook to write directly into your CRM.
            </span>
          </div>

          {/* Test connection action */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !inputUrl.trim()}
              className="px-4 py-2 bg-gray-900 hover:bg-black disabled:bg-gray-200 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Key size={13} />
              <span>{isTesting ? 'Testing connection...' : 'Test Bitrix24 Webhook'}</span>
            </button>
          </div>

          {/* Test Result Message */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{testResult.message}</span>
            </div>
          )}

          {/* How-to guide */}
          <div className="bg-orange-50/50 border border-orange-100 rounded-2xl p-4 text-xs space-y-2">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-[#FF5A1F]" />
              How to create your Bitrix24 Webhook (2 minutes):
            </span>
            <ol className="list-decimal list-inside space-y-1 text-gray-600 text-[11px] leading-relaxed">
              <li>In your Bitrix24, go to <strong>Developer Zone / Applications &gt; Webhooks</strong>.</li>
              <li>Click <strong>Add Webhook &gt; Inbound Webhook</strong>.</li>
              <li>Under Permissions, select <strong>CRM (<code className="font-mono">crm</code>)</strong>.</li>
              <li>Copy the generated REST URL and append <code className="font-mono font-semibold text-gray-900">crm.lead.add.json</code>.</li>
            </ol>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={() => {
              setInputUrl('');
              setTestResult(null);
            }}
            className="text-xs text-gray-500 hover:text-gray-800"
          >
            Clear Webhook (Use Simulator)
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-[#FF5A1F] hover:bg-[#E54D14] text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
