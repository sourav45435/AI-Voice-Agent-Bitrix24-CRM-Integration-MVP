import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Send, 
  Sparkles, 
  User, 
  Building2, 
  Bot, 
  Clock, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  Delete, 
  Radio, 
  Check, 
  Hash, 
  PhoneCall,
  Layers
} from 'lucide-react';
import { CallTranscriptItem } from '../../types/telephony';
import { playDtmfTone } from '../../utils/audio';

interface CallSimulatorProps {
  onCallCompleted: (transcript: CallTranscriptItem[], callerNumber: string) => void;
  isProcessingNLP?: boolean;
  attachedNumber?: string;
  onAttachNumber?: (num: string) => void;
}

export const CallSimulator: React.FC<CallSimulatorProps> = ({
  onCallCompleted,
  isProcessingNLP = false,
  attachedNumber = '+1 (415) 555-8821',
  onAttachNumber,
}) => {
  // Call status: 'idle' | 'ringing' | 'connected' | 'completed'
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'connected' | 'completed'>('idle');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [callerNumber, setCallerNumber] = useState<string>(attachedNumber);
  const [callerName, setCallerName] = useState<string>('Marcus Vance');
  const [audioMuted, setAudioMuted] = useState<boolean>(false);
  const [isListeningMic, setIsListeningMic] = useState<boolean>(false);
  const [userInputText, setUserInputText] = useState<string>('');
  const [transcript, setTranscript] = useState<CallTranscriptItem[]>([]);
  const [botIsSpeaking, setBotIsSpeaking] = useState<boolean>(false);

  // Dialpad / Line Attachment Mode: 'call' | 'dialer'
  const [viewMode, setViewMode] = useState<'call' | 'dialer'>('call');
  const [dialedInput, setDialedInput] = useState<string>(attachedNumber);
  const [lineAttachedMessage, setLineAttachedMessage] = useState<string | null>(null);

  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (attachedNumber) {
      setCallerNumber(attachedNumber);
      setDialedInput(attachedNumber);
    }
  }, [attachedNumber]);

  // Script Questions
  const questions = [
    {
      step: 1,
      botText: "Hello! Thank you for calling Apex Cloud Solutions. Which service are you interested in today?",
      options: [
        "We're looking for cloud migration and AWS DevOps consulting.",
        "We need a full cybersecurity architecture audit.",
        "We are looking for automated CRM workflow implementation.",
      ],
    },
    {
      step: 2,
      botText: "Got it, cloud migration and DevOps consulting. What company or organization are you calling from?",
      options: [
        "This is Marcus from Horizon Logistics.",
        "I'm calling from Meridian Capital Partners.",
        "This is David from Beacon Health Technologies.",
      ],
    },
    {
      step: 3,
      botText: "Great. And what is the best phone number or email address to reach you with the proposal?",
      options: [
        `You can reach me at marcus@horizonlogistics.com or ${callerNumber}.`,
        `Email me at mvance@horizonlogistics.com, phone is ${callerNumber}.`,
        `My direct phone is ${callerNumber}, or reach me by email.`,
      ],
    },
  ];

  // Timer
  useEffect(() => {
    let interval: any;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Text-To-Speech implementation
  const speakText = (text: string, onEnd?: () => void) => {
    if (audioMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) setTimeout(onEnd, 1200);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      // Prefer a natural voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.lang === 'en-US') && !v.name.includes('Bad')
      );
      if (preferredVoice) utterance.voice = preferredVoice;

      setBotIsSpeaking(true);
      utterance.onend = () => {
        setBotIsSpeaking(false);
        if (onEnd) onEnd();
      };
      utterance.onerror = () => {
        setBotIsSpeaking(false);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS error:', e);
      setBotIsSpeaking(false);
      if (onEnd) onEnd();
    }
  };

  // Web Speech STT Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        if (text) {
          handleCallerAnswer(text);
        }
        setIsListeningMic(false);
      };

      rec.onerror = () => {
        setIsListeningMic(false);
      };

      rec.onend = () => {
        setIsListeningMic(false);
      };

      recognitionRef.current = rec;
    }
  }, [currentStep, callState]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. You can select preset quick answers or type your reply.');
      return;
    }

    if (isListeningMic) {
      recognitionRef.current.stop();
      setIsListeningMic(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListeningMic(true);
      } catch (e) {
        console.warn('Mic start error:', e);
      }
    }
  };

  // Start Call Flow
  const handleStartCall = () => {
    setViewMode('call');
    setCallState('ringing');
    setTranscript([]);
    setCurrentStep(0);
    setCallDuration(0);

    setTimeout(() => {
      setCallState('connected');
      setCurrentStep(1);

      const q1 = questions[0].botText;
      const newItems: CallTranscriptItem[] = [
        {
          id: `t-${Date.now()}`,
          speaker: 'bot',
          text: q1,
          timestamp: '00:01',
        },
      ];
      setTranscript(newItems);
      speakText(q1);
    }, 1800);
  };

  // Instant Auto-Complete Demo
  const handleInstantDemo = () => {
    setViewMode('call');
    const demoItems: CallTranscriptItem[] = [
      { id: '1', speaker: 'bot', text: 'Hello! Thank you for calling Apex Cloud Solutions. Which service are you interested in today?', timestamp: '00:01' },
      { id: '2', speaker: 'caller', text: "We're looking for cloud migration and AWS DevOps consulting.", timestamp: '00:05' },
      { id: '3', speaker: 'bot', text: 'Got it, cloud migration and DevOps consulting. What company or organization are you calling from?', timestamp: '00:10' },
      { id: '4', speaker: 'caller', text: 'This is Marcus from Horizon Logistics.', timestamp: '00:14' },
      { id: '5', speaker: 'bot', text: 'Great. And what is the best phone number or email address to reach you with the proposal?', timestamp: '00:19' },
      { id: '6', speaker: 'caller', text: `You can reach me at marcus@horizonlogistics.com or ${callerNumber}.`, timestamp: '00:24' },
      { id: '7', speaker: 'bot', text: "Thank you, Marcus! I've logged your request into our Bitrix24 CRM. Our cloud solutions architect will reach out shortly. Have a wonderful day!", timestamp: '00:29' },
    ];
    setCallState('completed');
    setTranscript(demoItems);
    setCallDuration(29);
    onCallCompleted(demoItems, callerNumber);
  };

  // Handle Caller Response
  const handleCallerAnswer = (answer: string) => {
    if (!answer.trim() || callState !== 'connected') return;

    const callerItem: CallTranscriptItem[] = [
      ...transcript,
      {
        id: `caller-${Date.now()}`,
        speaker: 'caller',
        text: answer.trim(),
        timestamp: formatDuration(callDuration),
      },
    ];

    setTranscript(callerItem);
    setUserInputText('');

    // Advance step
    if (currentStep === 1) {
      setCurrentStep(2);
      const q2 = questions[1].botText;
      setTimeout(() => {
        const withBot: CallTranscriptItem[] = [
          ...callerItem,
          {
            id: `bot-${Date.now()}`,
            speaker: 'bot',
            text: q2,
            timestamp: formatDuration(callDuration + 1),
          },
        ];
        setTranscript(withBot);
        speakText(q2);
      }, 700);
    } else if (currentStep === 2) {
      setCurrentStep(3);
      const q3 = questions[2].botText;
      setTimeout(() => {
        const withBot: CallTranscriptItem[] = [
          ...callerItem,
          {
            id: `bot-${Date.now()}`,
            speaker: 'bot',
            text: q3,
            timestamp: formatDuration(callDuration + 1),
          },
        ];
        setTranscript(withBot);
        speakText(q3);
      }, 700);
    } else if (currentStep === 3) {
      setCurrentStep(4);
      const farewell = `Thank you! I've logged your request into our Bitrix24 CRM. Our cloud solutions architect will reach out shortly to ${callerNumber}. Have a wonderful day!`;
      
      setTimeout(() => {
        const finalTranscript: CallTranscriptItem[] = [
          ...callerItem,
          {
            id: `bot-${Date.now()}`,
            speaker: 'bot',
            text: farewell,
            timestamp: formatDuration(callDuration + 1),
          },
        ];
        setTranscript(finalTranscript);
        speakText(farewell, () => {
          setTimeout(() => {
            setCallState('completed');
            onCallCompleted(finalTranscript, callerNumber);
          }, 1000);
        });
      }, 700);
    }
  };

  const handleEndCall = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallState('completed');
    if (transcript.length > 0) {
      onCallCompleted(transcript, callerNumber);
    }
  };

  const handleResetCall = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallState('idle');
    setTranscript([]);
    setCurrentStep(0);
    setCallDuration(0);
  };

  // Dialpad press handler
  const handleDialDigit = (digit: string) => {
    playDtmfTone(digit);
    setDialedInput((prev) => prev + digit);
  };

  const handleBackspaceDigit = () => {
    setDialedInput((prev) => prev.slice(0, -1));
  };

  const handleAttachNumber = () => {
    const finalNumber = dialedInput.trim() || '+1 (415) 555-8821';
    setCallerNumber(finalNumber);
    if (onAttachNumber) onAttachNumber(finalNumber);
    setLineAttachedMessage(`✓ Line attached to public trunk: ${finalNumber}`);
    setTimeout(() => setLineAttachedMessage(null), 3000);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestionData = questions.find((q) => q.step === currentStep);

  const dialpadButtons = [
    { num: '1', sub: ' ' },
    { num: '2', sub: 'ABC' },
    { num: '3', sub: 'DEF' },
    { num: '4', sub: 'GHI' },
    { num: '5', sub: 'JKL' },
    { num: '6', sub: 'MNO' },
    { num: '7', sub: 'PQRS' },
    { num: '8', sub: 'TUV' },
    { num: '9', sub: 'WXYZ' },
    { num: '*', sub: ' ' },
    { num: '0', sub: '+' },
    { num: '#', sub: ' ' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-6xl mx-auto">
      {/* Left Column: Virtual Phone Device (Softphone & Dialpad) */}
      <div className="lg:col-span-5 flex flex-col">
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xl overflow-hidden flex flex-col h-[700px]">
          {/* Phone Top Bezel with Public Line & Mode Toggle */}
          <div className="bg-[#111318] text-white px-5 py-3 flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold tracking-wide text-gray-200 uppercase">
                Public Line: +1 (800) 419-APEX
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {callState === 'idle' && (
                <div className="flex bg-gray-800 p-0.5 rounded-lg text-[11px]">
                  <button
                    onClick={() => setViewMode('call')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      viewMode === 'call' ? 'bg-gray-700 text-white font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Call View
                  </button>
                  <button
                    onClick={() => setViewMode('dialer')}
                    className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      viewMode === 'dialer' ? 'bg-[#FF5A1F] text-white font-bold' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Dialpad
                  </button>
                </div>
              )}

              <button
                onClick={() => setAudioMuted(!audioMuted)}
                className="text-gray-400 hover:text-white p-1 rounded transition-colors"
                title={audioMuted ? 'Unmute Text-to-Speech' : 'Mute Text-to-Speech'}
              >
                {audioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            </div>
          </div>

          {/* Caller Screen / State */}
          <div className="bg-gradient-to-b from-gray-900 via-gray-900 to-[#181A20] text-white p-5 flex flex-col items-center justify-center text-center relative shrink-0">
            {/* Pulsing Avatar Frame */}
            <div className="relative mb-2">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  callState === 'connected'
                    ? 'bg-emerald-500/20 ring-4 ring-emerald-500/30'
                    : callState === 'ringing'
                    ? 'bg-amber-500/20 ring-4 ring-amber-500/30 animate-pulse'
                    : 'bg-gray-800'
                }`}
              >
                <User size={28} className={callState === 'connected' ? 'text-emerald-400' : 'text-gray-400'} />
              </div>
              {botIsSpeaking && (
                <div className="absolute -bottom-1 -right-1 bg-[#FF5A1F] text-white p-1 rounded-full shadow-md animate-bounce">
                  <Bot size={13} />
                </div>
              )}
            </div>

            {/* Caller Identity */}
            <h3 className="text-sm font-bold text-white tracking-tight">{callerName}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-gray-300 font-mono font-medium">{callerNumber}</span>
              <span className="px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 rounded text-[9px] font-bold">
                ATTACHED
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <Building2 size={11} /> Horizon Logistics
            </p>

            {/* Call State Pill */}
            <div className="mt-2.5">
              {callState === 'idle' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-gray-800 text-gray-300">
                  Ready for Inbound / Outbound Call
                </span>
              )}
              {callState === 'ringing' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300 animate-pulse">
                  Incoming Ringing... Handing to Bot
                </span>
              )}
              {callState === 'connected' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300">
                  <Clock size={11} /> Connected: {formatDuration(callDuration)}
                </span>
              )}
              {callState === 'completed' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/20 text-blue-300">
                  <CheckCircle2 size={11} /> Call Completed · Synced to Bitrix24
                </span>
              )}
            </div>

            {/* Live Audio Waves */}
            <div className="flex items-center gap-1 h-5 mt-3">
              {[20, 50, 80, 45, 90, 60, 30, 75, 40, 85].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    botIsSpeaking
                      ? 'bg-[#FF5A1F]'
                      : isListeningMic
                      ? 'bg-emerald-400'
                      : callState === 'connected'
                      ? 'bg-gray-600'
                      : 'bg-gray-800'
                  }`}
                  style={{
                    height: (botIsSpeaking || isListeningMic) ? `${(h * (Math.sin(callDuration + i) + 1.2)) / 3}px` : '4px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Interactive Dialpad Mode vs Active Call Session */}
          <div className="flex-1 bg-white p-4 flex flex-col justify-between overflow-y-auto">
            {callState === 'idle' && viewMode === 'dialer' && (
              <div className="flex flex-col h-full justify-between">
                <div>
                  {/* Dialed Number Screen */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-2.5 flex items-center justify-between mb-3 shadow-inner">
                    <input
                      type="text"
                      value={dialedInput}
                      onChange={(e) => setDialedInput(e.target.value)}
                      placeholder="+1 (xxx) xxx-xxxx"
                      className="bg-transparent font-mono text-base font-bold text-gray-900 tracking-wider outline-none w-full"
                    />
                    <button
                      onClick={handleBackspaceDigit}
                      className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
                      title="Backspace"
                    >
                      <Delete size={16} />
                    </button>
                  </div>

                  {lineAttachedMessage && (
                    <div className="bg-emerald-50 text-emerald-700 text-[11px] font-bold p-2 rounded-xl mb-2 text-center animate-in fade-in">
                      {lineAttachedMessage}
                    </div>
                  )}

                  {/* 12-Button Keypad with DTMF Tone feedback */}
                  <div className="grid grid-cols-3 gap-2">
                    {dialpadButtons.map((btn) => (
                      <button
                        key={btn.num}
                        onClick={() => handleDialDigit(btn.num)}
                        className="flex flex-col items-center justify-center h-12 bg-gray-50 hover:bg-orange-50 active:scale-95 border border-gray-200/80 hover:border-orange-300 rounded-2xl transition-all cursor-pointer shadow-2xs group"
                      >
                        <span className="text-base font-bold text-gray-900 group-hover:text-[#FF5A1F] leading-none">
                          {btn.num}
                        </span>
                        {btn.sub.trim() && (
                          <span className="text-[9px] font-semibold text-gray-400 group-hover:text-orange-500/80 leading-none mt-0.5">
                            {btn.sub}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Preset Quick Numbers */}
                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                    <span className="text-gray-400 shrink-0 font-bold">Presets:</span>
                    <button
                      onClick={() => {
                        setDialedInput('+1 (415) 555-8821');
                        setCallerName('Marcus Vance');
                      }}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shrink-0 cursor-pointer"
                    >
                      Marcus (415)
                    </button>
                    <button
                      onClick={() => {
                        setDialedInput('+1 (206) 555-0194');
                        setCallerName('Elena Rostova');
                      }}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shrink-0 cursor-pointer"
                    >
                      Elena (206)
                    </button>
                    <button
                      onClick={() => {
                        setDialedInput('+1 (650) 555-3349');
                        setCallerName('David Chen');
                      }}
                      className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg shrink-0 cursor-pointer"
                    >
                      David (650)
                    </button>
                  </div>
                </div>

                {/* Dialpad Action Buttons */}
                <div className="space-y-2 pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleAttachNumber}
                      className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} className="text-emerald-600" />
                      <span>Attach to Line</span>
                    </button>
                    <button
                      onClick={() => {
                        handleAttachNumber();
                        handleStartCall();
                      }}
                      className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Phone size={14} />
                      <span>Dial Public Line</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setViewMode('call')}
                    className="w-full text-center text-xs text-gray-500 hover:text-gray-800 font-medium py-1"
                  >
                    ← Switch back to Call View
                  </button>
                </div>
              </div>
            )}

            {callState === 'idle' && viewMode === 'call' && (
              <div className="flex flex-col items-center justify-center h-full text-center p-3">
                <div className="p-3.5 rounded-2xl bg-orange-50 text-[#FF5A1F] mb-2.5 shadow-2xs">
                  <Phone size={28} />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Test Autonomous Call</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs leading-relaxed">
                  Attached to Public Line <strong className="text-gray-800">+1 (800) 419-APEX</strong>. Answers incoming calls, asks 3 questions, and writes directly into Bitrix24.
                </p>

                <div className="flex flex-col gap-2 w-full mt-4">
                  <button
                    onClick={handleStartCall}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer text-xs"
                  >
                    <Phone size={15} />
                    <span>Receive Inbound Call (Interactive)</span>
                  </button>
                  <button
                    onClick={handleInstantDemo}
                    className="w-full bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs transition-all cursor-pointer"
                  >
                    <Sparkles size={14} className="text-[#FF5A1F]" />
                    <span>1-Click Auto Demo (Instant CRM Push)</span>
                  </button>
                  <button
                    onClick={() => setViewMode('dialer')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer"
                  >
                    <span>Open Phone Keypad & Attach Number</span>
                  </button>
                </div>
              </div>
            )}

            {callState === 'ringing' && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center animate-bounce mb-3">
                  <Phone size={26} />
                </div>
                <span className="text-xs font-bold text-gray-800">Connecting SIP Session...</span>
                <span className="text-[11px] text-gray-400 mt-1">Handing caller to Autonomous Apex Voice Bot</span>
              </div>
            )}

            {callState === 'connected' && (
              <div className="flex flex-col h-full justify-between gap-3">
                {/* Step indicator */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
                  <span className="font-bold text-gray-800">
                    Question {currentStep} of 3
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {currentStep === 1 ? 'Desired Service' : currentStep === 2 ? 'Company Name' : 'Contact Channel'}
                  </span>
                </div>

                {/* Caller Responses Options (One-Click Presets) */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Caller Quick Replies (Short Sentences):
                  </span>
                  {currentQuestionData?.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCallerAnswer(opt)}
                      className="w-full text-left p-2.5 rounded-xl border border-gray-200 hover:border-[#FF5A1F] hover:bg-orange-50/40 text-xs text-gray-800 transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <span className="line-clamp-2">"{opt}"</span>
                      <ArrowRight size={13} className="text-gray-300 group-hover:text-[#FF5A1F] shrink-0 ml-1" />
                    </button>
                  ))}
                </div>

                {/* Custom input or microphone */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={toggleMic}
                      className={`p-2.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
                        isListeningMic
                          ? 'bg-rose-500 text-white border-rose-600 ring-2 ring-rose-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                      }`}
                      title={isListeningMic ? 'Listening... click to stop' : 'Speak via microphone (STT)'}
                    >
                      {isListeningMic ? <MicOff size={15} /> : <Mic size={15} />}
                    </button>

                    <input
                      type="text"
                      value={userInputText}
                      onChange={(e) => setUserInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCallerAnswer(userInputText);
                      }}
                      placeholder="Or type custom short reply..."
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-orange-400"
                    />

                    <button
                      onClick={() => handleCallerAnswer(userInputText)}
                      disabled={!userInputText.trim()}
                      className="p-2.5 bg-[#FF5A1F] hover:bg-[#E54D14] disabled:bg-gray-200 text-white rounded-xl transition-colors cursor-pointer shrink-0"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </div>

                {/* End Call Button */}
                <button
                  onClick={handleEndCall}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PhoneOff size={14} />
                  <span>Hang Up & Push to Bitrix24</span>
                </button>
              </div>
            )}

            {callState === 'completed' && (
              <div className="flex flex-col items-center justify-center h-full text-center p-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-sm font-bold text-gray-900">Call Completed & Transcribed</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  {transcript.length} dialogue turns processed. Structured fields extracted and pushed to Bitrix24 REST API.
                </p>
                <div className="flex gap-2 w-full mt-4">
                  <button
                    onClick={handleResetCall}
                    className="flex-1 py-2 px-3 border border-gray-200 hover:bg-gray-50 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw size={13} />
                    <span>New Call</span>
                  </button>
                  <button
                    onClick={() => {
                      handleResetCall();
                      setViewMode('dialer');
                    }}
                    className="flex-1 py-2 px-3 bg-gray-900 hover:bg-black rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Dialpad</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Live Audio & Speech Transcript */}
      <div className="lg:col-span-7 flex flex-col">
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xl overflow-hidden flex flex-col h-[700px]">
          {/* Header */}
          <div className="px-6 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
            <div className="flex items-center gap-2">
              <Bot size={17} className="text-[#FF5A1F]" />
              <h3 className="font-bold text-gray-900 text-sm">Live Audio & Speech Transcript</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-gray-400">
                Turns: {transcript.length}
              </span>
              {botIsSpeaking && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#FF5A1F] animate-pulse">
                  TTS Speaking
                </span>
              )}
            </div>
          </div>

          {/* Transcript Feed */}
          <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
            {transcript.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <Bot size={42} className="mb-2 text-gray-300" />
                <p className="text-sm font-bold text-gray-700">No active call session</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm leading-relaxed">
                  Click "Receive Inbound Call" or use the Dialpad to start the autonomous 3-question dialog flow.
                </p>
              </div>
            ) : (
              transcript.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col ${item.speaker === 'caller' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-gray-400">
                    {item.speaker === 'bot' ? (
                      <>
                        <Bot size={12} className="text-[#FF5A1F]" />
                        <span className="font-bold text-gray-700">Apex Voice Bot</span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-gray-700">{callerName} ({callerNumber})</span>
                        <User size={12} />
                      </>
                    )}
                    <span>· {item.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs md:text-sm leading-relaxed shadow-2xs ${
                      item.speaker === 'caller'
                        ? 'bg-[#18181B] text-white rounded-tr-xs'
                        : 'bg-orange-50/80 border border-orange-100 text-gray-900 rounded-tl-xs'
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Bottom Call Progress Bar */}
          <div className="p-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${callState === 'connected' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                SIP Trunk
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${currentStep >= 1 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                Service
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${currentStep >= 2 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                Company
              </span>
              <span className="flex items-center gap-1 text-[11px]">
                <span className={`w-2 h-2 rounded-full ${currentStep >= 3 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                Contact
              </span>
            </div>
            {isProcessingNLP && (
              <span className="text-[#FF5A1F] font-bold text-[11px] flex items-center gap-1">
                <Sparkles size={12} className="animate-spin" />
                Extracting NLP & Writing to Bitrix24...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
