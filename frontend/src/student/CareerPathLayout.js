import React from 'react';
import CareerPathNav from './CareerPathNav';

export function CareerPathLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans">
      <CareerPathNav />
      <main className="flex-1">
        {children}
      </main>
      <footer className="py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-400">
        CareerPath Academic Platform • Built for MCA Cohort • Seamless TalentAI Recruiter Integration
      </footer>
    </div>
  );
}

export default CareerPathLayout;
