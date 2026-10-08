# AI Voice Agent + Bitrix24 CRM Integration — MVP

> **Autonomous Inbound Phone Call to Bitrix24 CRM Lead Pipeline**
> An end-to-end voice bot that answers incoming telephone calls, conducts a 3-question qualifying dialog, extracts key lead data via NLP, and writes the structured record directly into Bitrix24 CRM via its REST API without human intervention.

---

## 🎯 Architecture & End-to-End Journey

```
 ┌─────────────────────────┐
 │ 1. Public Phone Number  │  Caller dials DID (Twilio / Dialogflow / SIP)
 └───────────┬─────────────┘
             │ Inbound Webhook Handshake (SIP/HTTP)
             ▼
 ┌─────────────────────────┐
 │ 2. Text-to-Speech (TTS) │  Bot plays greeting + 3 preset questions:
 └───────────┬─────────────┘  Q1: Desired Service  Q2: Company Name  Q3: Contact Info
             │ Audio stream to caller
             ▼
 ┌─────────────────────────┐
 │ 3. Speech-to-Text (STT) │  Caller speaks short replies;
 └───────────┬─────────────┘  Speech recognized into clean text transcript turns
             │ Transcript turns
             ▼
 ┌─────────────────────────┐
 │ 4. NLP Extraction Layer │  Gemini 3.8 Flash extracts structured JSON:
 └───────────┬─────────────┘  • desired_service  • company_name  • contact_channel
             │ Formatted CRM schema
             ▼
 ┌─────────────────────────┐
 │ 5. Bitrix24 REST API    │  POST /crm.lead.add.json
 └─────────────────────────┘  Brand-new populated lead created in Bitrix24!
```

---

## ⚡ Tech Stack & Compatibility

- **Runtime:** Node.js (v18+) with Express and TypeScript (`tsx`)
- **Telephony Adapters Supported:**
  - **Twilio Voice:** Native TwiML Speech `<Gather>` state machine (`/api/telephony/incoming-call` & `/api/telephony/gather-response`)
  - **Google Cloud Dialogflow:** Dialogflow Phone Gateway & Fulfillment Webhook (`/api/dialogflow/fulfillment`)
  - **In-Browser WebRTC Softphone:** Live browser-based microphone testing via Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- **NLP Extraction:** Gemini 3.8 Flash (`@google/genai`) with structured JSON schema
- **CRM Integration:** Bitrix24 REST API (`crm.lead.add`)

---

## 🚀 Quickstart (Local or Small VPS)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/voice-to-bitrix24.git
cd voice-to-bitrix24
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```ini
# Port for the Node.js service
PORT=3000

# Your Bitrix24 Inbound Webhook URL (with crm.lead.add permission)
# Format: https://<your-subdomain>.bitrix24.com/rest/1/<webhook-token>/crm.lead.add.json
BITRIX24_WEBHOOK_URL="https://b24-xxxx.bitrix24.com/rest/1/abcdef123456/crm.lead.add.json"

# Gemini API Key (for NLP entity extraction)
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Run Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`.

---

## 📞 Telephony Connection Guides

### Option A: Twilio Voice (Public Phone Number)

