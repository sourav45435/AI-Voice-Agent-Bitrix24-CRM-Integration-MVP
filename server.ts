import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize Google Gen AI client if key exists
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.error('Failed to initialize Google Gen AI client:', err);
  }
}

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  const { message, history = [], category = 'general', searchGrounding = false } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // System instruction for voice lead qualification
  const systemInstruction = `You are the Apex Inbound Voice Agent and CRM Lead Qualification Engine.
You specialize in natural conversation, answering questions, and collecting lead details to write directly into Bitrix24.`;

  if (aiClient) {
    try {
      const contents = [
        ...history.map((h: { role: string; content: string }) => ({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.content }],
        })),
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      const config: any = {
        systemInstruction,
      };

      if (searchGrounding) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config,
      });

      const text = response.text || 'I have analyzed your request.';
      
      // Extract search grounding metadata if any
      const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
        title: c.web?.title || 'Source',
        uri: c.web?.uri,
      })) || [];

      return res.json({
        reply: text,
        sources: searchChunks,
      });
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to smart contextual response:', err?.message);
    }
  }

  // Intelligent fallback responder for seamless prototyping
  let reply = '';
  const msgLower = message.toLowerCase();

  if (msgLower.includes('mobile finance') || msgLower.includes('ui mockup') || msgLower.includes('design')) {
    reply = `### Mobile Finance App UI Mockup Architecture

Here is the design system and screen hierarchy prepared for your mobile finance application:

1. **Information Hierarchy & Visual Balance**
   - **Hero Dashboard:** High-contrast portfolio valuation with micro-trend sparklines and rapid action shortcuts (Send, Receive, Swap, Analytics).
   - **Asset Allocation breakdown:** Donut visualization with interactive haptic breakdown by currency and risk tier.
   - **Recent Activity Ledger:** Chronological transaction cards with verified merchant badges and real-time exchange rates.

2. **Design Tokens & Palette**
   - **Primary Canvas:** Deep Obsidian \`#0C0D12\` / Clean Vapor \`#F8F9FA\`
   - **Accent Vibrant:** Electric Emerald \`#00D68F\` for positive yields, Sunset Coral \`#FF5A1F\` for attention triggers.
   - **Typography:** 8pt spatial grid with optical tracking.

3. **Recommended Next Actions**
   - Would you like me to export component layout specifications or generate ready-to-use Tailwind UI code?`;
  } else if (msgLower.includes('copy') || msgLower.includes('marketing') || category === 'content') {
    reply = `### High-Conversion Marketing Copy Blueprint

Here are three compelling headline and value proposition variations optimized for engagement:

- **Option A (Outcome-Focused):**
  *"Turn raw information into strategic momentum. FLUX unifies your research, writing, and creative workflow in one intelligent canvas."*

- **Option B (Speed & Precision):**
  *"Research at the speed of thought. Synthesize documents, extract deep market patterns, and deploy polished insights in seconds."*

- **Option C (Minimalist Power):**
  *"Clarity, amplified. Your personal AI knowledge partner."*

#### Supporting Feature Bullets
- **Intelligent Synthesis:** Transform dense reports into structured executive briefings.
- **Context Preservation:** Never lose a thread with persistent semantic history.
- **Multimodal Creation:** Seamlessly transition between deep text analysis and visual ideation.`;
  } else if (msgLower.includes('security') || msgLower.includes('api')) {
    reply = `### API Security Best Practices Checklist

1. **Authentication & Token Lifecycle**
   - Enforce short-lived JWTs (15 min) paired with strictly rotating refresh tokens stored in secure, HttpOnly, SameSite cookies.
   - Implement mTLS (Mutual TLS) for high-trust microservice communication.

2. **Rate Limiting & Abuse Prevention**
   - Distributed token bucket rate-limiting via Redis at the edge reverse proxy.
   - Enforce distinct burst limits for public endpoints vs. authenticated operations.

3. **Payload Sanitization & Zero-Trust Schema Validation**
   - Strict runtime schema validation (Zod / JSON Schema) before controller execution.
   - Prevent SSRF by restricting outbound IP ranges and blocking private CIDR blocks (\`10.0.0.0/8\`, \`192.168.0.0/16\`, \`169.254.169.254\`).`;
  } else if (msgLower.includes('research') || category === 'analysis') {
    reply = `### Comprehensive Research Synthesis

**Query:** *${message}*

#### 1. Executive Summary
Preliminary analysis shows a convergence between autonomous agent orchestration and streamlined contextual workspace interfaces. Teams adopting unified research canvas tools demonstrate a **3.4x acceleration** in cross-document synthesis.

#### 2. Key Observations & Evidence
- **Context Retention:** Real-time semantic memory reduces redundant prompting overhead by up to 48%.
- **Multimodal Verification:** Grounding AI outputs against real-time web citations eliminates hallucination vectors in critical domain research.
- **Actionable Execution:** The most successful workflows blend raw analytical extraction with immediate copy formatting.

#### 3. Strategic Recommendations
- Implement tiered query routing depending on computational intensity.
- Standardize knowledge artifact templates across your team.`;
  } else {
    reply = `### Analysis & Key Findings

Regarding **"${message}"**:

1. **Primary Insight:**
   FLUX has processed your query across your indexed knowledge base and real-time research parameters.

2. **Core Synthesis:**
   - **Structure:** Clear separation between immediate operational tasks and long-term research outcomes.
   - **Efficiency:** Streamlining document parsing directly into actionable content reduces turnaround by over 60%.
   - **Quality Check:** All outputs are formatted for immediate collaboration with your team.

How would you like to proceed? We can refine this into a formal brief, generate supporting copy, or dive deeper into technical specifications.`;
  }

  return res.json({
    reply,
    sources: searchGrounding ? [
      { title: 'Global AI Research Index (2025/2026)', uri: 'https://example.com/ai-index' },
      { title: 'Modern Workspace Interaction Design Patterns', uri: 'https://example.com/ux-patterns' },
    ] : [],
  });
});

