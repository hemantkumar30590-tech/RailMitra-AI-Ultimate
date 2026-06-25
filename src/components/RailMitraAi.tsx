import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Loader2, X } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  intent?: string;
  entities?: Record<string, string>;
}

interface RailMitraAiProps {
  onAction: (intent: string, entities: Record<string, string>) => void;
  onClose?: () => void;
}

export default function RailMitraAi({ onAction, onClose }: RailMitraAiProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message in Hinglish/Hindi
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        type: 'bot',
        text: 'Namaste! Main RailMitra AI hoon. Main railway se judi jankari (Live status, PNR status, Station departures) ke sath-sath aapke har ek sawal ka jawab de sakta hoon! Mujhse kuch bhi poochein.',
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessageId = Date.now().toString();
    
    setMessages(prev => [...prev, {
      id: newMessageId,
      type: 'user',
      text: userMessage
    }]);
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API error');
      }
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        text: data.reply || 'Mujhe samajh nahi aaya. Kripya fir se batayein.',
        intent: data.intent,
        entities: data.entities
      }]);

      if (data.intent && data.intent !== 'GENERAL_RAILWAY_QUERY' && data.intent !== 'GENERAL_QUERY' && data.intent !== 'UNKNOWN') {
        // Auto-trigger appropriate UI action
        setTimeout(() => {
          onAction(data.intent, data.entities || {});
        }, 1500);
      }
      
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'bot',
        text: 'System mein kuch issue hai, kripya thodi der baad try karein.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] w-full bg-gradient-to-b from-[#151a30] to-[#0d1326] rounded-3xl border border-cyan-500/20 overflow-hidden shadow-2xl relative">
      {/* Glossy top reflection */}
      <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/5 to-transparent pointer-events-none z-0"></div>

      <div className="bg-gradient-to-r from-[#0d152b] to-[#060c1d] p-4 text-cyan-400 flex items-center justify-between shrink-0 border-b border-cyan-500/10 relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-950/60 p-2 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Bot size={24} className="text-cyan-400 drop-shadow-[0_0_5px_#22d3ee]" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg leading-tight tracking-wide text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">RailMitra AI</h2>
            <p className="text-teal-500 text-xs font-bold uppercase tracking-wider">Aapka Smart Assistant</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2.5 bg-cyan-950/40 hover:bg-cyan-900/60 hover:text-cyan-300 rounded-xl transition-colors border border-cyan-800/40">
            <X size={18} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-[#080d1a] flex flex-col gap-4 relative z-10 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 max-w-[88%] ${msg.type === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.type === 'user' ? 'bg-cyan-950 border border-cyan-800 text-cyan-400' : 'bg-teal-950 border border-teal-800 text-teal-400'}`}>
              {msg.type === 'user' ? <User size={15} /> : <Bot size={15} />}
            </div>
            <div className={`p-3.5 rounded-2xl text-sm shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${msg.type === 'user' ? 'bg-cyan-950/60 border border-cyan-500/30 text-cyan-100 rounded-tr-none' : 'bg-[#0a1424] border border-teal-500/20 text-teal-200 rounded-tl-none'}`}>
              <p className="leading-relaxed font-medium">{msg.text}</p>
              {msg.intent && msg.intent !== 'GENERAL_RAILWAY_QUERY' && msg.intent !== 'GENERAL_QUERY' && msg.intent !== 'UNKNOWN' && (
                <div className="mt-2 text-[10px] bg-cyan-950 border border-cyan-800/60 text-cyan-400 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1 font-mono tracking-wider font-bold">
                  Intent: {msg.intent}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
             <div className="shrink-0 w-8 h-8 rounded-full bg-teal-950 border border-teal-800 text-teal-400 flex items-center justify-center">
              <Bot size={15} />
            </div>
            <div className="p-4 bg-[#0a1424] border border-teal-500/20 rounded-2xl rounded-tl-none shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex items-center gap-3.5 text-teal-400 font-medium">
              <Loader2 size={16} className="animate-spin text-cyan-400" /> 
              <span>Soch raha hoon...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-gradient-to-t from-[#060a14] to-[#0a0f1d] border-t border-cyan-500/10 shrink-0 relative z-10">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 p-1 rounded-2xl shadow-3d-inset bg-[#060a14] border border-cyan-950">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (Railway query, casual chat, etc)..." 
              className="w-full bg-transparent border-none text-teal-300 placeholder-teal-700/60 px-4 py-2 text-sm outline-none font-semibold"
              disabled={isLoading}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 w-11 flex items-center justify-center rounded-2xl shadow-3d-button transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            <Send size={18} className="drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]" />
          </button>
        </form>
      </div>
    </div>
  );
}
