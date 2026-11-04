import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { GlobalSearchModal } from './GlobalSearchModal';
import { AuthModal } from '../common/AuthModal';

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-50 text-slate-800">
      {/* Persistent Navigation Sidebar */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navigation */}
        <TopNav onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        {/* Dynamic Module Workspace - Non-scrolling shell with independent panel scrolling */}
        <main className="flex-1 overflow-hidden relative p-3 md:p-4 bg-slate-100/60">
          {children}
        </main>
      </div>

      {/* Global Command Center Search Modal */}
      <GlobalSearchModal />

      {/* Supabase Authentication Modal */}
      <AuthModal />
    </div>
  );
};
