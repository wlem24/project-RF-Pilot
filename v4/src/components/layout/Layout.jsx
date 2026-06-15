// Wraps every page — AIChat floats on all pages
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AIChat from './AIChat.jsx';

export default function Layout() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>

      <Outlet />

      <AIChat isOpen={chatOpen} onToggle={() => setChatOpen(o => !o)} />
    </>
  );
}