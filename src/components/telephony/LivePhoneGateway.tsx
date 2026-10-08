import React, { useState } from 'react';
import { 
  PhoneCall, 
  Radio, 
  Sparkles, 
  Copy, 
  Check, 
  Phone, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface LivePhoneGatewayProps {
  onOpenSoftphone: () => void;
  onOpenTwilioDocs?: () => void;
  onOpenDialogflow?: () => void;
  attachedNumber?: string;
  onAttachNumber?: (num: string) => void;
}

export const LivePhoneGateway: React.FC<LivePhoneGatewayProps> = ({
  onOpenSoftphone,
  onOpenTwilioDocs,
  onOpenDialogflow,
  attachedNumber = '+1 (415) 555-8821',
  onAttachNumber,
}) => {
  const [copiedChannel, setCopiedChannel] = useState<number | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.app';
  const twilioWebhookUrl = `${currentOrigin}/api/telephony/incoming-call`;
  const dialogflowWebhookUrl = `${currentOrigin}/api/dialogflow/fulfillment`;

  const copyToClipboard = (text: string, channelId: number) => {
    navigator.clipboard.writeText(text);
    setCopiedChannel(channelId);
    setTimeout(() => setCopiedChannel(null), 2200);
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-3xl border border-gray-200/90 shadow-md p-6 mb-6">
      {/* Header section with Public Line Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200/60 flex items-center justify-center text-[#FF5A1F] shadow-2xs">
            <PhoneCall size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                Live Phone Test Gateway & Numbers
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Public Trunk Line Active
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              3 Connected telephony channels to test the autonomous bot flow and instant Bitrix24 REST write.
            </p>
          </div>
        </div>

        {/* Public Carrier Line & Attached Caller Number Info */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200/80 text-xs">
          <div className="px-3 py-1 bg-white rounded-xl border border-gray-200/70 shadow-2xs">
            <span className="text-[10px] font-bold text-gray-400 block uppercase">Public Test Line</span>
            <span className="font-mono font-bold text-gray-900">+1 (800) 419-APEX</span>
          </div>
          <div className="px-3 py-1 bg-white rounded-xl border border-emerald-200 shadow-2xs">
            <span className="text-[10px] font-bold text-emerald-600 block uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Attached Caller
            </span>
            <span className="font-mono font-bold text-gray-900">{attachedNumber}</span>
          </div>
        </div>
      </div>

      {/* 3 Inbound Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
        {/* Channel 1: Softphone */}
        <div className="bg-gradient-to-b from-emerald-50/60 to-white border border-emerald-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Channel 1: Softphone
              </span>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Browser WebRTC
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Direct WebRTC Line</h3>
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
              Real microphone speech recognition & Text-to-Speech audio in your browser right now.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-emerald-100/80">
            <button
              onClick={onOpenSoftphone}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Phone size={14} />
              <span>Open Softphone</span>
            </button>
          </div>
        </div>

        {/* Channel 2: Twilio DID */}
        <div className="bg-gradient-to-b from-orange-50/60 to-white border border-orange-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
                <Radio size={13} className="text-[#FF5A1F]" />
                Channel 2: Twilio DID
              </span>
              <span className="text-[10px] font-bold bg-orange-100 text-[#FF5A1F] px-2 py-0.5 rounded-full">
                Public PSTN / Carrier
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Public Phone Number</h3>
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
              Link any real cell/landline number via Twilio Voice webhook in 30 seconds.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-orange-100/80 flex flex-col gap-2">
            <button
              onClick={() => copyToClipboard(twilioWebhookUrl, 2)}
              className="w-full py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copiedChannel === 2 ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copiedChannel === 2 ? 'Copied Twilio Webhook!' : 'Copy Twilio Webhook'}</span>
            </button>
            {onOpenTwilioDocs && (
              <button
                onClick={onOpenTwilioDocs}
                className="text-[11px] text-gray-500 hover:text-gray-800 text-center font-medium transition-colors cursor-pointer"
              >
                View TwiML Setup Guide & Carrier Radar →
              </button>
            )}
          </div>
        </div>

        {/* Channel 3: Dialogflow */}
        <div className="bg-gradient-to-b from-blue-50/60 to-white border border-blue-200/80 rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 flex items-center gap-1.5">
                <Sparkles size={13} className="text-blue-600" />
                Channel 3: Dialogflow
              </span>
              <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Google Phone Gateway
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Free Google Number</h3>
            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
              Google provides a free telephone number in Dialogflow Phone Gateway.
            </p>
          </div>

          <div className="mt-5 pt-3 border-t border-blue-100/80 flex flex-col gap-2">
            <button
              onClick={() => copyToClipboard(dialogflowWebhookUrl, 3)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copiedChannel === 3 ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
              <span>{copiedChannel === 3 ? 'Copied Dialogflow Hook!' : 'Copy Dialogflow Hook'}</span>
            </button>
            {onOpenDialogflow && (
              <button
                onClick={onOpenDialogflow}
                className="text-[11px] text-gray-500 hover:text-gray-800 text-center font-medium transition-colors cursor-pointer"
              >
                Open Dialogflow Live Console →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
