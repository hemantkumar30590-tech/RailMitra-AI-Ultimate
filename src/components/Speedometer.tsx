import React from 'react';

export default function Speedometer({ speed }: { speed: number }) {
  // Gauge: 0-150 km/h, styled as modern arch
  const percentage = Math.min(Math.max((speed / 150) * 100, 0), 100);
  
  return (
    <div className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-3 font-mono">Speed</div>
      <div className="relative w-32 h-16 overflow-hidden">
        {/* Background Arc */}
        <div className="absolute top-0 left-0 w-32 h-32 rounded-full border-[8px] border-slate-100"></div>
        {/* Active Arc */}
        <div 
          className="absolute top-0 left-0 w-32 h-32 rounded-full transition-all duration-700 ease-out"
          style={{ 
             border: '8px solid transparent',
             borderTop: '8px solid #3b82f6',
             borderRight: '8px solid #3b82f6',
             transform: `rotate(${-45 + (percentage * 1.8)}deg)` 
          }}
        ></div>
      </div>
      <div className="text-3xl font-black text-slate-900 mt-2 font-mono tabular-nums">{Math.round(speed)}<span className="text-xs text-slate-400 font-normal ml-1">km/h</span></div>
    </div>
  );
}
