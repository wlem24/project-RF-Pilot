import React, { useState, useRef, useEffect } from 'react';

export default function AIChat({ isOpen, onToggle }) {
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hello! How can I assist you today?' },
    ]);
    const [inputVal, setInputVal] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    // داخل دالة sendMsg في AIChat.jsx
    //---------------------------------------------------------------------------------------------
    async function sendMsg() {
        const val = inputVal.trim();
        if (!val || isLoading) return;

        setMessages((prev) => [...prev, { role: 'user', text: val }]);
        setInputVal('');
        setIsLoading(true);

        // تجهيز البيانات (FormData  إرسال ملفات مستقبلاً)
        const formData = new FormData();
        formData.append('prompt', val);

        try {
            const response = await fetch('http://127.0.0.1:8000/bot/chat', {
                method: 'POST',
                body: formData // إرسال للـ FastAPI الخاص بك
            });

            const data = await response.json();
            setMessages((prev) => [...prev, { role: 'ai', text: data.reply }]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }
    //-------------------------------------------------------------------------------------------

    function handleKeyDown(e) {
        if (e.key === 'Enter') sendMsg();
    }
    //----------------------------------------------------------------------------------------------
    return (
        <>
            <button className="chat-fab" onClick={onToggle}>
                <i className="ti ti-message-circle" />
            </button>

            <div className={`chat-window${isOpen ? ' open' : ''}`}>
                <div className="chat-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="ti ti-robot" style={{ color: '#fff', fontSize: 14 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>RFPilot AI</div>
                            <div style={{ fontSize: 10, color: 'var(--green)' }}>● Online</div>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onToggle}>✕</button>
                </div>

                <div className="chat-messages">
                    {messages.map((msg, i) => (
                        <div key={i} className={`msg ${msg.role === 'ai' ? 'msg-ai' : 'msg-user'}`}>
                            {msg.text}
                        </div>
                    ))}
                    {isLoading && <div className="msg msg-ai">Thinking...</div>}
                    <div ref={messagesEndRef} />
                </div>

                <div className="chat-input-row">
                    <input
                        className="chat-input"
                        placeholder="Type your question..."
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