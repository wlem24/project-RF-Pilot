// Wraps every page — AIChat floats on all pages
import { useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import AIChat from './AIChat.jsx';
import { ChatProvider, useChat } from '../../context/ChatContext.jsx';
import { useNotificationStream } from '../../hooks/useNotificationStream.js';

function LayoutContent() {
  const { isChatOpen, toggleChat } = useChat();

  // Handle SSE events — currently triggers a page-level storage event
  // so any polling component (RightSidebar, RightPanel) can react.
  const handleStreamEvent = useCallback((data) => {
    // Dispatch a custom event that sidebar/dashboard listeners can pick up
    window.dispatchEvent(new CustomEvent('rfpilot:notification', { detail: data }));
  }, []);

  useNotificationStream(handleStreamEvent);

  return (
    <>
      <Outlet />
      <AIChat isOpen={isChatOpen} onToggle={toggleChat} />
    </>
  );
}

export default function Layout() {
  return (
    <ChatProvider>
      <LayoutContent />
    </ChatProvider>
  );
}