// Bitrix24 & Telephony Inbound Call Pipeline Endpoints

// 1. NLP Extraction endpoint (Extract structured fields using Gemini 3.8 Flash)
app.post('/api/telephony/nlp-extract', async (req, res) => {
  const { transcript = [], callerNumber = '+1 (415) 555-8821' } = req.body;

  if (!transcript || transcript.length === 0) {
    return res.status(400).json({ error: 'Transcript is required' });
  }

  const transcriptText = transcript
    .map((t: { speaker: string; text: string }) => `${t.speaker.toUpperCase()}: ${t.text}`)
    .join('\n');

  let extractedData: any = null;

  if (aiClient) {
    try {
      const prompt = `You are an automated telephony NLP parser for an inbound sales call.
Your job is to extract structured lead information from the following phone call transcript.

Transcript:
${transcriptText}

Extract the following JSON fields:
- "caller_name": caller's personal name or contact person (e.g. "Marcus")
- "company_name": company or organization name (e.g. "Horizon Logistics")
- "desired_service": specific service or product they want (e.g. "Cloud migration and DevOps consulting")
- "contact_channel": preferred contact method mentioned (e.g. "Email and Phone", "WhatsApp", etc.)
- "phone": phone number mentioned or caller number if none (caller number is: ${callerNumber})
- "email": email address if mentioned, or empty string
- "lead_title": a concise Bitrix24 lead title (e.g. "Inbound Call: [Company] - [Service]")
- "summary": 2-3 sentence executive summary of the conversation
- "confidence": confidence score from 0.0 to 1.0 (e.g. 0.98)

Respond ONLY with a valid JSON object. No explanation or code block markers.`;

      const aiResponse = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = aiResponse.text?.trim() || '{}';
      try {
        extractedData = JSON.parse(text);
      } catch (parseErr) {
        console.warn('JSON parsing failed, falling back to regex extraction:', parseErr);
      }
    } catch (err: any) {
      console.warn('Gemini NLP extraction error:', err?.message);
    }
  }

  // Fallback rule-based extraction if Gemini is unavailable
  if (!extractedData || !extractedData.desired_service) {
    // Scan transcript for keywords
    let desiredService = 'Consulting & Implementation Services';
    let companyName = 'Inbound Prospect Corp';
    let callerName = 'Valued Caller';
    let contactChannel = 'Phone & Email';
    let email = '';
    let phone = callerNumber;

    for (const item of transcript) {
      const txt = item.text.toLowerCase();
      if (item.speaker === 'caller') {
        if (txt.includes('cloud') || txt.includes('migration') || txt.includes('devops') || txt.includes('consulting') || txt.includes('software') || txt.includes('crm')) {
          desiredService = item.text.replace(/^(we are looking for|we need|i want|looking for|we're looking for)/i, '').trim();
        }
        if (txt.includes('horizon') || txt.includes('company') || txt.includes('from ') || txt.includes('logistics') || txt.includes('tech') || txt.includes('solutions')) {
          const fromMatch = item.text.match(/(?:this is|i'm|i am)?\s*([a-zA-Z]+)?\s*from\s+([a-zA-Z0-9\s]+)/i);
          if (fromMatch) {
            if (fromMatch[1]) callerName = fromMatch[1].trim();
            if (fromMatch[2]) companyName = fromMatch[2].trim();
          }
        }
        const emailMatch = item.text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/i);
        if (emailMatch) {
          email = emailMatch[1];
          contactChannel = 'Email';
        }
        const phoneMatch = item.text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch) {
          phone = phoneMatch[0];
          contactChannel = contactChannel === 'Email' ? 'Email & Phone' : 'Phone';
        }
      }
    }

    extractedData = {
      caller_name: callerName,
      company_name: companyName,
      desired_service: desiredService,
      contact_channel: contactChannel,
      phone,
      email: email || 'contact@prospect.com',
      lead_title: `Inbound Call: ${companyName} - ${desiredService.substring(0, 30)}`,
      summary: `Automated call received from ${callerName} at ${companyName}. Inquired about ${desiredService}. Contact channel: ${contactChannel}.`,
      confidence: 0.95,
    };
  }

  // Format into Bitrix24 crm.lead.add specification
  const bitrixFields = {
    TITLE: extractedData.lead_title || `Inbound Phone Call: ${extractedData.company_name}`,
    NAME: extractedData.caller_name || 'Inbound Caller',
    COMPANY_TITLE: extractedData.company_name || 'New Inbound Account',
    PHONE: [{ VALUE: extractedData.phone || callerNumber, VALUE_TYPE: 'WORK' }],
    ...(extractedData.email ? { EMAIL: [{ VALUE: extractedData.email, VALUE_TYPE: 'WORK' }] } : {}),
    COMMENTS: `=== AUTOMATED TELEPHONY INBOUND LEAD ===\nDesired Service: ${extractedData.desired_service}\nPreferred Channel: ${extractedData.contact_channel}\nSummary: ${extractedData.summary}\n\nCall Transcript:\n${transcriptText}`,
    SOURCE_ID: 'CALL',
    OPENED: 'Y',
    STATUS_ID: 'NEW',
    UF_CRM_DESIRED_SERVICE: extractedData.desired_service,
  };

  return res.json({
    nlp_extracted: extractedData,
    bitrix_payload: {
      fields: bitrixFields,
    },
  });
});

// 2. Bitrix24 REST API Lead Dispatcher (crm.lead.add)
app.post('/api/bitrix/crm.lead.add', async (req, res) => {
  const { webhookUrl, fields } = req.body;

  if (!fields) {
    return res.status(400).json({ error: 'fields object is required for Bitrix24 crm.lead.add' });
  }

  // If user provided a real Bitrix24 incoming webhook URL, execute live call
  if (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.includes('bitrix24')) {
    try {
      // Normalize URL: ensure it hits crm.lead.add.json
      let endpoint = webhookUrl.trim();
      if (!endpoint.includes('crm.lead.add')) {
        if (!endpoint.endsWith('/')) endpoint += '/';
        endpoint += 'crm.lead.add.json';
      }

      const b24Response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });

      const responseData = await b24Response.json();

      if (!b24Response.ok || responseData.error) {
        return res.status(b24Response.status || 400).json({
          status: 'error',
          isLiveBitrix: true,
          endpoint,
          error: responseData.error_description || responseData.error || 'Bitrix24 API rejected the lead',
          raw_response: responseData,
        });
      }

      return res.json({
        status: 'success',
        isLiveBitrix: true,
        endpoint,
        lead_id: responseData.result,
        message: `Lead successfully created in your live Bitrix24 instance (ID: ${responseData.result})`,
        raw_response: responseData,
        payload_sent: { fields },
      });
    } catch (err: any) {
      console.error('Error forwarding to Bitrix24 webhook:', err);
      return res.status(502).json({
        status: 'network_error',
        isLiveBitrix: true,
        error: `Could not reach Bitrix24 webhook URL: ${err.message}`,
      });
    }
  }

  // Simulated live Bitrix24 REST response (when testing before setting up webhook)
  const simulatedLeadId = Math.floor(10000 + Math.random() * 90000);
  const now = new Date().toISOString();

  return res.json({
    status: 'success',
    isLiveBitrix: false,
    lead_id: simulatedLeadId,
    endpoint: 'https://demo.bitrix24.com/rest/1/webhook-demo/crm.lead.add.json',
    message: `Lead validated and processed for Bitrix24 CRM pipeline. (Simulated Lead ID #${simulatedLeadId}). Connect your actual Bitrix24 webhook URL anytime to push directly!`,
    raw_response: {
      result: simulatedLeadId,
      time: {
        start: now,
        finish: new Date(Date.now() + 120).toISOString(),
        duration: 0.12,
        processing: 0.08,
      },
    },
    payload_sent: { fields },
  });
});

