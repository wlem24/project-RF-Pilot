import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { rfpApi } from '../../services/api.js';

// Active RFP persists across navigation/refresh — written by UploadRFPPage.jsx
// (right after upload) and DetailPage.jsx (when an existing RFP is opened).
const ACTIVE_RFP_KEY = 'rfpilot_active_rfp';

function readActiveRfp() {
    try {
        return JSON.parse(localStorage.getItem(ACTIVE_RFP_KEY) || 'null');
    } catch {
        return null;
    }
}

function greetingFor(rfp) {
    return rfp
        ? `I've analyzed the uploaded RFP${rfp.filename ? ` "${rfp.filename}"` : ''}. How can I help you with requirements analysis, compliance checks, summarization, or proposal preparation?`
        : 'No RFP loaded yet. Upload or open an RFP to get started.';
}

// Greeting messages are tagged so we can always find-and-replace the single
// active greeting, regardless of how many times the active RFP has changed
// before it (uploading a 2nd/3rd RFP, opening a different RFP, etc).
function greetingMessage(rfp) {
    return { role: 'ai', text: greetingFor(rfp), isGreeting: true };
}

export default function AIChat({ isOpen, onToggle }) {
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const urlRfpId = searchParams.get('id');

    const [activeRfp, setActiveRfp] = useState(readActiveRfp);
    const rfpId = urlRfpId || activeRfp?.id || null;
    // Each browser tab gets its own session so chat history stays scoped
    const sessionId = useRef(`session-${Date.now()}`).current;

    const [messages, setMessages] = useState(() => [greetingMessage(activeRfp)]);
    const [inputVal, setInputVal] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Re-check the active RFP on every navigation (e.g. right after an upload
    // navigates to /detail?id=X) and greet the user as soon as it changes.
    useEffect(() => {
        const stored = readActiveRfp();
        const storedId = stored?.id != null ? String(stored.id) : null;
        const currentId = activeRfp?.id != null ? String(activeRfp.id) : null;
        if (storedId && storedId !== currentId) {
            setActiveRfp(stored);
            // Drop the previous greeting (whatever it was — the initial "no
            // RFP" placeholder, or a prior RFP's greeting) and append exactly
            // one fresh greeting for the newly active RFP. Filtering by
            // `isGreeting` rather than position means this is correct no
            // matter how many times the active RFP has already changed, and
            // is naturally idempotent if this effect ever runs twice for the
            // same transition (e.g. React Strict Mode's double-invoke).
            setMessages((prev) => [
                ...prev.filter((m) => !m.isGreeting),
                greetingMessage(stored),
            ]);
        }
    }, [location, urlRfpId]);


    // داخل دالة sendMsg في AIChat.jsx
    //---------------------------------------------------------------------------------------------
    async function sendMsg() {
        const val = inputVal.trim();
        if (!val || isLoading) return;

        setMessages((prev) => [...prev, { role: 'user', text: val }]);
        setInputVal('');
        setIsLoading(true);

        try {
            const response = await rfpApi.chat(rfpId, val, sessionId);
            const reply = response.data.answer;
            setMessages((prev) => [...prev, { role: 'ai', text: reply }]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [...prev, { role: 'ai', text: 'Unable to fetch a response. Please try again.' }]);
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