1. Buy or select a phone number in the [Twilio Console](https://console.twilio.com/).
2. Navigate to **Phone Numbers** > **Manage** > **Active numbers** > click your number.
3. Under **Voice & Fax**, find **A CALL COMES IN**:
   - Change to **Webhook**
   - URL: `https://<YOUR-SERVER-DOMAIN>/api/telephony/incoming-call`
   - Method: **HTTP POST**
4. Click **Save**.
5. **Test:** Dial your Twilio number from your mobile phone. You will hear the bot ask the 3 questions, record your answers, and create a lead in Bitrix24!

### Option B: Google Cloud Dialogflow Phone Gateway

1. Open [Dialogflow Console](https://dialogflow.cloud.google.com/).
2. Go to **Fulfillment** > enable **Webhook**.
3. Set the Webhook URL to:
   ```
   https://<YOUR-SERVER-DOMAIN>/api/dialogflow/fulfillment
   ```
4. In **Integrations**, enable **Dialogflow Phone Gateway** to assign a phone number.
5. In your lead capture intent, check **"Enable webhook call for this intent"**.

### Option C: Bitrix24 Inbound Webhook Creation (2 Minutes)

1. Log into your **Bitrix24** account.
2. In the left menu, search for **Developer Zone** or **Applications** > **Webhooks**.
3. Click **Add Webhook** > choose **Inbound Webhook**.
4. In the permissions list, check **CRM (`crm`)**.
5. Copy the generated REST URL and append `crm.lead.add.json`:
   ```
   https://your-domain.bitrix24.com/rest/1/xxxxxxxxxxxxxx/crm.lead.add.json
   ```

---

## 🧪 Acceptance Verification

You can verify the end-to-end milestone using three different methods:

### Method 1: Live In-Browser Softphone Simulator
1. Open the web interface at `http://localhost:3000`.
2. Go to the **Call Simulator** tab.
3. Click **"Receive Inbound Call"**.
4. Answer the questions:
   - *Question 1:* "We're looking for cloud migration and AWS DevOps consulting."
   - *Question 2:* "This is Marcus from Horizon Logistics."
   - *Question 3:* "You can reach me at marcus@horizonlogistics.com or 415-555-8821."
5. As soon as the call hangs up, view the **5-Step Pipeline** and **Bitrix24 Leads** tab to see the created record!

### Method 2: Real Phone Call
1. Dial the Twilio or Dialogflow public telephone number.
2. Speak your answers clearly.
3. Refresh your Bitrix24 CRM Leads page — the new lead appears under **Leads** with:
   - **Title:** `Inbound Call: Horizon Logistics - Cloud migration`
   - **Contact Name:** `Marcus`
   - **Company:** `Horizon Logistics`
   - **Phone:** Caller ID phone number
   - **Email:** `marcus@horizonlogistics.com`
   - **Comments:** Full call transcript + synthesized requirements.

### Method 3: Automated cURL Script

```bash
curl -X POST http://localhost:3000/api/telephony/nlp-extract \
  -H "Content-Type: application/json" \
  -d '{
    "callerNumber": "+1 (415) 555-8821",
    "transcript": [
      { "speaker": "bot", "text": "Hello! Which service are you interested in today?" },
      { "speaker": "caller", "text": "We need cloud migration and DevOps consulting." },
      { "speaker": "bot", "text": "What company are you calling from?" },
      { "speaker": "caller", "text": "This is Marcus from Horizon Logistics." },
      { "speaker": "bot", "text": "What is the best phone number or email to reach you?" },
      { "speaker": "caller", "text": "Reach me at marcus@horizonlogistics.com or 415-555-8821." }
    ]
  }'
```

---

## 📡 API Endpoints Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/telephony/incoming-call` | `ALL` | Twilio Inbound Voice Webhook (TwiML initial greeting & Q1) |
| `/api/telephony/gather-response` | `ALL` | Twilio Speech `<Gather>` multi-turn state machine & CRM dispatch |
| `/api/dialogflow/fulfillment` | `POST` | Google Cloud Dialogflow ES/CX fulfillment webhook |
| `/api/dialogflow/events` | `GET` | Live stream of recent Dialogflow telephony events |
| `/api/telephony/nlp-extract` | `POST` | Gemini 3.8 Flash NLP extraction service |
| `/api/bitrix/crm.lead.add` | `POST` | Bitrix24 REST API lead dispatcher |
| `/api/bitrix/test-connection` | `POST` | Tests connectivity and permissions of Bitrix24 webhook |

---

## 📦 Production Deployment (VPS / Cloud Run)

To run in background on any Linux VPS with PM2:

```bash
npm run build
npm install -g pm2
pm2 start server.ts --interpreter tsx --name "voice-bitrix24"
pm2 save
```

Or deploy to Google Cloud Run / AWS ECS / DigitalOcean App Platform as a containerized Node.js service.

---

## 📄 License

MIT © 2026. Built for seamless telephony CRM automation.