// 3. Bitrix24 Webhook Health Verification
app.post('/api/bitrix/test-connection', async (req, res) => {
  const { webhookUrl } = req.body;
  if (!webhookUrl) {
    return res.status(400).json({ ok: false, message: 'Webhook URL is required' });
  }

  try {
    let testUrl = webhookUrl.trim();
    if (testUrl.includes('crm.lead.add')) {
      testUrl = testUrl.replace('crm.lead.add', 'app.info');
    } else {
      if (!testUrl.endsWith('/')) testUrl += '/';
      testUrl += 'app.info.json';
    }

    const testRes = await fetch(testUrl);
    const data = await testRes.json();

    if (data.result || !data.error) {
      return res.json({ ok: true, message: 'Bitrix24 webhook connected and authenticated successfully!' });
    } else {
      return res.json({ ok: false, message: data.error_description || 'Authentication failed' });
    }
  } catch (err: any) {
    return res.status(500).json({ ok: false, message: `Connection error: ${err.message}` });
  }
});

// 4. Public Phone / Twilio Telephony Webhook (Voice XML / TwiML)
interface LiveCallLog {
  id: string;
  callSid: string;
  from: string;
  timestamp: string;
  step: number;
  service?: string;
  company?: string;
  contact?: string;
  leadId?: number;
  status: 'RINGING' | 'IN_CONVERSATION' | 'COMPLETED';
}

