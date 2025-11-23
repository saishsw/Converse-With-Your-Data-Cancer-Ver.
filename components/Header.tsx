import React from 'react';
import { Database, Activity, GitBranch } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <Activity className="w-7 h-7 text-white" fill="currentColor" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-800 leading-none tracking-tight">Converse With Your Data</h1>
            <p className="text-xs text-stone-500 font-medium mt-1.5 uppercase tracking-wider">Analytics Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full border border-stone-200 shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
            <span className="text-xs font-bold text-stone-600">System Operational</span>
          </div>
          <a href="#" className="hidden sm:flex items-center gap-2 text-sm font-semibold text-stone-400 hover:text-orange-600 transition-colors">
            <GitBranch className="w-4 h-4" />
            <span>v2.1.0</span>
          </a>
        </div>
      </div>
    </header>
  );
};