import React, { useState, useEffect } from 'react';
import { 
  X, 
  PhoneCall, 
  Code2, 
  Copy, 
  Check, 
  Radio, 
  Terminal, 
  ExternalLink,
  Phone,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap
} from 'lucide-react';

interface TelephonyDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulateCall?: (number: string) => void;
}

export const TelephonyDocsModal: React.FC<TelephonyDocsModalProps> = ({
  isOpen,
  onClose,
  onSimulateCall,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [liveCalls, setLiveCalls] = useState<any[]>([]);
  const [activeSessionsCount, setActiveSessionsCount] = useState<number>(0);
  const [testCallerPhone, setTestCallerPhone] = useState<string>('+1 (415) 892-1209');
  const [isSimulatingExternal, setIsSimulatingExternal] = useState<boolean>(false);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.app';
  const twilioWebhookUrl = `${currentOrigin}/api/telephony/incoming-call`;
  const dialogflowWebhookUrl = `${currentOrigin}/api/dialogflow/fulfillment`;

  // Poll live incoming telephony calls
  const fetchLiveCalls = async () => {
    try {
      const res = await fetch('/api/telephony/live-calls');
      const data = await res.json();
      if (data.recentCalls) {
        setLiveCalls(data.recentCalls);
        setActiveSessionsCount(data.activeSessions || 0);
      }
    } catch (e) {
      console.warn('Failed to fetch live calls:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLiveCalls();
      const interval = setInterval(fetchLiveCalls, 2500);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const twimlConfig = `<!-- Twilio Phone Number Webhook Configuration -->
<!-- Set Phone Number Inbound Voice Webhook URL: -->
<!-- ${twilioWebhookUrl} (HTTP POST) -->

<Response>
  <Say voice="Polly.Joanna" language="en-US">
    Hello! Thank you for calling Apex Cloud Solutions. Which service are you interested in today?
  </Say>
  <Gather input="speech" action="/api/telephony/gather-response?step=1" timeout="3" speechTimeout="auto">
  </Gather>
</Response>`;

  const copyCode = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSimulateExternalInbound = async () => {
    setIsSimulatingExternal(true);
    try {
      // Send mock Twilio inbound call
      const res = await fetch('/api/telephony/incoming-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          CallSid: `CA${Math.random().toString(36).substring(2, 15)}`,
          From: testCallerPhone,
        }),
      });
      fetchLiveCalls();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSimulatingExternal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div 
        className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <PhoneCall size={16} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Live Phone Test Gateway & Numbers</h3>
              <p className="text-[11px] text-gray-400">Live dial-in routes & carrier phone integration</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Hero: 3 Live Dial-In Channels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Channel 1: In-App WebRTC Direct Line */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Channel 1: Softphone</span>
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Direct WebRTC Line</h4>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                  Real microphone speech recognition & Text-to-Speech audio in your browser right now.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                }}
                className="mt-3 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                Open Softphone
              </button>
            </div>

            {/* Channel 2: Twilio Voice Inbound DID */}
            <div className="bg-orange-50/70 border border-orange-200/80 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-orange-800 font-bold mb-1">
                  <Radio size={12} className="text-[#FF5A1F]" />
                  <span>Channel 2: Twilio DID</span>
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Public Phone Number</h4>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                  Link any real cell/landline number via Twilio Voice webhook in 30 seconds.
                </p>
              </div>
              <button
                onClick={() => copyCode(twilioWebhookUrl, 1)}
                className="mt-3 w-full py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                {copiedIndex === 1 ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedIndex === 1 ? 'Copied Twilio Webhook' : 'Copy Twilio Webhook'}</span>
              </button>
            </div>

            {/* Channel 3: Google Dialogflow Phone Gateway */}
            <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-blue-800 font-bold mb-1">
                  <Sparkles size={12} className="text-blue-600" />
                  <span>Channel 3: Dialogflow</span>
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Free Google Number</h4>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                  Google provides a free telephone number in Dialogflow Phone Gateway.
                </p>
              </div>
              <button
                onClick={() => copyCode(dialogflowWebhookUrl, 2)}
                className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                {copiedIndex === 2 ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedIndex === 2 ? 'Copied Dialogflow Hook' : 'Copy Dialogflow Hook'}</span>
              </button>
            </div>
          </div>

          {/* Live Inbound Call Radar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h4 className="font-bold text-gray-900 text-xs">
                  Live Telephony Call Radar ({liveCalls.length} calls logged)
                </h4>
              </div>
              <button
                onClick={fetchLiveCalls}
                className="text-gray-400 hover:text-gray-700 p-1 rounded transition-colors cursor-pointer"
                title="Refresh radar"
              >
                <RefreshCw size={13} />
              </button>
            </div>

            {liveCalls.length === 0 ? (
              <div className="py-4 text-center text-gray-400 text-xs">
                No active carrier calls logged yet. Dial your Twilio number or simulate an inbound call below.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {liveCalls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200/80 text-xs font-mono"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Phone size={13} className="text-emerald-600 shrink-0" />
                      <span className="font-bold text-gray-900">{call.from}</span>
                      <span className="text-[11px] text-gray-400">({call.timestamp})</span>
                      {call.company && (
                        <span className="text-[11px] text-gray-600 truncate">
                          · {call.company}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {call.leadId && (
                        <span className="text-[10px] font-bold text-[#FF5A1F] bg-orange-50 px-2 py-0.5 rounded">
                          Lead #{call.leadId}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {call.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Test Inbound Trigger */}
            <div className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={testCallerPhone}
                onChange={(e) => setTestCallerPhone(e.target.value)}
                placeholder="+1 (415) 892-1209"
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-orange-400 font-mono w-48"
              />
              <button
                onClick={handleSimulateExternalInbound}
                disabled={isSimulatingExternal}
                className="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Zap size={13} className="text-amber-400" />
                <span>{isSimulatingExternal ? 'Sending...' : 'Test Inbound Call Ping'}</span>
              </button>
            </div>
          </div>

          {/* Webhook Endpoints Detail */}
          <div className="space-y-3">
            <div>
              <span className="font-bold text-gray-800 block mb-1">
                Twilio Voice Inbound URL:
              </span>
              <div className="flex items-center justify-between bg-gray-900 text-emerald-400 font-mono p-3 rounded-xl">
                <span className="truncate">{twilioWebhookUrl}</span>
                <button
                  onClick={() => copyCode(twilioWebhookUrl, 3)}
                  className="text-gray-300 hover:text-white p-1 ml-2 shrink-0 cursor-pointer"
                >
                  {copiedIndex === 3 ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div>
              <span className="font-bold text-gray-800 block mb-1">
                TwiML Voice Script Reference:
              </span>
              <pre className="bg-gray-900 text-amber-300 p-3.5 rounded-xl text-[11px] font-mono overflow-x-auto max-h-40">
                {twimlConfig}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            All calls automatically qualified and dispatched to Bitrix24 crm.lead.add
          </span>
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