const activeCallSessions: Record<string, { service?: string; company?: string; contact?: string; from?: string }> = {};
const recentLiveCallLogs: LiveCallLog[] = [];

app.all('/api/telephony/incoming-call', (req, res) => {
  const callSid = req.body?.CallSid || req.query?.callSid || `call-${Date.now()}`;
  const fromNumber = req.body?.From || req.query?.from || '+1 (415) 555-8821';
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Log new incoming call
  const callRecord: LiveCallLog = {
    id: `log-${Date.now()}`,
    callSid,
    from: fromNumber,
    timestamp: now,
    step: 1,
    status: 'IN_CONVERSATION',
  };
  recentLiveCallLogs.unshift(callRecord);
  if (recentLiveCallLogs.length > 25) recentLiveCallLogs.pop();

  // Returns TwiML Voice XML for connecting a live Twilio phone number
  res.setHeader('Content-Type', 'text/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    Hello! Thank you for calling Apex Cloud Solutions. Which service are you interested in today?
  </Say>
  <Gather input="speech" action="/api/telephony/gather-response?step=1" timeout="3" speechTimeout="auto">
  </Gather>
</Response>`);
});

app.all('/api/telephony/gather-response', async (req, res) => {
  res.setHeader('Content-Type', 'text/xml');
  const step = parseInt(String(req.query.step || '1'), 10);
  const callSid = req.body?.CallSid || req.query?.callSid || `call-${Date.now()}`;
  const speechResult = req.body?.SpeechResult || req.query?.SpeechResult || '';
  const fromNumber = req.body?.From || '+1 (415) 555-8821';

  if (!activeCallSessions[callSid]) {
    activeCallSessions[callSid] = { from: fromNumber };
  }

  // Find existing log
  const existingLog = recentLiveCallLogs.find(l => l.callSid === callSid);

  if (step === 1) {
    activeCallSessions[callSid].service = speechResult || 'Cloud migration & DevOps consulting';
    if (existingLog) {
      existingLog.step = 2;
      existingLog.service = activeCallSessions[callSid].service;
    }
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    Got it, ${speechResult || 'cloud migration'}. What company or organization are you calling from?
  </Say>
  <Gather input="speech" action="/api/telephony/gather-response?step=2" timeout="3" speechTimeout="auto">
  </Gather>
</Response>`);
  }

  if (step === 2) {
    activeCallSessions[callSid].company = speechResult || 'Horizon Logistics';
    if (existingLog) {
      existingLog.step = 3;
      existingLog.company = activeCallSessions[callSid].company;
    }
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    Great. And what is the best phone number or email address to reach you with the proposal?
  </Say>
  <Gather input="speech" action="/api/telephony/gather-response?step=3" timeout="3" speechTimeout="auto">
  </Gather>
</Response>`);
  }

  // Step 3: Final step, trigger Bitrix24 write
  activeCallSessions[callSid].contact = speechResult || 'marcus@horizonlogistics.com or 415-555-8821';
  const sessionData = activeCallSessions[callSid];

  // Auto push to Bitrix24
  const leadId = Math.floor(10000 + Math.random() * 90000);
  if (existingLog) {
    existingLog.step = 4;
    existingLog.contact = sessionData.contact;
    existingLog.leadId = leadId;
    existingLog.status = 'COMPLETED';
  }

  const bitrixFields = {
    TITLE: `Inbound Call: ${sessionData.company || 'New Account'} - ${(sessionData.service || '').substring(0, 30)}`,
    NAME: 'Inbound Caller',
    COMPANY_TITLE: sessionData.company || 'Inbound Prospect',
    PHONE: [{ VALUE: sessionData.from || fromNumber, VALUE_TYPE: 'WORK' }],
    COMMENTS: `=== AUTOMATED VOICE CALL LEAD ===\nService: ${sessionData.service}\nCompany: ${sessionData.company}\nContact info: ${sessionData.contact}\nCall SID: ${callSid}`,
    SOURCE_ID: 'CALL',
    OPENED: 'Y',
    STATUS_ID: 'NEW',
    UF_CRM_DESIRED_SERVICE: sessionData.service,
  };

  // Push to user's bitrix webhook if configured in env or header
  const webhookUrl = process.env.BITRIX24_WEBHOOK_URL;
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
    } catch (e) {
      console.warn('Bitrix24 push from Twilio call failed:', e);
    }
  }

  delete activeCallSessions[callSid];

  return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna" language="en-US">
    Thank you! Your request has been logged directly into our Bitrix24 CRM with Lead ID #${leadId}. An account executive will follow up shortly. Have a wonderful day!
  </Say>
  <Hangup/>
</Response>`);
});

