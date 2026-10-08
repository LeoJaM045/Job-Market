import React, { useState } from 'react';
import { X, Copy, Download, Check, Terminal, ExternalLink } from 'lucide-react';

interface SourceCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  appPyContent: string;
}

export const SourceCodeModal: React.FC<SourceCodeModalProps> = ({
  isOpen,
  onClose,
  appPyContent,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(appPyContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([appPyContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'app.py';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-mono text-xs font-bold">
              PY
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Streamlit Application Source (`app.py`)
              </h2>
              <p className="text-xs text-slate-400">
                Self-contained, production-ready Python 3.10+ script with PyMongo & fallback data
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium rounded-md transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Script'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-md transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download app.py</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CLI Instructions Bar */}
        <div className="px-6 py-3 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-sky-400" />
            <span>Run via shell:</span>
            <code className="text-sky-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              pip install streamlit pymongo plotly pandas numpy
            </code>
            <span className="text-slate-600">&&</span>
            <code className="text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              streamlit run app.py
            </code>
          </div>
          <span className="text-[11px] text-slate-500">
            {appPyContent.split('\n').length} lines · UTF-8
          </span>
        </div>

        {/* Code Content Viewport */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed select-text">
          <pre className="whitespace-pre">
            {appPyContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
