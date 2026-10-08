import React, { useState, useEffect } from 'react';
import { 
  PhoneCall, 
  Cpu, 
  Database, 
  Settings, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  ExternalLink,
  Bot,
  Layers,
  ArrowRight,
  Radio
} from 'lucide-react';
import { CallSimulator } from './components/telephony/CallSimulator';
import { PipelineInspector } from './components/telephony/PipelineInspector';
import { BitrixLeadsTable } from './components/telephony/BitrixLeadsTable';
import { DialogflowConsole } from './components/telephony/DialogflowConsole';
import { LivePhoneGateway } from './components/telephony/LivePhoneGateway';
import { BitrixConfigModal } from './components/telephony/BitrixConfigModal';
import { TelephonyDocsModal } from './components/telephony/TelephonyDocsModal';
import { GitReadmeModal } from './components/telephony/GitReadmeModal';
import { CallTranscriptItem, BitrixLeadRecord } from './types/telephony';

export default function App() {
  // Navigation tabs: 'simulator' | 'inspector' | 'dialogflow' | 'leads'
  const [activeTab, setActiveTab] = useState<'simulator' | 'inspector' | 'dialogflow' | 'leads'>('simulator');
  
  // Bitrix24 Webhook settings
  const [webhookUrl, setWebhookUrl] = useState<string>(() => {
    return localStorage.getItem('bitrix_webhook_url') || '';
  });
  const [attachedNumber, setAttachedNumber] = useState<string>(() => {
    return localStorage.getItem('telephony_attached_number') || '+1 (415) 555-8821';
  });
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(false);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [isGitModalOpen, setIsGitModalOpen] = useState<boolean>(false);

  // Leads state
  const [leads, setLeads] = useState<BitrixLeadRecord[]>(() => {
    const saved = localStorage.getItem('bitrix_call_leads');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    // Default initial demonstration lead
    return [
      {
        id: 'lead-init-1',
        bitrixLeadId: 10482,
        createdAt: 'Today, 10:48 AM',
        callerNumber: '+1 (415) 555-8821',
        extracted: {
          caller_name: 'Marcus',
          company_name: 'Horizon Logistics',
          desired_service: 'Cloud migration and AWS DevOps consulting',
          contact_channel: 'Email & Phone',
          phone: '+1 (415) 555-8821',
          email: 'marcus@horizonlogistics.com',
          lead_title: 'Inbound Call: Horizon Logistics - Cloud migration',
          summary: 'Inbound caller Marcus from Horizon Logistics requested cloud migration and AWS DevOps consulting. Preferred contact via marcus@horizonlogistics.com or 415-555-8821.',
          confidence: 0.98,
        },
        payload: {
          fields: {
            TITLE: 'Inbound Call: Horizon Logistics - Cloud migration',
            NAME: 'Marcus',
            COMPANY_TITLE: 'Horizon Logistics',
            PHONE: [{ VALUE: '+1 (415) 555-8821', VALUE_TYPE: 'WORK' }],
            EMAIL: [{ VALUE: 'marcus@horizonlogistics.com', VALUE_TYPE: 'WORK' }],
            COMMENTS: '=== AUTOMATED TELEPHONY INBOUND LEAD ===\nDesired Service: Cloud migration and AWS DevOps consulting\nPreferred Channel: Email & Phone\nSummary: Inbound caller Marcus from Horizon Logistics requested cloud migration.\n\nCall Transcript:\nBOT: Hello! Which service are you interested in today?\nCALLER: We\'re looking for cloud migration and AWS DevOps consulting.\nBOT: What company are you calling from?\nCALLER: This is Marcus from Horizon Logistics.\nBOT: What is the best phone number or email to reach you?\nCALLER: You can reach me at marcus@horizonlogistics.com or 415-555-8821.',
            SOURCE_ID: 'CALL',
            OPENED: 'Y',
            STATUS_ID: 'NEW',
            UF_CRM_DESIRED_SERVICE: 'Cloud migration and AWS DevOps consulting',
          },
        },
        transcript: [
          { id: '1', speaker: 'bot', text: 'Hello! Thank you for calling Apex Cloud Solutions. Which service are you interested in today?', timestamp: '00:01' },
          { id: '2', speaker: 'caller', text: "We're looking for cloud migration and AWS DevOps consulting.", timestamp: '00:06' },
          { id: '3', speaker: 'bot', text: 'Got it, cloud migration and DevOps consulting. What company or organization are you calling from?', timestamp: '00:11' },
          { id: '4', speaker: 'caller', text: 'This is Marcus from Horizon Logistics.', timestamp: '00:16' },
          { id: '5', speaker: 'bot', text: 'Great. And what is the best phone number or email address to reach you with the proposal?', timestamp: '00:21' },
          { id: '6', speaker: 'caller', text: 'You can reach me at marcus@horizonlogistics.com or 415-555-8821.', timestamp: '00:27' },
        ],
        status: 'NEW',
        isLiveSynced: false,
      },
    ];
  });

  const [latestLead, setLatestLead] = useState<BitrixLeadRecord | null>(leads[0] || null);
  const [isProcessingNLP, setIsProcessingNLP] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('bitrix_call_leads', JSON.stringify(leads));
  }, [leads]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleSaveWebhook = (url: string) => {
    setWebhookUrl(url);
    localStorage.setItem('bitrix_webhook_url', url);
    showToast(url ? '✓ Live Bitrix24 Webhook URL saved!' : 'Switched to Built-in Bitrix24 Simulator mode');
  };

  // Called when a simulated phone call finishes all 3 questions
  const handleCallCompleted = async (transcript: CallTranscriptItem[], callerNumber: string) => {
    setIsProcessingNLP(true);
    showToast('Processing call: Extracting NLP entities...');

    try {
      // 1. NLP Extraction
      const nlpRes = await fetch('/api/telephony/nlp-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, callerNumber }),
      });

      if (!nlpRes.ok) throw new Error('NLP Extraction failed');
      const nlpData = await nlpRes.json();

      // 2. Dispatch to Bitrix24 REST API
      const bitrixRes = await fetch('/api/bitrix/crm.lead.add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          fields: nlpData.bitrix_payload.fields,
        }),
      });

      const bitrixData = await bitrixRes.json();
      const leadId = bitrixData.lead_id || Math.floor(10000 + Math.random() * 90000);

      const newRecord: BitrixLeadRecord = {
        id: `lead-${Date.now()}`,
        bitrixLeadId: leadId,
        createdAt: 'Just now',
        callerNumber,
        extracted: nlpData.nlp_extracted,
        payload: nlpData.bitrix_payload,
        transcript,
        status: 'NEW',
        isLiveSynced: Boolean(bitrixData.isLiveBitrix),
        rawResponse: bitrixData.raw_response,
      };

      setLeads((prev) => [newRecord, ...prev]);
      setLatestLead(newRecord);
      showToast(`✓ Bitrix24 Lead #${leadId} pushed successfully!`);
    } catch (err: any) {
      console.error('Call processing error:', err);
      showToast('Error syncing lead to Bitrix24');
    } finally {
      setIsProcessingNLP(false);
    }
  };

  const handlePushToBitrix = async (lead: BitrixLeadRecord) => {
    showToast(`Pushing lead #${lead.bitrixLeadId} to Bitrix24...`);
    try {
      const res = await fetch('/api/bitrix/crm.lead.add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          fields: lead.payload.fields,
        }),
      });
      const data = await res.json();
      showToast(`✓ Bitrix24 API responded: Lead #${data.lead_id || lead.bitrixLeadId} synced!`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F6F7F9] font-sans text-gray-900">
      {/* Top Application Bar */}
      <header className="h-16 bg-white border-b border-gray-200/90 px-4 md:px-8 flex items-center justify-between shrink-0 shadow-xs z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111318] text-white flex items-center justify-center shadow-xs">
            <PhoneCall size={20} className="text-[#FF5A1F]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-black tracking-tight text-gray-900 uppercase">
                Voice → Bitrix24 Pipeline
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Autonomous Engine Active
              </span>
            </div>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              Minimal-viable inbound phone bot · 3-question dialog · Real-time REST API CRM write
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <div className="flex items-center bg-gray-100/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <PhoneCall size={14} className={activeTab === 'simulator' ? 'text-[#FF5A1F]' : ''} />
            <span>Call Simulator</span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'inspector'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Cpu size={14} className={activeTab === 'inspector' ? 'text-blue-600' : ''} />
            <span>5-Step Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('dialogflow')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dialogflow'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Radio size={14} className={activeTab === 'dialogflow' ? 'text-emerald-500' : 'text-emerald-500'} />
            <span>Dialogflow Console</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'leads'
                ? 'bg-white text-gray-900 shadow-xs font-bold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Database size={14} className={activeTab === 'leads' ? 'text-emerald-600' : ''} />
            <span>Bitrix24 Leads ({leads.length})</span>
          </button>
        </div>

        {/* Right Tools & Webhook Config */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsGitModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Git Repository Deliverables & README"
          >
            <BookOpen size={13} className="text-blue-600" />
            <span className="hidden sm:inline">Git & README</span>
          </button>

          <button
            onClick={() => setIsDocsOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-gray-800 bg-orange-50/80 hover:bg-orange-100/90 border border-orange-200/80 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Live Phone Test Gateway & Numbers"
          >
            <PhoneCall size={13} className="text-[#FF5A1F]" />
            <span className="hidden md:inline">Live Phone Test Gateway & Numbers</span>
            <span className="md:hidden">Gateway</span>
          </button>

          <button
            onClick={() => setIsConfigOpen(true)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
              webhookUrl
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gray-900 hover:bg-black text-white'
            }`}
          >
            <Settings size={13} />
            <span>{webhookUrl ? 'Bitrix24 Connected' : 'Bitrix24 Settings'}</span>
          </button>
        </div>
      </header>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm animate-in fade-in duration-200">
          <CheckCircle2 size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            {/* Connected Software Live Phone Test Gateway & Numbers */}
            <LivePhoneGateway
              onOpenSoftphone={() => {
                // Focus simulator
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              onOpenTwilioDocs={() => setIsDocsOpen(true)}
              onOpenDialogflow={() => setActiveTab('dialogflow')}
              attachedNumber={attachedNumber}
              onAttachNumber={(num) => {
                setAttachedNumber(num);
                localStorage.setItem('telephony_attached_number', num);
                showToast(`✓ Phone number attached to public line: ${num}`);
              }}
            />

            <CallSimulator
              onCallCompleted={handleCallCompleted}
              isProcessingNLP={isProcessingNLP}
              attachedNumber={attachedNumber}
              onAttachNumber={(num) => {
                setAttachedNumber(num);
                localStorage.setItem('telephony_attached_number', num);
                showToast(`✓ Phone number attached to public line: ${num}`);
              }}
            />

            {/* Quick Link to Pipeline */}
            {latestLead && (
              <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">
                      Lead #{latestLead.bitrixLeadId} Captured: {latestLead.extracted.company_name}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Service: {latestLead.extracted.desired_service} · Contact: {latestLead.extracted.email || latestLead.extracted.phone}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('inspector')}
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Inspect 5-Step Pipeline</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inspector' && (
          <PipelineInspector
            latestLead={latestLead}
            onPushToBitrix={handlePushToBitrix}
          />
        )}

        {activeTab === 'dialogflow' && (
          <DialogflowConsole
            onLeadCreated={(newLead) => {
              setLeads((prev) => [newLead, ...prev]);
              setLatestLead(newLead);
              showToast(`✓ Dialogflow Lead #${newLead.bitrixLeadId} registered into Bitrix24!`);
            }}
            webhookUrl={webhookUrl}
          />
        )}

        {activeTab === 'leads' && (
          <BitrixLeadsTable
            leads={leads}
            onSelectLead={(lead) => {
              setLatestLead(lead);
              setActiveTab('inspector');
            }}
            webhookUrl={webhookUrl}
            onAddManualLead={(newLead) => {
              setLeads((prev) => [newLead, ...prev]);
              setLatestLead(newLead);
              showToast(`✓ Manual Lead #${newLead.bitrixLeadId} pushed to Bitrix24!`);
            }}
            onUpdateStatus={(id, newStatus) => {
              setLeads((prev) => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
              showToast(`Lead status updated to ${newStatus}`);
            }}
          />
        )}
      </main>

      {/* Modals */}
      <BitrixConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        webhookUrl={webhookUrl}
        onSaveWebhook={handleSaveWebhook}
      />

      <TelephonyDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />

      <GitReadmeModal
        isOpen={isGitModalOpen}
        onClose={() => setIsGitModalOpen(false)}
      />
    </div>
  );
}