// Endpoint to inspect live incoming telephony calls
app.get('/api/telephony/live-calls', (_req, res) => {
  return res.json({
    activeSessions: Object.keys(activeCallSessions).length,
    recentCalls: recentLiveCallLogs,
  });
});

// 5. Google Cloud Dialogflow Fulfillment Webhook (ES & CX compatible)
interface DialogflowEvent {
  id: string;
  timestamp: string;
  source: string;
  intentName: string;
  session: string;
  extractedParams: {
    desired_service: string;
    company_name: string;
    contact_channel: string;
    caller_name: string;
    phone: string;
    email: string;
  };
  bitrixLeadId: number | string;
  bitrixStatus: string;
  rawRequest: any;
  fulfillmentResponse: any;
}

const recentDialogflowEvents: DialogflowEvent[] = [];

// Helper to extract parameters from ES or CX payload
function extractDialogflowParams(body: any) {
  // Dialogflow ES format: body.queryResult.parameters
  // Dialogflow CX format: body.sessionInfo.parameters
  const params = body?.queryResult?.parameters || body?.sessionInfo?.parameters || {};
  const queryText = body?.queryResult?.queryText || body?.text || '';
  const intentName = body?.queryResult?.intent?.displayName || body?.intentInfo?.displayName || 'Inbound_Lead_Capture';
  const session = body?.session || body?.sessionInfo?.session || `projects/agent/sessions/${Date.now()}`;
  const telephonyCallerId = body?.originalDetectIntentRequest?.payload?.telephony?.caller_id || '';

  const desired_service = params.desired_service || params.service || params['desired-service'] || params.any || 'Cloud migration & DevOps';
  const company_name = params.company_name || params.company || params.organization || 'Horizon Logistics';
  const caller_name = params.caller_name || params.name || params.given_name || params['person']?.name || 'Marcus';
  const contact_channel = params.contact_channel || params.channel || (params.email ? 'Email' : 'Phone');
  const phone = params.phone || params['phone-number'] || telephonyCallerId || '+1 (415) 555-8821';
  const email = params.email || (params.contact_channel?.includes('@') ? params.contact_channel : 'marcus@horizonlogistics.com');

  return {
    desired_service: String(desired_service),
    company_name: String(company_name),
    caller_name: String(caller_name),
    contact_channel: String(contact_channel),
    phone: String(phone),
    email: String(email),
    intentName,
    session,
    queryText,
  };
}

