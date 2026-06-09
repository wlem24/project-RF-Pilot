import React, { useState, useRef, useEffect } from 'react';

export default function AIChat({ isOpen, onToggle }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'مرحباً! كيف أقدر أساعدك؟' },
  ]);
  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function sendMsg() {
    const val = inputVal.trim();
    if (!val) return;

    setMessages((prev) => [...prev, { role: 'user', text: val }]);
    setInputVal('');

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'ai', text: 'جاري تحليل سؤالك...' }]);
    }, 600);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') sendMsg();
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        className="chat-fab"
        aria-label="Open AI chat"
        onClick={onToggle}
      >
        <i className="ti ti-message-circle" style={{ color: '#fff', fontSize: 20 }} />
      </button>

      {/* Chat Window */}
      <div className={`chat-window${isOpen ? ' open' : ''}`}>

        {/* Header */}
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <i className="ti ti-robot" style={{ color: '#fff', fontSize: 14 }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>RFPilot. AI</div>
              <div style={{ fontSize: 10, color: 'var(--green)' }}>● Online</div>
            </div>
          </div>
          <button className="close-btn" aria-label="Close" onClick={onToggle}>✕</button>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`msg ${msg.role === 'ai' ? 'msg-ai' : 'msg-user'}`}>
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Row */}
        <div className="chat-input-row">
          <input
            className="chat-input"
            placeholder="اكتب سؤالك..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button className="chat-send" onClick={sendMsg}>
            <i className="ti ti-send" />
          </button>
        </div>

      </div>
    </>
  );
}
