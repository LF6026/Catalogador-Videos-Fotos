import React, { ReactNode } from 'react';

interface StudioLayoutProps {
    sidebar: ReactNode;
    inspector: ReactNode;
    children: ReactNode; // Main Content (Grid)
}

export default function StudioLayout({ sidebar, inspector, children }: StudioLayoutProps) {
    return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-indigo-500/30">
            {/* Left Sidebar - Fixed Width */}
            <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-slate-900/50 flex flex-col">
                {sidebar}
            </aside>

            {/* Main Content - Flexible */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
                    {children}
                </div>
            </main>

            {/* Right Inspector - Fixed Width */}
            <aside className="w-80 flex-shrink-0 border-l border-slate-800 bg-slate-900/50 flex flex-col">
                {inspector}
            </aside>
        </div>
    );
}
