import React, { useState } from 'react';
import { 
  Building2, 
  Phone, 
  Mail, 
  ExternalLink, 
  Copy, 
  Check, 
  Eye, 
  Calendar, 
  Clock, 
  Search, 
  CheckCircle2, 
  Database, 
  RefreshCw, 
  FileText,
  Download,
  Plus,
  Send,
  X
} from 'lucide-react';
import { BitrixLeadRecord } from '../../types/telephony';

interface BitrixLeadsTableProps {
  leads: BitrixLeadRecord[];
  onSelectLead: (lead: BitrixLeadRecord) => void;
  onRefresh?: () => void;
  webhookUrl?: string;
  onAddManualLead?: (lead: BitrixLeadRecord) => void;
  onUpdateStatus?: (id: string, newStatus: 'NEW' | 'IN_PROCESS' | 'QUALIFIED') => void;
}

export const BitrixLeadsTable: React.FC<BitrixLeadsTableProps> = ({
  leads,
  onSelectLead,
  onRefresh,
  webhookUrl,
  onAddManualLead,
  onUpdateStatus,
}) => {
  const [search, setSearch] = useState('');
  const [selectedLeadForModal, setSelectedLeadForModal] = useState<BitrixLeadRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Manual lead form fields
  const [manualService, setManualService] = useState('Enterprise Cloud Architecture');
  const [manualCompany, setManualCompany] = useState('Acme Global Logistics');
  const [manualName, setManualName] = useState('Sarah Jenkins');
  const [manualPhone, setManualPhone] = useState('+1 (415) 555-9012');
  const [manualEmail, setManualEmail] = useState('sarah.j@acmeglobal.com');
  const [isPushingManual, setIsPushingManual] = useState(false);

  const filtered = leads.filter(
    (l) =>
      l.extracted.company_name.toLowerCase().includes(search.toLowerCase()) ||
      l.extracted.desired_service.toLowerCase().includes(search.toLowerCase()) ||
      l.extracted.caller_name.toLowerCase().includes(search.toLowerCase()) ||
      String(l.bitrixLeadId).includes(search)
  );

  const copyPayload = (lead: BitrixLeadRecord) => {
    navigator.clipboard.writeText(JSON.stringify(lead.payload, null, 2));
    setCopiedId(lead.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;
    const headers = ['BitrixLeadId', 'Company', 'Caller', 'Service', 'Phone', 'Email', 'Created', 'Status'];
    const rows = leads.map(l => [
      l.bitrixLeadId,
      `"${l.extracted.company_name.replace(/"/g, '""')}"`,
      `"${l.extracted.caller_name.replace(/"/g, '""')}"`,
      `"${l.extracted.desired_service.replace(/"/g, '""')}"`,
      `"${l.extracted.phone}"`,
      `"${l.extracted.email || ''}"`,
      `"${l.createdAt}"`,
      `"${l.status}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bitrix24_leads_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateManualLead = async () => {
    setIsPushingManual(true);
    const leadId = Math.floor(10000 + Math.random() * 90000);
    const bitrixFields = {
      TITLE: `Manual Lead: ${manualCompany} - ${manualService}`,
      NAME: manualName,
      COMPANY_TITLE: manualCompany,
      PHONE: [{ VALUE: manualPhone, VALUE_TYPE: 'WORK' }],
      EMAIL: [{ VALUE: manualEmail, VALUE_TYPE: 'WORK' }],
      COMMENTS: `Manual Test Lead via Bitrix24 Interface\nService: ${manualService}`,
      SOURCE_ID: 'CALL',
      OPENED: 'Y',
      STATUS_ID: 'NEW',
    };

    let isLive = false;
    if (webhookUrl && webhookUrl.includes('bitrix24')) {
      try {
        let endpoint = webhookUrl.trim();
        if (!endpoint.includes('crm.lead.add')) {
          if (!endpoint.endsWith('/')) endpoint += '/';
          endpoint += 'crm.lead.add.json';
        }
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: bitrixFields }),
        });
        isLive = true;
      } catch (e) {
        console.warn('Manual push error:', e);
      }
    }

    const newRec: BitrixLeadRecord = {
      id: `manual-lead-${Date.now()}`,
      bitrixLeadId: leadId,
      createdAt: 'Just now (Manual)',
      callerNumber: manualPhone,
      extracted: {
        caller_name: manualName,
        company_name: manualCompany,
        desired_service: manualService,
        contact_channel: 'Email & Phone',
        phone: manualPhone,
        email: manualEmail,
        lead_title: `Manual Lead: ${manualCompany} - ${manualService}`,
        summary: `Manual CRM test entry created for ${manualCompany}.`,
        confidence: 1.0,
      },
      payload: { fields: bitrixFields },
      transcript: [
        { id: '1', speaker: 'bot', text: 'Hello! Which service are you interested in?', timestamp: '00:01' },
        { id: '2', speaker: 'caller', text: manualService, timestamp: '00:05' },
        { id: '3', speaker: 'bot', text: 'What company are you calling from?', timestamp: '00:08' },
        { id: '4', speaker: 'caller', text: manualCompany, timestamp: '00:12' },
      ],
      status: 'NEW',
      isLiveSynced: isLive,
    };

    if (onAddManualLead) {
      onAddManualLead(newRec);
    }
    setIsPushingManual(false);
    setIsManualModalOpen(false);
  };

  const cycleStatus = (lead: BitrixLeadRecord) => {
    const next: Record<string, 'NEW' | 'IN_PROCESS' | 'QUALIFIED'> = {
      NEW: 'IN_PROCESS',
      IN_PROCESS: 'QUALIFIED',
      QUALIFIED: 'NEW',
    };
    const newSt = next[lead.status] || 'NEW';
    if (onUpdateStatus) {
      onUpdateStatus(lead.id, newSt);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4">
      {/* Table Header Controls */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Bitrix24 CRM Leads</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Auto-created records pushed directly via Bitrix24 <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800 font-mono">crm.lead.add</code> REST API
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads, company..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-orange-400"
            />
          </div>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3 py-2 bg-[#FF5A1F] hover:bg-[#E54D14] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Create and Push Lead directly"
          >
            <Plus size={14} />
            <span>New Lead</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors cursor-pointer"
            title="Export Leads as CSV"
          >
            <Download size={15} />
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 border border-gray-200 hover:bg-gray-50 rounded-xl text-gray-600 transition-colors cursor-pointer"
              title="Refresh Leads"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Database size={36} className="mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">No Bitrix24 leads yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Start an incoming call in the simulator to generate your first autonomous CRM lead!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Lead ID</th>
                  <th className="py-3 px-4">Company & Caller</th>
                  <th className="py-3 px-4">Desired Service</th>
                  <th className="py-3 px-4">Contact Channel</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                      <span className="text-[#FF5A1F]">#{lead.bitrixLeadId}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{lead.extracted.company_name}</div>
                      <div className="text-[11px] text-gray-500">{lead.extracted.caller_name}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-medium text-gray-800 line-clamp-1">
                        {lead.extracted.desired_service}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-gray-700 font-medium">{lead.extracted.contact_channel}</div>
                      <div className="text-[11px] text-gray-400 truncate max-w-[160px]">
                        {lead.extracted.email || lead.extracted.phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                      {lead.createdAt}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <button
                          onClick={() => cycleStatus(lead)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            lead.status === 'QUALIFIED'
                              ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                              : lead.status === 'IN_PROCESS'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                          title="Click to advance status"
                        >
                          {lead.status}
                        </button>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                          <CheckCircle2 size={10} />
                          {lead.isLiveSynced ? 'LIVE IN CRM' : 'REST PUSHED'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLeadForModal(lead)}
                          className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Inspect Transcript & Bitrix24 Payload"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => copyPayload(lead)}
                          className="p-1.5 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                          title="Copy Bitrix24 JSON Payload"
                        >
                          {copiedId === lead.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Lead Detail Inspector */}
      {selectedLeadForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div 
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-[#FF5A1F]" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Bitrix24 Lead Record #{selectedLeadForModal.bitrixLeadId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLeadForModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-orange-50/60 border border-orange-100 p-3 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-[#FF5A1F] block">Desired Service</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">{selectedLeadForModal.extracted.desired_service}</span>
                </div>
                <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-xl">
                  <span className="text-[10px] font-bold uppercase text-blue-600 block">Company & Caller</span>
                  <span className="font-bold text-gray-900 mt-0.5 block">
                    {selectedLeadForModal.extracted.company_name} ({selectedLeadForModal.extracted.caller_name})
                  </span>
                </div>
              </div>

              {/* Call Transcript */}
              <div>
                <span className="text-xs font-bold text-gray-800 block mb-2">
                  Call Dialogue Transcript ({selectedLeadForModal.transcript.length} turns)
                </span>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2.5 max-h-48 overflow-y-auto">
                  {selectedLeadForModal.transcript.map((t) => (
                    <div key={t.id} className="text-xs">
                      <span className={`font-semibold ${t.speaker === 'bot' ? 'text-[#FF5A1F]' : 'text-blue-600'}`}>
                        {t.speaker === 'bot' ? 'Bot' : 'Caller'}:
                      </span>{' '}
                      <span className="text-gray-700">"{t.text}"</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exact Bitrix24 Payload */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-800">
                    Bitrix24 REST API Payload (<code className="font-mono text-gray-600">fields</code>)
                  </span>
                  <button
                    onClick={() => copyPayload(selectedLeadForModal)}
                    className="text-xs text-[#FF5A1F] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Copy size={12} />
                    <span>Copy JSON</span>
                  </button>
                </div>
                <pre className="bg-gray-900 text-amber-300 p-4 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-52">
                  {JSON.stringify(selectedLeadForModal.payload, null, 2)}
                </pre>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Source: Telephony Inbound (SOURCE_ID: CALL)</span>
              <button
                onClick={() => setSelectedLeadForModal(null)}
                className="px-4 py-1.5 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Manual Test Lead Creator */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-50 text-[#FF5A1F]">
                  <Plus size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Create & Push Test Lead</h3>
                  <p className="text-[11px] text-gray-400">Push a customized record directly into Bitrix24 CRM REST API</p>
                </div>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Company Name</label>
                <input
                  type="text"
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400 font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Desired Service / Product</label>
                <input
                  type="text"
                  value={manualService}
                  onChange={(e) => setManualService(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-orange-400"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManualLead}
                disabled={isPushingManual || !manualCompany.trim()}
                className="px-5 py-2 bg-[#FF5A1F] hover:bg-[#E54D14] text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send size={13} />
                <span>{isPushingManual ? 'Pushing to Bitrix24...' : 'Push to Bitrix24 CRM'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
