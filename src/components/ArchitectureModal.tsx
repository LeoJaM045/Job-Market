import React from 'react';
import { X, Layers, Database, Cpu, Radio, BrainCircuit, Monitor } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const pipelineSteps = [
    {
      step: '01',
      title: 'Raw Multi-Portal Ingestion',
      tech: 'HDFS / Hadoop Data Lake',
      icon: <Database className="w-5 h-5 text-sky-400" />,
      desc: 'Raw job postings scraped from Indian tech job portals (Naukri, LinkedIn India, corporate careers) landed as compressed JSON in HDFS.',
    },
    {
      step: '02',
      title: 'PySpark Normalization & Tokenization',
      tech: 'Apache Spark / PySpark',
      icon: <Cpu className="w-5 h-5 text-amber-400" />,
      desc: 'Standardizes Indian city locations (Bengaluru, Hyderabad, Pune, etc.), cleans duplicate entries, and tokenizes technology skill sets.',
    },
    {
      step: '03',
      title: 'Consultancy Scam Defense & Surge Tracking',
      tech: 'Kafka · Bloom Filter · DGIM',
      icon: <Radio className="w-5 h-5 text-rose-400" />,
      desc: 'Bloom Filter intercepts fake training-and-placement consultancy spam; DGIM tracks sudden surges in tech demand (GenAI, PySpark) in O(log² N) memory.',
    },
    {
      step: '04',
      title: 'Indian CTC Bracket Modeling',
      tech: 'Spark MLlib Pipeline',
      icon: <BrainCircuit className="w-5 h-5 text-purple-400" />,
      desc: 'VectorAssembler and RandomForestClassifier classifying Indian salary brackets: Low (< ₹6 LPA), Medium (₹6 - ₹18 LPA), High (> ₹18 LPA).',
    },
    {
      step: '05',
      title: 'Serving & Document Persistence',
      tech: "MongoDB ('indian_job_intelligence_db')",
      icon: <Layers className="w-5 h-5 text-emerald-400" />,
      desc: 'Persists processed analytics, tech hub aggregations, and streaming time-series snapshots with sub-10ms query access.',
    },
    {
      step: '06',
      title: 'Decision Support & Streamlit UI',
      tech: 'Streamlit Presentation (app.py)',
      icon: <Monitor className="w-5 h-5 text-blue-400" />,
      desc: 'Executive summary KPI cards, skill co-occurrence heatmaps, real-time DGIM/Bloom simulation controls, and ML CTC predictor.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                End-to-End Big Data Architecture (Indian Tech Ecosystem)
              </h2>
              <p className="text-xs text-slate-400">
                Distributed data flow from HDFS raw storage to Streamlit presentation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pipelineSteps.map((s) => (
              <div
                key={s.step}
                className="p-4 rounded-lg bg-slate-900 border border-slate-800/90 space-y-2 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {s.icon}
                    <span className="text-xs font-semibold text-slate-200">
                      {s.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    STEP {s.step}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-sky-400">
                  {s.tech}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <div className="font-semibold text-slate-200 mb-1">
              Data Flow Verification Invariant
            </div>
            Streamlit connects via PyMongo with <code className="text-sky-300">@st.cache_resource</code> pooling. If MongoDB is offline, the embedded synthetic Indian IT dataset activates automatically without interrupting user workflows.
          </div>
        </div>
      </div>
    </div>
  );
};
