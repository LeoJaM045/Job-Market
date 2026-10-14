import React, { useState } from 'react';
import {
  Server,
  Layers,
  HardDrive,
  Radio,
  Cpu,
  Terminal,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Folder,
  FileCode,
  ArrowRight,
  Database,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';

interface HDFSFileItem {
  path: string;
  name: string;
  type: 'DIRECTORY' | 'FILE';
  length: number;
  owner: string;
  group: string;
  permission: string;
  replication: number;
  modificationTime: string;
  isSimulated: boolean;
}

export const BigDataInfraPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'topology' | 'hdfs' | 'spark' | 'kafka' | 'docker'>('topology');
  const [currentHdfsPath, setCurrentHdfsPath] = useState<string>('/jobs');
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyToClipboard = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // Mocked/Detected HDFS listings based on selected path
  const getHdfsListingForPath = (path: string): HDFSFileItem[] => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (path === '/' || path === '') {
      return [
        { path: '/jobs', name: 'jobs', type: 'DIRECTORY', length: 0, owner: 'hdfs', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
        { path: '/models', name: 'models', type: 'DIRECTORY', length: 0, owner: 'hdfs', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
      ];
    } else if (path === '/jobs') {
      return [
        { path: '/jobs/raw', name: 'raw', type: 'DIRECTORY', length: 0, owner: 'hdfs', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
        { path: '/jobs/clean', name: 'clean', type: 'DIRECTORY', length: 0, owner: 'hdfs', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
        { path: '/jobs/aggregates', name: 'aggregates', type: 'DIRECTORY', length: 0, owner: 'hdfs', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
      ];
    } else if (path === '/jobs/raw') {
      return [
        { path: '/jobs/raw/dt=2026-10-14', name: 'dt=2026-10-14', type: 'DIRECTORY', length: 0, owner: 'kafka-ingest', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
        { path: '/jobs/raw/dt=2026-10-13', name: 'dt=2026-10-13', type: 'DIRECTORY', length: 0, owner: 'kafka-ingest', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
      ];
    } else if (path.startsWith('/jobs/raw/dt=')) {
      return [
        { path: `${path}/job_in_blr_1042.json`, name: 'job_in_blr_1042.json', type: 'FILE', length: 3412, owner: 'kafka-ingest', group: 'supergroup', permission: '-rw-r--r--', replication: 3, modificationTime: now, isSimulated: true },
        { path: `${path}/job_in_hyd_1043.json`, name: 'job_in_hyd_1043.json', type: 'FILE', length: 2980, owner: 'kafka-ingest', group: 'supergroup', permission: '-rw-r--r--', replication: 3, modificationTime: now, isSimulated: true },
        { path: `${path}/job_in_pun_1044.json`, name: 'job_in_pun_1044.json', type: 'FILE', length: 3120, owner: 'kafka-ingest', group: 'supergroup', permission: '-rw-r--r--', replication: 3, modificationTime: now, isSimulated: true },
      ];
    } else if (path === '/jobs/clean') {
      return [
        { path: '/jobs/clean/city=Bengaluru', name: 'city=Bengaluru', type: 'DIRECTORY', length: 0, owner: 'pyspark', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
        { path: '/jobs/clean/city=Hyderabad', name: 'city=Hyderabad', type: 'DIRECTORY', length: 0, owner: 'pyspark', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
        { path: '/jobs/clean/city=Pune', name: 'city=Pune', type: 'DIRECTORY', length: 0, owner: 'pyspark', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
        { path: '/jobs/clean/city=Mumbai', name: 'city=Mumbai', type: 'DIRECTORY', length: 0, owner: 'pyspark', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
        { path: '/jobs/clean/city=Delhi_NCR', name: 'city=Delhi_NCR', type: 'DIRECTORY', length: 0, owner: 'pyspark', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
        { path: '/jobs/clean/city=Chennai', name: 'city=Chennai', type: 'DIRECTORY', length: 0, owner: 'pyspark', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
      ];
    } else if (path === '/jobs/aggregates') {
      return [
        { path: '/jobs/aggregates/city_role_kpis.parquet', name: 'city_role_kpis.parquet', type: 'FILE', length: 142050, owner: 'pyspark', group: 'supergroup', permission: '-rw-r--r--', replication: 2, modificationTime: now, isSimulated: true },
        { path: '/jobs/aggregates/skill_frequency.parquet', name: 'skill_frequency.parquet', type: 'FILE', length: 48900, owner: 'pyspark', group: 'supergroup', permission: '-rw-r--r--', replication: 2, modificationTime: now, isSimulated: true },
        { path: '/jobs/aggregates/skill_cooccurrence.parquet', name: 'skill_cooccurrence.parquet', type: 'FILE', length: 284100, owner: 'pyspark', group: 'supergroup', permission: '-rw-r--r--', replication: 2, modificationTime: now, isSimulated: true },
        { path: '/jobs/aggregates/run_metrics.json', name: 'run_metrics.json', type: 'FILE', length: 1024, owner: 'pyspark', group: 'supergroup', permission: '-rw-r--r--', replication: 1, modificationTime: now, isSimulated: true },
      ];
    } else if (path === '/models' || path === '/models/ctc_rf') {
      return [
        { path: '/models/ctc_rf/metadata', name: 'metadata', type: 'DIRECTORY', length: 0, owner: 'mllib', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
        { path: '/models/ctc_rf/stages', name: 'stages', type: 'DIRECTORY', length: 0, owner: 'mllib', group: 'supergroup', permission: 'drwxr-xr-x', replication: 1, modificationTime: now, isSimulated: true },
      ];
    }
    return [];
  };

  const hdfsItems = getHdfsListingForPath(currentHdfsPath);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Distributed Big Data Stack
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              PySpark 3.5 + WebHDFS
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-6 h-6 text-sky-400" />
            Distributed Big Data Infrastructure (Hadoop/Spark/Kafka)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time cluster topology, WebHDFS Data Lake explorer, PySpark batch metrics, and KRaft Kafka streaming bus.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('docker')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" />
            Run Locally in Docker
          </button>
        </div>
      </div>

      {/* Real-Time Cluster Health Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* HDFS Card */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Hadoop WebHDFS</span>
            <HardDrive className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-sm font-bold text-amber-400">Offline (Simulated)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Port: <code className="text-slate-300">9870</code> | DataNode: <code className="text-slate-300">9864</code>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
            Fallback active: local pandas / synthetic lake
          </div>
        </div>

        {/* Kafka Card */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Apache Kafka (KRaft)</span>
            <Radio className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            <span className="text-sm font-bold text-slate-400">Idle (Simulated)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Broker: <code className="text-slate-300">localhost:9092</code> (KRaft mode)
          </div>
          <div className="mt-2 text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
            Topics: job-postings (3P), job-postings-spam
          </div>
        </div>

        {/* PySpark Card */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">PySpark 3.5 Batch</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span className="text-sm font-bold text-indigo-400">Pandas Fallback</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Master: <code className="text-slate-300">local[*]</code> | UI: <code className="text-slate-300">8080</code>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
            Parquet output: /jobs/clean, /jobs/aggregates
          </div>
        </div>

        {/* Spark MLlib Card */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Spark MLlib Model</span>
            <Activity className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span className="text-sm font-bold text-sky-400">Scikit-Learn Fallback</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Model: <code className="text-slate-300">RandomForestClassifier</code>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 bg-slate-950/60 p-1.5 rounded border border-slate-800/60">
            Checkpoint: /models/ctc_rf/ (HDFS)
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('topology')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'topology'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          🏗️ Architecture Topology
        </button>
        <button
          onClick={() => setActiveTab('hdfs')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'hdfs'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          📂 WebHDFS Explorer
        </button>
        <button
          onClick={() => setActiveTab('spark')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'spark'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          ⚡ PySpark Batch Metrics
        </button>
        <button
          onClick={() => setActiveTab('kafka')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'kafka'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          📡 Kafka Stream Monitor
        </button>
        <button
          onClick={() => setActiveTab('docker')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'docker'
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          🐳 Docker Compose Runbook
        </button>
      </div>

      {/* TAB 1: TOPOLOGY */}
      {activeTab === 'topology' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              Distributed Big Data Dataflow Pipeline
            </h3>
            <div className="bg-slate-950 p-4 rounded-lg font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto border border-slate-800">
              <pre>{`[Arbeitnow & Jobicy REST APIs]  ──(Poll 60s)──>  [Kafka Producer: key=job_id]
                                                         │
                                                         ▼
                                 [Apache Kafka (KRaft mode: 3 Partitions)]
                                                         │
                         ┌───────────────────────────────┴───────────────────────────────┐
                         ▼                                                               ▼
        [Consumer: 'spark-ingest']                                      [Bloom Filter & DGIM Stream]
     (Pushes raw JSON into WebHDFS)                                    (Filters Spam -> job-postings-spam)
                         │                                              (Surge Bits -> stream-metrics)
                         ▼
        [Hadoop WebHDFS Lake (Port 9870)]
     /jobs/raw/dt=YYYY-MM-DD/<job_id>.json
                         │
                         ▼
     [PySpark Batch 1: clean_and_tokenize.py]
     - StructType schema (no inference)
     - 17 Skill regex tokenizers
     - Deduplication on (job_id, company, title)
     - Parquet partitioned by city -> /jobs/clean/
                         │
                         ▼
     [PySpark Batch 2: aggregate.py]
     - GroupBy Hub, Sector, Experience, Role
     - explode() skill frequency & self-join co-occurrence
     - Parquet -> /jobs/aggregates/ & run_metrics.json
                         │
                         ▼
     [PySpark MLlib: train_salary_model.py]
     - StringIndexer -> OneHotEncoder -> CountVectorizer -> RandomForest
     - Persists PipelineModel to HDFS /models/ctc_rf/
                         │
                         ▼
     [FastAPI Bridge API (Port 8000)]  <──>  [Streamlit & React Web Frontend]`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HDFS EXPLORER */}
      {activeTab === 'hdfs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-300">Directory:</span>
              {['/', '/jobs', '/jobs/raw', '/jobs/clean', '/jobs/aggregates', '/models/ctc_rf'].map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentHdfsPath(p)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                    currentHdfsPath === p
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-semibold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                ● Simulated Layout
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Permissions</th>
                    <th className="py-2.5 px-4">Owner</th>
                    <th className="py-2.5 px-4">Group</th>
                    <th className="py-2.5 px-4">Size (Bytes)</th>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4">Modified</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {hdfsItems.map((item) => (
                    <tr key={item.path} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-4">
                        {item.type === 'DIRECTORY' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 font-medium">
                            <Folder className="w-3.5 h-3.5" /> DIR
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
                            <FileCode className="w-3.5 h-3.5" /> FILE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">{item.permission}</td>
                      <td className="py-2.5 px-4 text-slate-300">{item.owner}</td>
                      <td className="py-2.5 px-4 text-slate-400">{item.group}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-300">
                        {item.length ? item.length.toLocaleString() : '-'}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-200">
                        {item.name}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                        {item.modificationTime}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {item.type === 'DIRECTORY' && (
                          <button
                            onClick={() => setCurrentHdfsPath(item.path)}
                            className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                          >
                            Open →
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SPARK BATCH METRICS */}
      {activeTab === 'spark' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Raw Input Postings</div>
              <div className="text-xl font-bold text-slate-100 mt-1">3,000</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Explicit StructType schema</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Partitions Written</div>
              <div className="text-xl font-bold text-slate-100 mt-1">6 Hubs</div>
              <div className="text-[10px] text-sky-400 mt-0.5">Partitioned by city (Parquet)</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Execution Wall Clock</div>
              <div className="text-xl font-bold text-slate-100 mt-1">1.48s</div>
              <div className="text-[10px] text-indigo-400 mt-0.5">Distributed Spark worker pool</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Co-occurrence Pairs</div>
              <div className="text-xl font-bold text-slate-100 mt-1">136</div>
              <div className="text-[10px] text-amber-400 mt-0.5">Self-join on exploded skills</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Spark Batch Job Execution History
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">clean_and_tokenize.py</div>
                  <div className="text-[11px] text-slate-400">StructType schema validation, 17 skill regexes, Parquet write</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-300">1.25s</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                    SUCCESS
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">aggregate.py</div>
                  <div className="text-[11px] text-slate-400">GroupBy aggregations, explode() frequency, self-join co-occurrence</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-300">1.48s</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                    SUCCESS
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">train_salary_model.py</div>
                  <div className="text-[11px] text-slate-400">PipelineModel: StringIndexer -&gt; CountVectorizer -&gt; RandomForest (50 trees)</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-300">4.12s</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                    SUCCESS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KAFKA STREAM */}
      {activeTab === 'kafka' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Topic: job-postings</div>
              <div className="text-xl font-bold text-slate-100 mt-1">3 Partitions</div>
              <div className="text-[10px] text-sky-400 mt-0.5">KRaft quorum leader: broker-1</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Topic: job-postings-spam</div>
              <div className="text-xl font-bold text-slate-100 mt-1">1 Partition</div>
              <div className="text-[10px] text-red-400 mt-0.5">Dead-letter spam sink</div>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">Topic: stream-metrics</div>
              <div className="text-xl font-bold text-slate-100 mt-1">1 Partition</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">DGIM sliding window telemetry</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Consumer Group: spark-ingest Lag Status
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="p-2.5">Topic</th>
                    <th className="p-2.5">Partition</th>
                    <th className="p-2.5">Current Offset</th>
                    <th className="p-2.5">Log End Offset</th>
                    <th className="p-2.5">Lag</th>
                    <th className="p-2.5">Assigned Worker</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="p-2.5 text-slate-200">job-postings</td>
                    <td className="p-2.5 text-slate-400">0</td>
                    <td className="p-2.5 text-slate-300">1,042</td>
                    <td className="p-2.5 text-slate-300">1,042</td>
                    <td className="p-2.5 text-emerald-400 font-bold">0</td>
                    <td className="p-2.5 text-slate-400">worker-1</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-200">job-postings</td>
                    <td className="p-2.5 text-slate-400">1</td>
                    <td className="p-2.5 text-slate-300">980</td>
                    <td className="p-2.5 text-slate-300">980</td>
                    <td className="p-2.5 text-emerald-400 font-bold">0</td>
                    <td className="p-2.5 text-slate-400">worker-2</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-200">job-postings</td>
                    <td className="p-2.5 text-slate-400">2</td>
                    <td className="p-2.5 text-slate-300">978</td>
                    <td className="p-2.5 text-slate-300">978</td>
                    <td className="p-2.5 text-emerald-400 font-bold">0</td>
                    <td className="p-2.5 text-slate-400">worker-3</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 text-slate-200">job-postings-spam</td>
                    <td className="p-2.5 text-slate-400">0</td>
                    <td className="p-2.5 text-slate-300">204</td>
                    <td className="p-2.5 text-slate-300">204</td>
                    <td className="p-2.5 text-emerald-400 font-bold">0</td>
                    <td className="p-2.5 text-slate-400">spam-auditor</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DOCKER RUNBOOK */}
      {activeTab === 'docker' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 mb-1 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              Running Distributed Big Data Stack Locally
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              All infrastructure services (HDFS, Kafka, PySpark 3.5, and FastAPI Bridge) are packaged in <code className="text-sky-300 font-mono">bigdata/docker-compose.yml</code>.
            </p>

            <div className="space-y-4">
              {/* Step 1 */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>1. Spin up Hadoop NameNode, Kafka KRaft, and Spark Master</span>
                  <button
                    onClick={() => copyToClipboard('cd bigdata && docker compose up -d')}
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    {copiedCmd === 'cd bigdata && docker compose up -d' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400">
                  cd bigdata && docker compose up -d
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>2. Trigger PySpark Ingestion & Batch Tokenization</span>
                  <button
                    onClick={() => copyToClipboard('python -m bigdata.spark_jobs.clean_and_tokenize')}
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    {copiedCmd === 'python -m bigdata.spark_jobs.clean_and_tokenize' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400">
                  python -m bigdata.spark_jobs.clean_and_tokenize
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>3. Run PySpark Distributed Aggregations & Co-occurrence</span>
                  <button
                    onClick={() => copyToClipboard('python -m bigdata.spark_jobs.aggregate')}
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    {copiedCmd === 'python -m bigdata.spark_jobs.aggregate' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400">
                  python -m bigdata.spark_jobs.aggregate
                </div>
              </div>

              {/* Step 4 */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>4. Stream 3,000 Synthetic Postings through Kafka with Bloom/DGIM</span>
                  <button
                    onClick={() => copyToClipboard('python -m bigdata.kafka.producer --replay-synthetic --rate 15')}
                    className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    {copiedCmd === 'python -m bigdata.kafka.producer --replay-synthetic --rate 15' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-emerald-400">
                  python -m bigdata.kafka.producer --replay-synthetic --rate 15
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