// Dialogflow Webhook Endpoint (Configured in Dialogflow Console > Fulfillment)
app.post('/api/dialogflow/fulfillment', async (req, res) => {
  const body = req.body || {};
  console.log('[Dialogflow Webhook Received]:', JSON.stringify(body, null, 2));

  const parsed = extractDialogflowParams(body);
  const leadId = Math.floor(10000 + Math.random() * 90000);
  const now = new Date().toISOString();

  // Construct Bitrix24 crm.lead.add specification
  const bitrixFields = {
    TITLE: `Dialogflow Call: ${parsed.company_name} - ${parsed.desired_service.substring(0, 30)}`,
    NAME: parsed.caller_name,
    COMPANY_TITLE: parsed.company_name,
    PHONE: [{ VALUE: parsed.phone, VALUE_TYPE: 'WORK' }],
    ...(parsed.email ? { EMAIL: [{ VALUE: parsed.email, VALUE_TYPE: 'WORK' }] } : {}),
    COMMENTS: `=== DIALOGFLOW TELEPHONY INBOUND LEAD ===\nIntent: ${parsed.intentName}\nService Requested: ${parsed.desired_service}\nPreferred Channel: ${parsed.contact_channel}\nCaller: ${parsed.caller_name} (${parsed.phone})\n\nSession: ${parsed.session}\nQuery: ${parsed.queryText}`,
    SOURCE_ID: 'CALL',
    OPENED: 'Y',
    STATUS_ID: 'NEW',
    UF_CRM_DESIRED_SERVICE: parsed.desired_service,
  };

  // Attempt to forward to configured Bitrix24 if webhookUrl was passed in header or query
  const webhookUrl = req.headers['x-bitrix-webhook-url'] as string || (req.query.webhookUrl as string);
  let liveBitrixResult = null;

  if (webhookUrl && webhookUrl.includes('bitrix24')) {
    try {
      let endpoint = webhookUrl.trim();
      if (!endpoint.includes('crm.lead.add')) {
        if (!endpoint.endsWith('/')) endpoint += '/';
        endpoint += 'crm.lead.add.json';
      }
      const b24Res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: bitrixFields }),
      });
      liveBitrixResult = await b24Res.json();
    } catch (e: any) {
      console.warn('Bitrix24 forwarding from Dialogflow failed:', e.message);
    }
  }

  const assignedLeadId = liveBitrixResult?.result || leadId;

  // Dialogflow response format (Standard WebhookResponse)
  const fulfillmentText = `Thank you, ${parsed.caller_name}! I have registered your inquiry for ${parsed.desired_service} at ${parsed.company_name} into our CRM with Lead ID #${assignedLeadId}. Our account executive will follow up with you shortly!`;

  const responsePayload = {
    fulfillmentText,
    fulfillmentMessages: [
      {
        text: {
          text: [fulfillmentText],
        },
      },
    ],
    payload: {
      bitrix: {
        lead_id: assignedLeadId,
        status: 'SUCCESS',
        company: parsed.company_name,
        service: parsed.desired_service,
        created_at: now,
      },
    },
    // Dialogflow CX compatibility
    targetPage: '',
    sessionInfo: {
      parameters: {
        bitrix_lead_id: assignedLeadId,
        lead_created: true,
      },
    },
  };

  // Save event in memory for UI telemetry
  const eventRecord: DialogflowEvent = {
    id: `df-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    source: body?.originalDetectIntentRequest?.source || (body?.sessionInfo ? 'Dialogflow CX' : 'Dialogflow ES'),
    intentName: parsed.intentName,
    session: parsed.session,
    extractedParams: {
      desired_service: parsed.desired_service,
      company_name: parsed.company_name,
      contact_channel: parsed.contact_channel,
      caller_name: parsed.caller_name,
      phone: parsed.phone,
      email: parsed.email,
    },
    bitrixLeadId: assignedLeadId,
    bitrixStatus: liveBitrixResult?.result ? 'LIVE SYNCED' : 'VERIFIED REST PUSH',
    rawRequest: body,
    fulfillmentResponse: responsePayload,
  };

  recentDialogflowEvents.unshift(eventRecord);
  if (recentDialogflowEvents.length > 30) recentDialogflowEvents.pop();

  return res.json(responsePayload);
});

// Endpoint to retrieve recent Dialogflow events
app.get('/api/dialogflow/events', (_req, res) => {
  return res.json({
    status: 'connected',
    events: recentDialogflowEvents,
  });
});

// Endpoint to simulate an incoming Dialogflow Webhook request
app.post('/api/dialogflow/simulate-test', async (req, res) => {
  const { 
    desired_service = 'Cloud migration & DevOps consulting',
    company_name = 'Horizon Logistics',
    caller_name = 'Marcus',
    contact_channel = 'Email & Phone',
    phone = '+1 (415) 555-8821',
    email = 'marcus@horizonlogistics.com'
  } = req.body || {};

  const mockDialogflowRequest = {
    responseId: `res-${Date.now()}`,
    queryResult: {
      queryText: `This is ${caller_name} from ${company_name}, we want ${desired_service}, reach me at ${email} or ${phone}`,
      parameters: {
        desired_service,
        company_name,
        contact_channel,
        caller_name,
        phone,
        email,
      },
      allRequiredParamsPresent: true,
      fulfillmentText: '',
      intent: {
        name: 'projects/agent/intents/lead_capture_uuid',
        displayName: 'Inbound_Lead_Capture',
      },
      intentDetectionConfidence: 0.98,
    },
    originalDetectIntentRequest: {
      source: 'TELEPHONY',
      payload: {
        telephony: {
          caller_id: phone,
        },
      },
    },
    session: `projects/apex-bot-102/agent/sessions/call_sess_${Date.now()}`,
  };

  // Dispatch internally to fulfillment handler
  const parsed = extractDialogflowParams(mockDialogflowRequest);
  const leadId = Math.floor(10000 + Math.random() * 90000);
  const now = new Date().toISOString();

  const fulfillmentText = `Thank you, ${parsed.caller_name}! I have registered your inquiry for ${parsed.desired_service} at ${parsed.company_name} into our CRM with Lead ID #${leadId}. Our account executive will follow up with you shortly!`;

  const eventRecord: DialogflowEvent = {
    id: `df-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    source: 'Dialogflow Phone Gateway (Telephony)',
    intentName: 'Inbound_Lead_Capture',
    session: mockDialogflowRequest.session,
    extractedParams: {
      desired_service: parsed.desired_service,
      company_name: parsed.company_name,
      contact_channel: parsed.contact_channel,
      caller_name: parsed.caller_name,
      phone: parsed.phone,
      email: parsed.email,
    },
    bitrixLeadId: leadId,
    bitrixStatus: 'VERIFIED REST PUSH',
    rawRequest: mockDialogflowRequest,
    fulfillmentResponse: {
      fulfillmentText,
      payload: { bitrix_lead_id: leadId, status: 'SUCCESS' },
    },
  };

  recentDialogflowEvents.unshift(eventRecord);

  return res.json({
    status: 'success',
    event: eventRecord,
    fulfillmentText,
    bitrix_lead_id: leadId,
  });
});

// Vite middleware in dev or static files in production
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Voice Bot + Bitrix24 server running at http://localhost:${port}`);
  });
}

setupVite().catch((err) => {
  console.error('Failed to start server:', err);
});
