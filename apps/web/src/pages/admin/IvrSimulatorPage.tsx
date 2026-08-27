import React, { useState } from 'react';
import { api } from '../../services/api';

export const IvrSimulatorPage: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('0711000003'); // Farmer C default
  const [callActive, setCallActive] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [dtmfInput, setDtmfInput] = useState('');
  const [transcript, setTranscript] = useState<Array<{ speaker: 'IVR Voice' | 'Farmer Keypad'; text: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const presetPhones = [
    { label: 'Farmer A (Alice)', phone: '0711000001' },
    { label: 'Farmer B (Bernard)', phone: '0711000002' },
    { label: 'Farmer C (Caroline)', phone: '0711000003' },
    { label: 'Farmer D (David)', phone: '0711000004' },
  ];

  const speakText = (text: string) => {
    if (audioEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartCall = async () => {
    if (!phoneNumber) return;

    const newSessionId = `IVR-CALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setSessionId(newSessionId);
    setTranscript([]);
    setCallActive(true);
    setLoading(true);

    const res = await api.sendIvrJson(newSessionId, phoneNumber, '');

    if (res.success && res.data) {
      setCurrentPrompt(res.data.prompt);
      setTranscript([{ speaker: 'IVR Voice', text: res.data.prompt }]);
      speakText(res.data.prompt);
      if (!res.data.continueSession) {
        setCallActive(false);
      }
    } else {
      setCurrentPrompt('Call disconnected or gateway error.');
      setCallActive(false);
    }
    setLoading(false);
  };

  const handleSendDtmf = async (digit: string) => {
    if (!callActive) return;

    setLoading(true);
    setTranscript((prev) => [...prev, { speaker: 'Farmer Keypad', text: `Pressed: [ ${digit} ]` }]);

    const res = await api.sendIvrJson(sessionId, phoneNumber, digit);

    if (res.success && res.data) {
      setCurrentPrompt(res.data.prompt);
      setTranscript((prev) => [...prev, { speaker: 'IVR Voice', text: res.data.prompt }]);
      speakText(res.data.prompt);
      if (!res.data.continueSession) {
        setCallActive(false);
      }
    } else {
      setCurrentPrompt('Call disconnected.');
      setCallActive(false);
    }
    setLoading(false);
    setDtmfInput('');
  };

  const handleEndCall = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCallActive(false);
    setSessionId('');
    setCurrentPrompt('Call ended.');
  };

  const inputClass = "w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-sm rounded-lg pl-4 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:border-[#ed7423] focus:ring-1 focus:ring-[#ed7423] transition-colors";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#184037] tracking-tight">📞 IVR Voice Interactive Simulator</h1>
        <p className="text-xs text-slate-500 mt-1">
          Simulates inbound voice calls with bilingual voice navigation & DTMF keypad prompts. Writes directly to the unified database with <code className="bg-slate-100 px-1 py-0.5 rounded text-[#184037] font-mono">source_channel: 'IVR'</code>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px', alignItems: 'start' }}>
        {/* Phone Frame */}
        <div className="phone-simulator-container">
          <div className="phone-mockup" style={{ borderColor: '#0f2b1d' }}>
            {/* Top Bar */}
            <div style={{ height: '36px', background: '#0b1e13', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px', fontSize: '0.75rem', color: '#86efac' }}>
              <span>VILLAGIO IVR</span>
              <span>{callActive ? '🟢 IN CALL' : '⚪ READY'}</span>
            </div>

            {/* Screen Area: Audio Wave & Transcript */}
            <div
              style={{
                flex: 1,
                background: '#041d11',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                borderBottom: '2px solid #064e3b',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: callActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.06)',
                  border: `2px solid ${callActive ? '#22c55e' : '#374151'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  marginBottom: '14px',
                  animation: callActive ? 'pulse 2s infinite' : 'none',
                }}
              >
                {callActive ? '🔊' : '📞'}
              </div>

              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '6px' }}>
                {callActive ? 'CALL IN PROGRESS' : 'VILLAGIO TOLL-FREE IVR'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#86efac', marginBottom: '16px' }}>
                Caller: {phoneNumber}
              </div>

              {/* Current Spoken Prompt */}
              <div
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: '1px solid #065f46',
                  borderRadius: '10px',
                  padding: '12px',
                  fontSize: '0.85rem',
                  color: '#86efac',
                  lineHeight: '1.4',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  width: '100%',
                }}
              >
                {currentPrompt || 'Press "CALL VILLAGIO" to initiate voice session.'}
              </div>
            </div>

            {/* DTMF Keypad */}
            <div className="phone-keypad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  disabled={!callActive || loading}
                  onClick={() => handleSendDtmf(digit)}
                  className="keypad-btn"
                  style={{
                    opacity: !callActive ? 0.4 : 1,
                    cursor: callActive ? 'pointer' : 'not-allowed',
                  }}
                >
                  <span>{digit}</span>
                </button>
              ))}

              {/* Call Controls */}
              {!callActive ? (
                <button
                  type="button"
                  onClick={handleStartCall}
                  style={{ gridColumn: 'span 3', background: '#15803d', color: '#fff', border: 'none', borderRadius: '20px', height: '46px', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}
                >
                  📞 CALL VILLAGIO (START IVR)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEndCall}
                  style={{ gridColumn: 'span 3', background: '#991b1b', color: '#fff', border: 'none', borderRadius: '20px', height: '46px', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}
                >
                  🔴 HANG UP CALL
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Configuration & Voice Transcript Inspector */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#184037] mb-4">
              🎙️ Voice Call Settings
            </h3>

            <div className="mb-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Calling Phone Number</label>
              <input
                type="tel"
                className={inputClass}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Preset Demo Farmers:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {presetPhones.map((p) => (
                  <button
                    key={p.phone}
                    type="button"
                    onClick={() => setPhoneNumber(p.phone)}
                    className="bg-slate-50 border border-slate-200 hover:border-[#184037] p-2.5 rounded-lg text-left transition-colors"
                  >
                    <strong className="text-xs text-slate-800 block">{p.label}</strong>
                    <div className="text-[11px] text-slate-500 font-mono">{p.phone}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2.5 mt-3">
              <input
                type="checkbox"
                id="audioOpt"
                checked={audioEnabled}
                onChange={(e) => setAudioEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#ed7423]"
              />
              <label htmlFor="audioOpt" className="text-xs text-slate-700 cursor-pointer font-medium">
                🔊 Enable Browser Speech Audio (Text-to-Speech)
              </label>
            </div>
          </div>

          {/* Full Interactive Transcript */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#184037] mb-3">
              📝 Voice Call Transcript
            </h3>
            {transcript.length === 0 ? (
              <p className="text-xs text-slate-500">Start voice call above to see transcript.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto">
                {transcript.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg text-xs border ${
                      item.speaker === 'Farmer Keypad'
                        ? 'bg-sky-50 border-sky-200 self-end'
                        : 'bg-emerald-50 border-emerald-200 self-start'
                    }`}
                    style={{ maxWidth: '85%' }}
                  >
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                      {item.speaker}
                    </div>
                    <div className="text-slate-800">{item.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
