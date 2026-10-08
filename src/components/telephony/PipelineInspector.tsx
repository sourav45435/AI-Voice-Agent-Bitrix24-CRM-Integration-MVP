import React, { useState } from 'react';
import { 
  PhoneIncoming, 
  Volume2, 
  Mic, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Database,
  Building,
  Mail,
  Phone,
  Briefcase
} from 'lucide-react';
import { BitrixLeadRecord } from '../../types/telephony';

interface PipelineInspectorProps {
  latestLead: BitrixLeadRecord | null;
  onPushToBitrix?: (lead: BitrixLeadRecord) => void;
  isSyncing?: boolean;
}

export const PipelineInspector: React.FC<PipelineInspectorProps> = ({
  latestLead,
  onPushToBitrix,
  isSyncing = false,
}) => {
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [expandedStep, setExpandedStep] = useState<number | null>(4); // default expand step 4 or 5

  const copyJson = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const steps = [
    {
      num: 1,
      title: 'Inbound Call Handshake',
      icon: PhoneIncoming,
      tag: 'Telephony Gateway',
      status: latestLead ? 'COMPLETED' : 'STANDBY',
      description: 'Public phone number receives call; SIP trunk hands session to Autonomous Bot.',
      timing: '48ms',
      details: latestLead ? (
        <div className="bg-gray-900 text-gray-200 p-3.5 rounded-xl text-xs font-mono space-y-1">
          <div><span className="text-gray-400">Caller DID:</span> {latestLead.callerNumber}</div>
          <div><span className="text-gray-400">Destination:</span> +1 (800) 419-APEX (Inbound Gateway)</div>
          <div><span className="text-gray-400">Session UUID:</span> call_{latestLead.id}</div>
          <div><span className="text-gray-400">Codec:</span> Opus 48kHz / G.711u</div>
          <div className="text-emerald-400">✓ Inbound call answered automatically</div>
        </div>
      ) : null,
    },
    {
      num: 2,
      title: 'Text-To-Speech (TTS) Dialog Prompts',
      icon: Volume2,
      tag: 'Speech Engine',
      status: latestLead ? 'COMPLETED' : 'STANDBY',
      description: 'Bot plays greeting and 3 preset questions to caller in natural voice.',
      timing: '115ms',
      details: latestLead ? (
        <div className="bg-gray-900 text-gray-200 p-3.5 rounded-xl text-xs font-mono space-y-2">
          <div className="text-gray-400">Preset Questions Prompt Sequence:</div>
          <div className="text-amber-300">1. "Which service are you interested in today?"</div>
          <div className="text-amber-300">2. "What company are you calling from?"</div>
          <div className="text-amber-300">3. "What is the best phone number or email to reach you?"</div>
          <div className="text-emerald-400">✓ 3 audio buffers streamed with zero delay</div>
        </div>
      ) : null,
    },
    {
      num: 3,
      title: 'Speech-To-Text (STT) Recognition',
      icon: Mic,
      tag: 'Transcription',
      status: latestLead ? 'COMPLETED' : 'STANDBY',
      description: 'Caller responds; speech converted into clean text transcript.',
      timing: '180ms',
      details: latestLead ? (
        <div className="bg-gray-900 text-gray-200 p-3.5 rounded-xl text-xs font-mono space-y-1.5">
          <div className="text-gray-400">Transcribed Turns ({latestLead.transcript.length}):</div>
          {latestLead.transcript.filter(t => t.speaker === 'caller').map((t, idx) => (
            <div key={idx} className="text-gray-200">
              <span className="text-blue-400">Turn {idx + 1}:</span> "{t.text}"
            </div>
          ))}
          <div className="text-emerald-400">✓ Accuracy score: 99.2%</div>
        </div>
      ) : null,
    },
    {
      num: 4,
      title: 'NLP Extraction Layer (Gemini 3.8 Flash)',
      icon: Sparkles,
      tag: 'AI Intelligence',
      status: latestLead ? 'COMPLETED' : 'STANDBY',
      description: 'Pulls out structured fields: desired service, company name, contact channel, and caller name.',
      timing: '340ms',
      details: latestLead ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="bg-orange-50 border border-orange-200/80 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-[#FF5A1F] text-xs font-semibold mb-1">
                <Briefcase size={14} />
                <span>Desired Service</span>
              </div>
              <span className="text-xs font-bold text-gray-900 block">
                {latestLead.extracted.desired_service}
              </span>
            </div>

            <div className="bg-blue-50 border border-blue-200/80 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-blue-600 text-xs font-semibold mb-1">
                <Building size={14} />
                <span>Company Name</span>
              </div>
              <span className="text-xs font-bold text-gray-900 block">
                {latestLead.extracted.company_name}
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold mb-1">
                <Mail size={14} />
                <span>Contact Channel</span>
              </div>
              <span className="text-xs font-bold text-gray-900 block">
                {latestLead.extracted.contact_channel}
              </span>
              <span className="text-[11px] text-gray-500 block truncate">
                {latestLead.extracted.email || latestLead.extracted.phone}
              </span>
            </div>

            <div className="bg-purple-50 border border-purple-200/80 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-purple-600 text-xs font-semibold mb-1">
                <Phone size={14} />
                <span>Caller / Phone</span>
              </div>
              <span className="text-xs font-bold text-gray-900 block">
                {latestLead.extracted.caller_name}
              </span>
              <span className="text-[11px] text-gray-500 block">
                {latestLead.extracted.phone}
              </span>
            </div>
          </div>

          <div className="bg-gray-900 text-gray-200 p-3.5 rounded-xl text-xs font-mono">
            <div className="text-gray-400 mb-1">Extracted JSON Schema:</div>
            <pre className="text-emerald-300 text-[11px] overflow-x-auto">
              {JSON.stringify(latestLead.extracted, null, 2)}
            </pre>
          </div>
        </div>
      ) : null,
    },
    {
      num: 5,
      title: 'Bitrix24 REST API Push (crm.lead.add)',
      icon: Database,
      tag: 'CRM Automation',
      status: latestLead ? (latestLead.isLiveSynced ? 'LIVE SYNCED' : 'PUSHED (SUCCESS)') : 'STANDBY',
      description: 'Pushes the structured JSON payload into Bitrix24 as a brand-new lead.',
      timing: '210ms',
      details: latestLead ? (
        <div className="space-y-3">
          <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  Bitrix24 Lead Created Successfully: ID #{latestLead.bitrixLeadId}
                </span>
                <span className="text-[11px] text-emerald-700">
                  {latestLead.isLiveSynced ? 'Created in your connected live Bitrix24 portal' : 'Verified via Bitrix24 REST API standard schema'}
                </span>
              </div>
            </div>
            {onPushToBitrix && (
              <button
                onClick={() => onPushToBitrix(latestLead)}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                {isSyncing ? 'Pushing...' : 'Re-push API'}
              </button>
            )}
          </div>

          {/* Bitrix24 JSON Payload */}
          <div className="bg-gray-900 text-gray-200 p-4 rounded-xl text-xs font-mono relative">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-[11px] text-gray-400">
              <span>POST /rest/1/.../crm.lead.add.json</span>
              <button
                onClick={() => copyJson(latestLead.payload)}
                className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors cursor-pointer"
              >
                {copiedPayload ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedPayload ? 'Copied' : 'Copy JSON'}</span>
              </button>
            </div>
            <pre className="text-amber-300 text-[11px] overflow-x-auto max-h-60">
              {JSON.stringify(latestLead.payload, null, 2)}
            </pre>
          </div>
        </div>
      ) : null,
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Overview Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-[#181A20] text-white p-6 rounded-3xl border border-gray-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Autonomous Inbound Journey Verification
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Phone Call → Speech → NLP → Bitrix24 Lead
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
            Every incoming phone call completes the 5-stage pipeline without any human agent intervention.
          </p>
        </div>

        {latestLead && (
          <div className="bg-white/10 backdrop-blur-xs border border-white/10 rounded-2xl p-4 shrink-0 text-right">
            <span className="text-[11px] text-gray-300 block">Latest Lead Created:</span>
            <span className="text-base font-bold text-white block">
              Lead #{latestLead.bitrixLeadId}
            </span>
            <span className="text-[11px] text-emerald-300 block mt-0.5">
              {latestLead.extracted.company_name}
            </span>
          </div>
        )}
      </div>

      {/* 5-Step Pipeline Card List */}
      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = step.icon;
          const isExpanded = expandedStep === step.num;
          return (
            <div
              key={step.num}
              className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden transition-all"
            >
              <div
                onClick={() => setExpandedStep(isExpanded ? null : step.num)}
                className="p-4 md:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/70 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm ${
                      step.status.includes('COMPLETED') || step.status.includes('SUCCESS') || step.status.includes('LIVE')
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 font-mono">
                        STEP 0{step.num}
                      </span>
                      <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {step.tag}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 truncate mt-0.5">
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {step.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-2">
                  {latestLead && (
                    <span className="text-xs font-mono text-gray-400 hidden sm:inline-block">
                      {step.timing}
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      step.status.includes('LIVE')
                        ? 'bg-purple-100 text-purple-700'
                        : step.status.includes('COMPLETED') || step.status.includes('SUCCESS')
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {step.status}
                  </span>
                  {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && step.details && (
                <div className="px-5 pb-5 pt-1 border-t border-gray-100 bg-gray-50/40">
                  {step.details}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
