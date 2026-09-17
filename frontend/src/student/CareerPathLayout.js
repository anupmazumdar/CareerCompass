import React from 'react';
import CareerPathNav from './CareerPathNav';
import { GraduationCap } from 'lucide-react';

export function CareerPathLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <CareerPathNav />
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-5 border-t border-slate-200 bg-white text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center">
            <GraduationCap size={11} className="text-white" />
          </div>
          <span>
            <strong className="text-slate-600">CareerCompass</strong> · Digital Career Platform for Students · 2025
          </span>
        </div>
      </footer>
    </div>
  );
}

export default CareerPathLayout;
