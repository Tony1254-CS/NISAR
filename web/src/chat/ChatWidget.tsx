import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '../state/store';
import { classifyIntent, getSuggestedQuestions } from './intents';
import { generateResponse, type ChatResponse, type ChatSource } from './responses';
import '../styles/chat.css';

interface Message {
  id: number;
  role: 'user' | 'ai';
  text: string;
  sources?: ChatSource[];
  mapAction?: ChatResponse['mapAction'];
}

// Simple markdown-like bold renderer
function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function MessageBubble({ msg }: { msg: Message }) {
  const [showSources, setShowSources] = useState(false);

  return (
    <div className={`chat-msg chat-msg--${msg.role}`}>
      <div>
        {msg.text.split('\n').map((line, i) => (
          <span key={i}>
            {renderText(line)}
            {i < msg.text.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>

      {msg.sources && msg.sources.length > 0 && (
        <>
          <div
            onClick={() => setShowSources(!showSources)}
            style={{ fontSize: '0.6rem', color: 'var(--water)', cursor: 'pointer', marginTop: 6, opacity: 0.8 }}
          >
            📎 {showSources ? 'Hide' : 'Show'} sources ({msg.sources.length})
          </div>
          {showSources && (
            <div className="chat-sources">
              {msg.sources.map((s, i) => (
                <span key={i} className="chat-source-chip">
                  {s.file} → {s.field}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="chat-typing">
      <div className="chat-typing-dot" />
      <div className="chat-typing-dot" />
      <div className="chat-typing-dot" />
    </div>
  );
}

export function ChatWidget() {
  const { reach, manifest, qc, stage, erosion, accretion } = useStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [chips, setChips] = useState<string[]>(getSuggestedQuestions('general'));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idCounter = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Send initial greeting when first opened
  useEffect(() => {
    if (open && messages.length === 0) {
      const intent = classifyIntent('hello');
      const response = generateResponse(intent, { reach, manifest, qc, stage, erosion, accretion });
      setMessages([{
        id: idCounter.current++,
        role: 'ai',
        text: response.text,
        sources: response.sources,
      }]);
      if (response.followUp) setChips(response.followUp);
    }
  }, [open]);

  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: idCounter.current++,
      role: 'user',
      text: text.trim(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    // Simulate AI "thinking" delay (makes it feel real)
    const delay = 600 + Math.random() * 800;
    setTimeout(() => {
      const intent = classifyIntent(text);
      const response = generateResponse(intent, { reach, manifest, qc, stage, erosion, accretion });

      const aiMsg: Message = {
        id: idCounter.current++,
        role: 'ai',
        text: response.text,
        sources: response.sources,
        mapAction: response.mapAction,
      };

      setMessages(prev => [...prev, aiMsg]);
      setTyping(false);

      // Update suggested chips
      if (response.followUp) {
        setChips(response.followUp);
      } else {
        setChips(getSuggestedQuestions('general'));
      }

      // Execute map action if any
      if (response.mapAction) {
        // Dispatch a custom event that the map can listen to
        window.dispatchEvent(new CustomEvent('chat-map-action', {
          detail: response.mapAction,
        }));
      }
    }, delay);
  }, [reach, manifest, qc, stage, erosion, accretion]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <button className="chat-fab" onClick={() => setOpen(true)} title="Ask the AI Assistant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-avatar">🛰️</div>
            <div className="chat-header-info">
              <div className="chat-header-name">River Intelligence</div>
              <div className="chat-header-status">Online — {reach?.name ?? 'Loading...'}</div>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)}>×</button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map(msg => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {typing && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Chips */}
          {chips.length > 0 && !typing && (
            <div className="chat-chips">
              {chips.map((chip, i) => (
                <button key={i} className="chat-chip" onClick={() => handleSend(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="chat-input-area">
            <input
              ref={inputRef}
              className="chat-input"
              placeholder="Ask about this river..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={typing}
            />
            <button
              className="chat-send"
              onClick={() => handleSend(input)}
              disabled={typing || !input.trim()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
