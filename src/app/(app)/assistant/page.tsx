'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/useAuth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

const SUGGESTIONS = [
  'What does my hemoglobin level mean?',
  'Why is my energy low?',
  'What systems does Metformin affect?',
  'How can I improve my sleep?',
  'What does my HbA1c result mean?',
];

export default function AssistantPage() {
  const { profile, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [noKey, setNoKey] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchHistory = useCallback(async () => {
    if (!profile || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chat?profileId=${profile.id}`, {
        headers: { authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.data) setMessages(json.data);
    } finally { setLoading(false); }
  }, [profile, token]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || !profile || !token || sending) return;
    setInput('');
    setSending(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ profileId: profile.id, message: msg, language }),
      });
      const json = await res.json();
      if (res.status === 503) {
        setNoKey(true);
        setMessages((prev) => [...prev, {
          id: Date.now().toString() + '_err',
          role: 'assistant',
          content: '⚠️ AI service not configured. Add your ANTHROPIC_API_KEY to the .env file to enable the assistant.',
          createdAt: new Date().toISOString(),
        }]);
        return;
      }
      if (json.data?.response) {
        setMessages((prev) => [...prev, {
          id: Date.now().toString() + '_ai',
          role: 'assistant',
          content: json.data.response,
          createdAt: new Date().toISOString(),
        }]);
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now().toString() + '_err',
        role: 'assistant',
        content: '❌ Failed to get a response. Please try again.',
        createdAt: new Date().toISOString(),
      }]);
    } finally {
      setSending(false);
    }
  };

  const formatContent = (text: string) => {
    // Simple markdown-like rendering
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**')) {
          return <p key={i} className="font-semibold text-white mt-1">{line.slice(2, -2)}</p>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="ml-3 text-slate-300">{line.slice(2)}</li>;
        }
        if (line === '') return <br key={i} />;
        // Bold within text
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="text-slate-300">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j} className="text-white">{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        );
      });
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 px-4 md:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">AI Health Assistant</h1>
          <p className="text-xs text-slate-500">Grounded in your health data · Not a diagnosis</p>
        </div>
        <select
          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
        </select>
      </div>

      {noKey && (
        <div className="flex-shrink-0 mx-4 mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2 text-amber-400 text-xs">
          Add <code className="bg-slate-800 px-1 rounded">GEMINI_API_KEY</code> to your <code className="bg-slate-800 px-1 rounded">.env</code> file and restart the server.
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex-shrink-0 mx-4 md:mx-6 mt-3">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-500 flex items-center gap-2">
          <span>⚕️</span>
          <span>This is health information, not a medical diagnosis. Always consult a qualified healthcare professional.</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4">
        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading chat history…</div>
        ) : messages.length === 0 ? (
          <div className="max-w-lg mx-auto text-center pt-8">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-slate-400 text-sm mb-6">Ask anything about your health, symptoms, or medications. I'll answer based on your health twin's data.</p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="block w-full text-left px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-teal-600/30 text-teal-50 rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm'}`}>
                  {msg.role === 'assistant' ? (
                    <div className="space-y-0.5">{formatContent(msg.content)}</div>
                  ) : (
                    msg.content
                  )}
                  <p className="text-xs opacity-40 mt-1 text-right">
                    {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl px-4 py-3 text-slate-400 text-sm">
                  <span className="animate-pulse">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 md:px-6 pb-4">
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Ask about symptoms, medicines, lab values…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />
          <button type="submit" className="btn-primary px-4" disabled={sending || !input.trim()}>
            {sending ? '…' : '→'}
          </button>
        </form>
      </div>
    </div>
  );
}
