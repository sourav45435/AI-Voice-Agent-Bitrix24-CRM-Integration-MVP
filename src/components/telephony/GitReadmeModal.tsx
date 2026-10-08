import React, { useState } from 'react';
import { 
  X, 
  GitBranch, 
  Copy, 
  Check, 
  FileCode, 
  Terminal, 
  ExternalLink,
  BookOpen,
  CheckCircle2
} from 'lucide-react';

interface GitReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitReadmeModal: React.FC<GitReadmeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const envTemplate = `# Port for the Node.js server
PORT=3000

# Your Bitrix24 Inbound Webhook URL (with crm.lead.add permission)
BITRIX24_WEBHOOK_URL="https://your-domain.bitrix24.com/rest/1/xxxxxxxx/crm.lead.add.json"

# Gemini API Key for NLP extraction
GEMINI_API_KEY="your-gemini-api-key"`;

  const gitCommands = `# 1. Clone repository
git clone https://github.com/your-username/voice-to-bitrix24.git
cd voice-to-bitrix24

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Start production or dev server
npm run dev`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gray-900 text-white">
              <GitBranch size={16} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Repository Deliverables & README</h3>
              <p className="text-[11px] text-gray-400">Clean source code, setup instructions & environment variables</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-gray-700">
          {/* Deliverables Checklist */}
          <div className="bg-emerald-50/60 border border-emerald-200 p-4 rounded-2xl space-y-2">
            <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" />
              Verified Acceptance Deliverables:
            </h4>
            <ul className="space-y-1 text-emerald-900 text-[11px]">
              <li>✓ <strong>Clean, well-commented source code:</strong> TypeScript Express backend (`server.ts`) + React UI.</li>
              <li>✓ <strong>README.md:</strong> Architecture diagram, step-by-step setup guides, and API documentation.</li>
              <li>✓ <strong>Environment Variables:</strong> Documented in `.env.example` with `BITRIX24_WEBHOOK_URL` & `GEMINI_API_KEY`.</li>
              <li>✓ <strong>Live Telephony Adapters:</strong> Twilio TwiML Speech &lt;Gather&gt; + Dialogflow Fulfillment + WebRTC Softphone.</li>
            </ul>
          </div>

          {/* Setup Commands */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <Terminal size={14} className="text-blue-600" />
                Quickstart Git & Deployment Commands
              </span>
              <button
                onClick={() => copyText(gitCommands, 'git')}
                className="text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'git' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>Copy commands</span>
              </button>
            </div>
            <pre className="bg-gray-900 text-emerald-300 p-3.5 rounded-2xl text-[11px] font-mono overflow-x-auto">
              {gitCommands}
            </pre>
          </div>

          {/* Environment Variables */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <FileCode size={14} className="text-[#FF5A1F]" />
                Environment Variables (`.env.example`)
              </span>
              <button
                onClick={() => copyText(envTemplate, 'env')}
                className="text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === 'env' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>Copy .env</span>
              </button>
            </div>
            <pre className="bg-gray-900 text-amber-300 p-3.5 rounded-2xl text-[11px] font-mono overflow-x-auto">
              {envTemplate}
            </pre>
          </div>

          {/* Source Code File Structure */}
          <div>
            <span className="font-bold text-gray-900 block mb-1.5">
              Source Code Structure Overview
            </span>
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-2xl font-mono text-[11px] space-y-1 text-gray-700">
              <div>📁 <strong>/server.ts</strong> — Express webhook router (Twilio, Dialogflow, Bitrix24 REST API, Gemini NLP)</div>
              <div>📁 <strong>/src/components/telephony/</strong></div>
              <div className="pl-4">├── <strong>CallSimulator.tsx</strong> — Softphone with Web Speech STT/TTS & 3-step questions</div>
              <div className="pl-4">├── <strong>PipelineInspector.tsx</strong> — Real-time 5-step journey telemetry visualizer</div>
              <div className="pl-4">├── <strong>DialogflowConsole.tsx</strong> — Dialogflow fulfillment webhook tester & logs</div>
              <div className="pl-4">├── <strong>BitrixLeadsTable.tsx</strong> — CRM lead records inspector & payload viewer</div>
              <div className="pl-4">└── <strong>BitrixConfigModal.tsx</strong> — Live webhook configuration modal</div>
              <div>📁 <strong>/README.md</strong> — Full setup & deployment documentation</div>
              <div>📁 <strong>/.env.example</strong> — Environment template</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">View README.md in root directory for full details</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
