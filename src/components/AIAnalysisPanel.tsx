'use client';
import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  currency: string;
  month: string;
}

const SUGGESTIONS = [
  'What is the trend of my biggest expenses?',
  'What are the highest income sources?',
  'Where can I save money?',
  'What are the financial risks?',
  'Analyze my profitability',
];

export default function AIAnalysisPanel({ currency, month }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function printConversation() {
    const html = messages.map(m => `
      <div style="margin-bottom:16px; text-align:${m.role === 'user' ? 'right' : 'left'}">
        <strong style="font-size:11px; color:#6366f1">${m.role === 'user' ? 'Question' : 'AI'}</strong>
        <div style="margin-top:4px; white-space:pre-wrap; font-size:13px; line-height:1.6">${m.content}</div>
      </div>
    `).join('<hr style="border:none;border-top:1px solid #e5e7eb;margin:12px 0"/>');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.documentElement.innerHTML = `
      <html><head><title>Financial AI Report</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;color:#111}@media print{body{padding:16px}}</style>
      </head><body><h2 style="margin-bottom:24px">Financial AI Analysis Report</h2>${html}</body></html>
    `;
    win.print();
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(text?: string) {
    const question = (text ?? input).trim();
    if (!question || streaming) return;

    const userMsg: Message = { role: 'user', content: question };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency, month, messages: newMessages }),
      });

      if (!res.ok || !res.body) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: 'Error receiving AI response' };
          return updated;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Connection error' };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="card flex flex-col" style={{ height: '480px' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <h3 className="text-sm font-semibold text-gray-700">Financial AI Chat</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Claude</span>
          {messages.length > 0 && (
            <>
              <button onClick={printConversation}
                className="text-xs text-gray-400 hover:text-indigo-600 transition-colors px-1">
                🖨️ Print
              </button>
              <button onClick={() => setMessages([])}
                className="text-xs text-gray-400 hover:text-rose-500 transition-colors px-1">
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {messages.length === 0 && (
          <div className="flex flex-col gap-3 h-full justify-center">
            <p className="text-xs text-gray-400 text-center">Ask me anything about your financial data</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
              ${m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
              {m.content}
              {m.role === 'assistant' && streaming && i === messages.length - 1 && m.content === '' && (
                <span className="flex gap-1 py-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
              {m.role === 'assistant' && streaming && i === messages.length - 1 && m.content !== '' && (
                <span className="inline-block w-1.5 h-3.5 bg-indigo-500 animate-pulse ms-0.5 align-middle rounded-sm" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 px-4 py-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask a question about your data..."
            disabled={streaming}
            dir="auto"
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
          />
          <button onClick={() => send()} disabled={!input.trim() || streaming}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors whitespace-nowrap">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
