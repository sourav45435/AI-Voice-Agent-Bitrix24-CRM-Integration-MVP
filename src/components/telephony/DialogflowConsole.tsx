import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  CheckCircle2, 
  Copy, 
  Check, 
  Send, 
  Radio, 
  Sparkles, 
  ArrowRight, 
  Terminal, 
  RefreshCw, 
  ExternalLink,
  PhoneCall,
  Database,
  Building,
  Mail,
  User,
  HelpCircle
} from 'lucide-react';
import { BitrixLeadRecord } from '../../types/telephony';

interface DialogflowConsoleProps {
  onLeadCreated: (lead: BitrixLeadRecord) => void;
  webhookUrl: string;
}

export const DialogflowConsole: React.FC<DialogflowConsoleProps> = ({
  onLeadCreated,
  webhookUrl,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Form parameters for manual test
  const [service, setService] = useState('Cloud migration & AWS DevOps');
  const [company, setCompany] = useState('Horizon Logistics');
  const [callerName, setCallerName] = useState('Marcus Vance');
  const [phone, setPhone] = useState('+1 (415) 555-8821');
  const [email, setEmail] = useState('marcus@horizonlogistics.com');

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.app';
  const fulfillmentEndpoint = `${currentOrigin}/api/dialogflow/fulfillment`;

  // Fetch recent events
  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/dialogflow/events');
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
        if (!selectedEvent && data.events.length > 0) {
          setSelectedEvent(data.events[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch Dialogflow events:', e);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyFulfillmentUrl = () => {
    navigator.clipboard.writeText(fulfillmentEndpoint);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSimulateWebhook = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch('/api/dialogflow/simulate-test', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(webhookUrl ? { 'x-bitrix-webhook-url': webhookUrl } : {}),
        },
        body: JSON.stringify({
          desired_service: service,
          company_name: company,
          caller_name: callerName,
          phone,
          email,
          contact_channel: 'Email & Phone',
        }),
      });

      const data = await res.json();
      if (data.event) {
        setSelectedEvent(data.event);
        fetchEvents();

        // Also convert to LeadRecord and inform parent
        const newLead: BitrixLeadRecord = {
          id: `df-lead-${Date.now()}`,
          bitrixLeadId: data.bitrix_lead_id,
          createdAt: 'Just now (Dialogflow)',
          callerNumber: phone,
          extracted: data.event.extractedParams,
          payload: {
            fields: {
              TITLE: `Dialogflow: ${company} - ${service}`,
              NAME: callerName,
              COMPANY_TITLE: company,
              PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }],
              EMAIL: [{ VALUE: email, VALUE_TYPE: 'WORK' }],
              COMMENTS: `Dialogflow Telephony Lead\nService: ${service}\nCaller: ${callerName}`,
              SOURCE_ID: 'CALL',
              OPENED: 'Y',
              STATUS_ID: 'NEW',
            },
          },
          transcript: [
            { id: '1', speaker: 'bot', text: 'Hello! Thank you for calling. Which service are you interested in today?', timestamp: '00:01' },
            { id: '2', speaker: 'caller', text: service, timestamp: '00:05' },
            { id: '3', speaker: 'bot', text: 'What company are you calling from?', timestamp: '00:08' },
            { id: '4', speaker: 'caller', text: `This is ${callerName} from ${company}.`, timestamp: '00:12' },
            { id: '5', speaker: 'bot', text: 'What is the best phone number or email to reach you?', timestamp: '00:15' },
            { id: '6', speaker: 'caller', text: `Reach me at ${email} or ${phone}.`, timestamp: '00:19' },
          ],
          status: 'NEW',
          isLiveSynced: Boolean(webhookUrl),
          rawResponse: data.event.fulfillmentResponse,
        };

        onLeadCreated(newLead);
      }
    } catch (err) {
      console.error('Error simulating Dialogflow webhook:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const copyJson = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Connected Status Hero Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-[#181A20] text-white p-6 md:p-8 rounded-3xl border border-gray-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Google Cloud Dialogflow · Connected & Active
            </span>
          </div>
          <h2 className="text-xl md:text-3xl font-bold tracking-tight">
            Dialogflow Fulfillment → Bitrix24 Lead Router
          </h2>
          <p className="text-xs md:text-sm text-gray-400 mt-1.5 max-w-2xl leading-relaxed">
            Your bot's telephony agent connects directly through Google Cloud Dialogflow Phone Gateway. When a call completes, Dialogflow calls this webhook, which parses the parameters and writes the lead into Bitrix24.
          </p>
        </div>

        {/* Live Webhook Box */}
        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 w-full lg:w-auto shrink-0 space-y-2">
          <span className="text-[11px] font-semibold text-gray-300 block">
            Dialogflow Webhook URL (Fulfillment Target):
          </span>
          <div className="flex items-center gap-2 bg-gray-950 px-3 py-2 rounded-xl text-xs font-mono text-emerald-400 border border-gray-800">
            <span className="truncate max-w-xs">{fulfillmentEndpoint}</span>
            <button
              onClick={handleCopyFulfillmentUrl}
              className="text-gray-400 hover:text-white p-1 rounded transition-colors shrink-0 cursor-pointer"
              title="Copy Fulfillment URL"
            >
              {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
          <span className="text-[10px] text-gray-400 block">
            Compatible with Dialogflow ES, CX & Dialogflow Phone Gateway
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Dialogflow Webhook Simulator & Tester */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200/90 shadow-md p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-[#FF5A1F]" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Test Inbound Dialogflow Fulfillment
                </h3>
              </div>
              <span className="text-[10px] font-semibold bg-orange-100 text-[#FF5A1F] px-2 py-0.5 rounded">
                Intent: Inbound_Lead_Capture
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Simulate the JSON WebhookRequest payload sent by Dialogflow when a phone caller answers your 3 questions:
            </p>

            {/* Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Parameter: desired_service
                </label>
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Parameter: company_name
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Parameter: caller_name
                  </label>
                  <input
                    type="text"
                    value={callerName}
                    onChange={(e) => setCallerName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Parameter: phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Parameter: email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-gray-100">
            <button
              onClick={handleSimulateWebhook}
              disabled={isSimulating}
              className="w-full py-3 bg-[#FF5A1F] hover:bg-[#E54D14] disabled:bg-gray-200 text-white font-semibold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Executing Dialogflow Fulfillment & Bitrix24 Write...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Dispatch Dialogflow Webhook & Write to Bitrix24</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Webhook Telemetry & Event Inspector */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/90 shadow-md p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Radio size={18} className="text-emerald-600 animate-pulse" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Live Dialogflow Webhook Stream ({events.length} received)
                </h3>
              </div>
              <button
                onClick={fetchEvents}
                className="text-gray-400 hover:text-black p-1 rounded transition-colors"
                title="Refresh Events"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            {/* Event pill selector */}
            {events.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {events.slice(0, 5).map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                      selectedEvent?.id === ev.id
                        ? 'bg-black text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>Lead #{ev.bitrixLeadId}</span>
                    <span className="text-[10px] ml-1.5 opacity-70">{ev.timestamp}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-400 py-3">
                No events recorded yet. Click "Dispatch Dialogflow Webhook" on the left or send an actual webhook from your Dialogflow agent!
              </div>
            )}

            {/* Selected Event Details */}
            {selectedEvent && (
              <div className="space-y-3">
                {/* Highlights */}
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                      Bitrix24 Auto-Created Lead
                    </span>
                    <span className="text-sm font-bold text-emerald-950 mt-0.5 block">
                      Lead #{selectedEvent.bitrixLeadId}: {selectedEvent.extractedParams.company_name}
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Service: {selectedEvent.extractedParams.desired_service} · {selectedEvent.extractedParams.contact_channel}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 shadow-xs">
                    {selectedEvent.bitrixStatus}
                  </span>
                </div>

                {/* Returned Fulfillment Speech */}
                <div className="bg-orange-50/70 border border-orange-100 p-3 rounded-2xl text-xs">
                  <span className="text-[10px] font-bold uppercase text-[#FF5A1F] block mb-1">
                    Returned Dialogflow Speech (fulfillmentText)
                  </span>
                  <p className="text-gray-800 font-medium italic">
                    "{selectedEvent.fulfillmentResponse?.fulfillmentText}"
                  </p>
                </div>

                {/* Raw JSON viewer */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">Webhook Payload Telemetry</span>
                    <button
                      onClick={() => copyJson(selectedEvent)}
                      className="text-[#FF5A1F] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPayload ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedPayload ? 'Copied' : 'Copy Payload'}</span>
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-amber-300 p-3.5 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-48">
                    {JSON.stringify(
                      {
                        intent: selectedEvent.intentName,
                        extractedParameters: selectedEvent.extractedParams,
                        bitrixLeadId: selectedEvent.bitrixLeadId,
                        fulfillmentResponse: selectedEvent.fulfillmentResponse,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Quick link */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>Dialogflow Telephony Engine: Operational</span>
            <span className="font-mono text-[11px]">POST /api/dialogflow/fulfillment</span>
          </div>
        </div>
      </div>

      {/* Setup Guide Card */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 space-y-4">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <HelpCircle size={16} className="text-[#FF5A1F]" />
          How to Connect Dialogflow in 3 Simple Steps
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
            <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">1</span>
            <h4 className="font-bold text-gray-900">Enable Webhook in Dialogflow</h4>
            <p className="text-gray-500 leading-relaxed text-[11px]">
              In your Dialogflow Console, navigate to <strong>Fulfillment</strong>. Toggle <strong>Webhook</strong> to ENABLED, and paste:
              <br />
              <code className="bg-gray-200/80 px-1.5 py-0.5 rounded text-gray-900 font-mono text-[10px] break-all block mt-1">
                {fulfillmentEndpoint}
              </code>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
            <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">2</span>
            <h4 className="font-bold text-gray-900">Enable Phone Gateway</h4>
            <p className="text-gray-500 leading-relaxed text-[11px]">
              Go to <strong>Integrations &gt; Dialogflow Phone Gateway</strong>. Claim or assign a public phone number for your agent to answer calls automatically.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
            <span className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">3</span>
            <h4 className="font-bold text-gray-900">Enable Intent Fulfillment</h4>
            <p className="text-gray-500 leading-relaxed text-[11px]">
              Open your final lead collection intent (e.g. <code>Inbound_Lead_Capture</code>). Scroll down to <strong>Fulfillment</strong> and check <strong>"Enable webhook call for this intent"</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
