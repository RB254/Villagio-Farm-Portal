import React, { useState } from 'react';
import { api } from '../../services/api';

export const UssdSimulatorPage: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('0711000002'); // Farmer B default
  const [ussdCode, setUssdCode] = useState('*384*100#');
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [screenText, setScreenText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [history, setHistory] = useState<Array<{ from: 'user' | 'network'; text: string }>>([]);
  const [loading, setLoading] = useState(false);

  // Quick fill phone numbers
  const presetPhones = [
    { label: 'Farmer A (Alice)', phone: '0711000001' },
    { label: 'Farmer B (Bernard)', phone: '0711000002' },
    { label: 'Farmer C (Caroline)', phone: '0711000003' },
    { label: 'Farmer D (David)', phone: '0711000004' },
  ];

  const handleStartSession = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber) return;

    const newSessionId = `USSD-SIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    setSessionId(newSessionId);
    setHistory([]);
    setLoading(true);

    const res = await api.sendUssdJson(newSessionId, phoneNumber, '');
    if (res.success && res.data) {
      setScreenText(res.data.text);
      setSessionActive(res.data.continueSession);
      setHistory([{ from: 'network', text: res.data.text }]);
    } else {
      setScreenText('Connection error. Could not reach USSD gateway.');
      setSessionActive(false);
    }
    setLoading(false);
  };

  const handleSendInput = async (inputVal?: string) => {
    const textToSend = inputVal !== undefined ? inputVal : userInput;
    if (!textToSend.trim() || !sessionActive) return;

    setUserInput('');
    setLoading(true);
    setHistory((prev) => [...prev, { from: 'user', text: textToSend }]);

    const res = await api.sendUssdJson(sessionId, phoneNumber, textToSend);

    if (res.success && res.data) {
      setScreenText(res.data.text);
      setSessionActive(res.data.continueSession);
      setHistory((prev) => [...prev, { from: 'network', text: res.data.text }]);
    } else {
      setScreenText('Session timed out or error occurred.');
      setSessionActive(false);
    }
    setLoading(false);
  };

  const handleKeypadPress = (digit: string) => {
    if (!sessionActive) {
      setUssdCode((prev) => prev + digit);
    } else {
      setUserInput((prev) => prev + digit);
    }
  };

  const inputClass = "w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-sm rounded-lg pl-4 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:border-[#ed7423] focus:ring-1 focus:ring-[#ed7423] transition-colors";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#184037] tracking-tight">📟 USSD Terminal Simulator</h1>
        <p className="text-xs text-slate-500 mt-1">
          Simulates live feature-phone USSD session (*384*100#). Calls real backend integration and writes to the unified database with <code className="bg-slate-100 px-1 py-0.5 rounded text-[#184037] font-mono">source_channel: 'USSD'</code>.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px', alignItems: 'start' }}>
        {/* Phone Mockup Frame */}
        <div className="phone-simulator-container">
          <div className="phone-mockup">
            {/* Top speaker notch */}
            <div style={{ height: '24px', background: '#1f2937', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '48px', height: '4px', background: '#374151', borderRadius: '2px' }} />
            </div>

            {/* Retro / Monospace Green LCD Screen */}
            <div className="phone-screen">
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #065f46', paddingBottom: '4px', marginBottom: '8px', fontSize: '0.7rem' }}>
                <span>SAFARICOM 4G</span>
                <span>{sessionActive ? 'SESSION ACTIVE' : 'IDLE'}</span>
              </div>

              {/* Main Screen Content */}
              {!sessionId ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📞</div>
                  <p style={{ color: '#6ee7b7', fontSize: '0.85rem' }}>Dial {ussdCode}</p>
                  <p style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '4px' }}>Press "SEND" below to start</p>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', whiteSpace: 'pre-wrap', fontSize: '0.85rem', lineHeight: '1.4' }}>
                  {screenText}
                </div>
              )}

              {/* In-Screen Input Bar */}
              {sessionActive && (
                <div style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #065f46' }}>
                  <form onSubmit={(e) => { e.preventDefault(); handleSendInput(); }} style={{ display: 'flex', gap: '4px' }}>
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Type option..."
                      style={{
                        flex: 1,
                        background: '#022c22',
                        border: '1px solid #10b981',
                        color: '#86efac',
                        padding: '6px 8px',
                        fontFamily: 'monospace',
                        outline: 'none',
                        borderRadius: '4px',
                      }}
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={loading || !userInput.trim()}
                      style={{
                        background: '#059669',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '6px 12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      OK
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Physical Phone Keypad */}
            <div className="phone-keypad">
              {[
                { d: '1', s: '.,' },
                { d: '2', s: 'ABC' },
                { d: '3', s: 'DEF' },
                { d: '4', s: 'GHI' },
                { d: '5', s: 'JKL' },
                { d: '6', s: 'MNO' },
                { d: '7', s: 'PQRS' },
                { d: '8', s: 'TUV' },
                { d: '9', s: 'WXYZ' },
                { d: '*', s: 'MENU' },
                { d: '0', s: '+' },
                { d: '#', s: 'ENTER' },
              ].map((k) => (
                <button
                  key={k.d}
                  type="button"
                  onClick={() => handleKeypadPress(k.d)}
                  className="keypad-btn"
                >
                  <span>{k.d}</span>
                  <span className="keypad-sub">{k.s}</span>
                </button>
              ))}

              {/* Action Buttons */}
              <button
                type="button"
                onClick={() => (sessionActive ? handleSendInput() : handleStartSession())}
                style={{ gridColumn: 'span 2', background: '#15803d', color: '#fff', border: 'none', borderRadius: '20px', height: '44px', fontWeight: 800, cursor: 'pointer' }}
              >
                {sessionActive ? 'SEND INPUT ➔' : 'DIAL USSD (CALL)'}
              </button>

              <button
                type="button"
                onClick={() => { setSessionActive(false); setSessionId(''); setScreenText(''); }}
                style={{ background: '#991b1b', color: '#fff', border: 'none', borderRadius: '20px', height: '44px', fontWeight: 800, cursor: 'pointer' }}
              >
                END
              </button>
            </div>
          </div>
        </div>

        {/* Configuration & Session Inspector */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#184037] mb-4">
              ⚙️ Simulator Parameters
            </h3>

            <div className="mb-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Simulated Phone Number</label>
              <input
                type="tel"
                className={inputClass}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0711000002"
              />
            </div>

            <div className="mb-4">
              <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Quick Load Registered Farmer:
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

            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Service Code</label>
              <input
                type="text"
                className={inputClass}
                value={ussdCode}
                onChange={(e) => setUssdCode(e.target.value)}
              />
            </div>

            <button
              onClick={() => handleStartSession()}
              disabled={loading}
              className="w-full bg-[#184037] text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-[#23594e] transition-colors shadow-sm disabled:opacity-50"
            >
              🚀 Start Fresh USSD Session
            </button>
          </div>

          {/* Session Interaction Transcript Log */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#184037] mb-3">
              📜 Interactive Session Transcript
            </h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-500">Dial USSD above to start logging transcript.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto">
                {history.map((h, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg text-xs border ${
                      h.from === 'user'
                        ? 'bg-sky-50 border-sky-200 self-end'
                        : 'bg-emerald-50 border-emerald-200 self-start'
                    }`}
                    style={{ maxWidth: '85%' }}
                  >
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                      {h.from === 'user' ? 'FARMER KEYPAD INPUT' : 'VILLAGIO USSD RESPONSE'}
                    </div>
                    <pre className="whitespace-pre-wrap font-sans m-0 text-slate-800">
                      {h.text}
                    </pre>
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
