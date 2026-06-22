// Wraps every page — AIChat floats on all pages
import { Outlet } from 'react-router-dom';
import AIChat from './AIChat.jsx';
import { ChatProvider, useChat } from '../../context/ChatContext.jsx';

function LayoutContent() {
  const { isChatOpen, toggleChat } = useChat();
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
