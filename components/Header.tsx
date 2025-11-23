import React from 'react';
import { Database, Activity, GitBranch } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">Converse With Your Data</h1>
            <p className="text-xs text-slate-500 font-medium mt-1">Analytics Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-semibold text-slate-600">System Operational</span>
          </div>
          <a href="#" className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
            <GitBranch className="w-4 h-4" />
            <span>v2.1.0</span>
          </a>
        </div>
      </div>
    </header>
  );
};