import React from 'react';
import { FileCode, Layers, Activity } from 'lucide-react';

interface HeaderProps {
  onOpenSourceModal: () => void;
  onOpenArchModal: () => void;
  totalFiltered: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSourceModal,
  onOpenArchModal,
  totalFiltered,
}) => {
  return (
    <header className="h-16 px-6 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      {/* Zone 1: Brand title wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <span className="font-semibold text-slate-100 tracking-tight text-base">
            Indian Job Market Trends & Hiring Intelligence
          </span>
          <span className="hidden sm:inline-block ml-3 text-xs text-slate-400 font-mono">
            Bengaluru · Hyderabad · Pune · ₹ LPA
          </span>
        </div>
      </div>

      {/* Zone 2: System Telemetry / Unboxed metadata */}
      <div className="hidden lg:flex items-center gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">Indian Tech Stream Active</span>
        </div>
        <span className="text-slate-700">|</span>
        <span className="font-mono tabular-nums text-sky-400 font-medium">
          {totalFiltered.toLocaleString()}
        </span>
        <span>Requisitions Indexed</span>
      </div>

      {/* Zone 3: Primary Action Controls */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onOpenArchModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
          title="View End-to-End Big Data Architecture"
        >
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>Pipeline Architecture</span>
        </button>

        <button
          onClick={onOpenSourceModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-md transition-colors shadow-sm"
          title="Inspect & Download complete app.py for Streamlit"
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Get Streamlit app.py</span>
        </button>
      </div>
    </header>
  );
};
