export interface CallTranscriptItem {
  id: string;
  speaker: 'bot' | 'caller';
  text: string;
  timestamp: string;
  audioDurationSec?: number;
}

export interface ExtractedLeadData {
  caller_name: string;
  company_name: string;
  desired_service: string;
  contact_channel: string;
  phone: string;
  email: string;
  lead_title: string;
  summary: string;
  confidence: number;
}

export interface BitrixPayload {
  fields: {
    TITLE: string;
    NAME: string;
    COMPANY_TITLE: string;
    PHONE: { VALUE: string; VALUE_TYPE: string }[];
    EMAIL?: { VALUE: string; VALUE_TYPE: string }[];
    COMMENTS: string;
    SOURCE_ID: string;
    OPENED: string;
    STATUS_ID: string;
    UF_CRM_DESIRED_SERVICE?: string;
    [key: string]: any;
  };
}

export interface BitrixLeadRecord {
  id: string;
  bitrixLeadId: number | string;
  createdAt: string;
  callerNumber: string;
  extracted: ExtractedLeadData;
  payload: BitrixPayload;
  transcript: CallTranscriptItem[];
  status: 'NEW' | 'IN_PROCESS' | 'QUALIFIED';
  isLiveSynced: boolean;
  rawResponse?: any;
}
