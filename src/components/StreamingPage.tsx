import React, { useState, useEffect } from 'react';
import { ClientBloomFilter, ClientDGIMStream } from '../algorithms';
import {
  Radio,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Play,
  Square,
  RefreshCw,
  Plus,
  AlertTriangle,
  Info,
} from 'lucide-react';

interface StreamingPageProps {
  bloomFilter: ClientBloomFilter;
  dgimStream: ClientDGIMStream;
  onRefreshDGIM: () => void;
  onRefreshBloom: () => void;
}

export const StreamingPage: React.FC<StreamingPageProps> = ({
  bloomFilter,
  dgimStream,
  onRefreshDGIM,
  onRefreshBloom,
}) => {
  const [activeTab, setActiveTab] = useState<'dgim' | 'bloom'>('dgim');

  // DGIM interactive controls
  const [windowSize, setWindowSize] = useState<number>(100);
  const [spikeThreshold, setSpikeThreshold] = useState<number>(32);
  const [isAutoStreaming, setIsAutoStreaming] = useState<boolean>(false);

  // Bloom Filter interactive controls
  const [probeInput, setProbeInput] = useState<string>('REC-0012');
  const [probeResult, setProbeResult] = useState<{
    present: boolean;
    hashes: number[];
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto stream pulse effect
  useEffect(() => {
    let timer: any;
    if (isAutoStreaming) {
      timer = setInterval(() => {
        // 35% chance of 1, 65% chance of 0
        const bit = Math.random() < 0.35 ? 1 : 0;
        dgimStream.update(bit);
        onRefreshDGIM();
      }, 350);
    }
    return () => clearInterval(timer);
  }, [isAutoStreaming, dgimStream, onRefreshDGIM]);

  const handleInjectTicks = (count: number) => {
    for (let i = 0; i < count; i++) {
      const bit = Math.random() < 0.4 ? 1 : 0;
      dgimStream.update(bit);
    }
    onRefreshDGIM();
  };

  const handleInjectBurst = () => {
    // Inject a sudden surge spike: 10 consecutive 1s
    for (let i = 0; i < 8; i++) {
      dgimStream.update(1);
    }
    onRefreshDGIM();
  };

  const handleTestProbe = () => {
    const isPresent = bloomFilter.contains(probeInput);
    const hashes = bloomFilter.getHashIndices(probeInput);
    setProbeResult({ present: isPresent, hashes });
  };

  const handleAddSpam = () => {
    bloomFilter.add(probeInput);
    const hashes = bloomFilter.getHashIndices(probeInput);
    setProbeResult({ present: true, hashes });
    onRefreshBloom();
    setToastMessage(`Signature '${probeInput}' successfully added to Bloom Filter.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // DGIM state computations
  const estimatedCount = dgimStream.countOnes(windowSize);
  const isSpikeTriggered = estimatedCount >= spikeThreshold;

  // Theoretical max error of DGIM
  const maxDgimError = (50 / Math.log2(Math.max(4, windowSize))).toFixed(1);

  // Bloom filter stats
  const fpProb = bloomFilter.falsePositiveProbability();
  const sampleIndices = Array.from({ length: 64 }, (_, i) => i * 125);

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('dgim')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'dgim'
              ? 'border-sky-400 text-sky-400 bg-sky-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>DGIM Sliding-Window Spike Detector</span>
        </button>

        <button
          onClick={() => setActiveTab('bloom')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'bloom'
              ? 'border-sky-400 text-sky-400 bg-sky-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Bloom Filter Spam Filtration</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center justify-between animate-fade-in">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-emerald-200">
            ×
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: DGIM STREAMING SPIKE DETECTOR */}
      {/* ========================================================================= */}
      {activeTab === 'dgim' && (
        <div className="space-y-6">
          {/* Explanation Banner */}
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-200 mb-1">
              <Zap className="w-4 h-4 text-sky-400" />
              <span>Datar-Gionis-Indyk-Motwani (DGIM) Stream Mining Principle</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              In real-time Kafka job streams, evaluating skill bursts over an arbitrary sliding window <strong className="text-slate-300">N</strong> with zero memory blowup is solved via <strong className="text-slate-300">DGIM</strong>. Buckets store power-of-2 sizes with at most two buckets per size tier, delivering <strong className="text-slate-300">O(log² N)</strong> space complexity and theoretical error guaranteed <strong className="text-slate-300">≤ 50%</strong>.
            </p>
          </div>

          {/* Interactive Stream Controls Bar */}
          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800/90 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleInjectTicks(1)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+1 Tick</span>
              </button>

              <button
                onClick={() => handleInjectTicks(10)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+10 Ticks</span>
              </button>

              <button
                onClick={handleInjectBurst}
                className="px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-xs font-medium rounded border border-amber-800 flex items-center gap-1.5"
                title="Inject burst of consecutive 1s to trigger surge spike alert"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Simulate Skill Surge Burst</span>
              </button>

              <button
                onClick={() => setIsAutoStreaming(!isAutoStreaming)}
                className={`px-3 py-1.5 text-xs font-medium rounded flex items-center gap-1.5 transition-colors ${
                  isAutoStreaming
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                }`}
              >
                {isAutoStreaming ? (
                  <>
                    <Square className="w-3 h-3 fill-rose-300" />
                    <span>Pause Live Ingestion</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-emerald-300" />
                    <span>Auto-Stream Ticks (350ms)</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Sliding Window (N):</span>
                <input
                  type="range"
                  min={30}
                  max={150}
                  value={windowSize}
                  onChange={(e) => setWindowSize(parseInt(e.target.value))}
                  className="w-24 accent-sky-400"
                />
                <span className="font-mono text-sky-400">{windowSize}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Spike Alert Threshold:</span>
                <input
                  type="range"
                  min={15}
                  max={60}
                  value={spikeThreshold}
                  onChange={(e) => setSpikeThreshold(parseInt(e.target.value))}
                  className="w-24 accent-amber-400"
                />
                <span className="font-mono text-amber-400">{spikeThreshold}</span>
              </div>
            </div>
          </div>

          {/* Real-Time DGIM Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800/90">
              <div className="text-xs text-slate-400 uppercase font-medium mb-1">
                Stream Clock (Ticks)
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                t={dgimStream.currentTime}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Monotonically increasing arrival ticks
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800/90">
              <div className="text-xs text-slate-400 uppercase font-medium mb-1">
                Active DGIM Buckets
              </div>
              <div className="text-2xl font-bold font-mono text-sky-400">
                {dgimStream.buckets.length} buckets
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Compressed into O(log² N) footprint
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800/90">
              <div className="text-xs text-slate-400 uppercase font-medium mb-1">
                Estimated 1s in Window
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {estimatedCount} <span className="text-xs text-slate-500 font-normal">/ {windowSize} ticks</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Worst-case estimation error ≤ {maxDgimError}%
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              isSpikeTriggered
                ? 'bg-rose-950/40 border-rose-800'
                : 'bg-emerald-950/40 border-emerald-800'
            }`}>
              <div className="text-xs uppercase font-medium mb-1 flex items-center justify-between">
                <span>Surge Spike State</span>
                {isSpikeTriggered ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div className={`text-2xl font-bold font-mono ${
                isSpikeTriggered ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {isSpikeTriggered ? 'SURGE SPIKE DETECTED' : 'NORMAL DEMAND'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {isSpikeTriggered
                  ? `Exceeds threshold (${estimatedCount} ≥ ${spikeThreshold})`
                  : `Within tolerance (< ${spikeThreshold})`}
              </div>
            </div>
          </div>

          {/* Active DGIM Buckets Visual Representation */}
          <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800/90">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">
                  DGIM Bucket Memory Cascade (Power-of-2 Sizes)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual representation of actively held power-of-2 buckets sorted by age
                </p>
              </div>
              <span className="text-xs font-mono text-sky-400">
                Capacity Constraint: Max 2 buckets per size tier
              </span>
            </div>

            {dgimStream.buckets.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800 min-h-24">
                {dgimStream.buckets.map((b, idx) => {
                  const age = dgimStream.currentTime - b.timestamp;
                  return (
                    <div
                      key={idx}
                      className="px-3 py-2 rounded bg-slate-900 border border-slate-700/80 hover:border-sky-500 transition-all text-center group relative cursor-default"
                    >
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                        Size 2^{Math.round(Math.log2(b.size))}
                      </div>
                      <div className="text-base font-bold font-mono text-sky-400">
                        {b.size}
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                        Age: {age}t
                      </div>

                      {/* Tooltip */}
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-slate-800 text-slate-200 text-[10px] px-2 py-1 rounded shadow-md whitespace-nowrap z-20 font-mono">
                        Timestamp: t={b.timestamp} | Represents {b.size} '1' bit(s)
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                No active buckets in current sliding stream. Inject ticks above to populate.
              </div>
            )}
          </div>

          {/* Recent Bit Stream Ticker */}
          <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800/90">
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Recent Raw Bit Ingestion Stream
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              1 = PySpark requisition mentions spike candidate; 0 = baseline flow
            </p>
            <div className="flex items-center gap-1 overflow-x-auto pb-2 font-mono text-xs">
              {dgimStream.recentTicks.slice(-60).map((t, idx) => (
                <span
                  key={idx}
                  className={`w-6 h-7 rounded flex items-center justify-center shrink-0 font-bold transition-all ${
                    t.bit === 1
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                      : 'bg-slate-900 text-slate-600 border border-slate-800'
                  }`}
                  title={`Tick t=${t.tick}: ${t.bit}`}
                >
                  {t.bit}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BLOOM FILTER SPAM FILTRATION */}
      {/* ========================================================================= */}
      {activeTab === 'bloom' && (
        <div className="space-y-6">
          {/* Explanation Banner */}
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-200 mb-1">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Bloom Filter Space-Efficient Probabilistic Spam Filtration</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Every job posting signature (recruiter ID, job description hash) is evaluated against a <strong className="text-slate-300">Bloom Filter</strong> with <strong className="text-slate-300">k=4</strong> independent salted hash functions over a bit array of size <strong className="text-slate-300">m=8,000</strong> bits. Zero false negatives guarantee no spam escapes; false positive rate is mathematically bounded by <strong className="text-slate-300">P ≈ (1 - e^(-kn/m))^k</strong>.
            </p>
          </div>

          {/* Bloom Stats Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800/90">
              <div className="text-xs text-slate-400 uppercase font-medium mb-1">
                Bit Array Size (m)
              </div>
              <div className="text-2xl font-bold font-mono text-slate-100">
                {bloomFilter.size.toLocaleString()} bits
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                ~1 KB memory footprint
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800/90">
              <div className="text-xs text-slate-400 uppercase font-medium mb-1">
                Hash Functions (k)
              </div>
              <div className="text-2xl font-bold font-mono text-sky-400">
                {bloomFilter.numHashes} digests
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                FNV-1a / Salted multi-hash
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800/90">
              <div className="text-xs text-slate-400 uppercase font-medium mb-1">
                Items Inserted (n)
              </div>
              <div className="text-2xl font-bold font-mono text-amber-400">
                {bloomFilter.itemsCount.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Flagged fraudulent recruiter IDs
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800/90">
              <div className="text-xs text-slate-400 uppercase font-medium mb-1">
                False Positive Rate (p)
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {(fpProb * 100).toFixed(4)}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Well below 0.08% SLA target
              </div>
            </div>
          </div>

          {/* Interactive Probe Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 p-5 rounded-lg bg-slate-900/90 border border-slate-800/90">
              <h3 className="text-sm font-semibold text-slate-200 mb-1">
                Interactive Recruiter Membership Probe
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Test whether an incoming recruiter ID is present in the spam bit array
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Recruiter ID or Posting Hash:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={probeInput}
                      onChange={(e) => setProbeInput(e.target.value)}
                      placeholder="e.g. REC-0012, BOT-SPAM-99..."
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <button
                      onClick={handleTestProbe}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-semibold rounded-md transition-colors"
                    >
                      Probe Filter
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleAddSpam}
                    className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-medium rounded border border-rose-800 flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insert & Flag '{probeInput}' as Spam</span>
                  </button>
                </div>

                {/* Probe Result Display */}
                {probeResult && (
                  <div
                    className={`p-4 rounded-lg border mt-4 ${
                      probeResult.present
                        ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                        : 'bg-emerald-950/40 border-emerald-800 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs uppercase mb-1">
                      {probeResult.present ? (
                        <>
                          <ShieldAlert className="w-4 h-4 text-rose-400" />
                          <span>SPAM DETECTED: Item is in filter</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>VERIFIED CLEAN: Definitely Not in Spam Set</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300">
                      {probeResult.present
                        ? `The item was found across all ${bloomFilter.numHashes} hash indices. Postings from this recruiter are blocked from the pipeline.`
                        : `At least one hash index evaluated to bit 0. With 0% false negatives, this recruiter is 100% verified non-spam.`}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-800 text-xs font-mono text-slate-400">
                      Hash Indices: [{probeResult.hashes.join(', ')}]
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bit Array Sample Representation */}
            <div className="lg:col-span-6 p-5 rounded-lg bg-slate-900/90 border border-slate-800/90">
              <h3 className="text-sm font-semibold text-slate-200 mb-1">
                Bit Array Segment Visualizer
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Sample bits across the 8,000-bit allocation (highlighting populated bit positions)
              </p>

              <div className="grid grid-cols-8 gap-1.5 p-3 bg-slate-950 rounded-lg border border-slate-800">
                {sampleIndices.map((bitIndex) => {
                  const isSet = bloomFilter.bitArray[bitIndex] === 1;
                  return (
                    <div
                      key={bitIndex}
                      className={`h-7 rounded flex items-center justify-center font-mono text-[10px] font-bold transition-all ${
                        isSet
                          ? 'bg-sky-500/20 text-sky-400 border border-sky-500/50'
                          : 'bg-slate-900 text-slate-600 border border-slate-800'
                      }`}
                      title={`Bit Index ${bitIndex}: ${isSet ? 1 : 0}`}
                    >
                      {isSet ? '1' : '0'}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Green/Cyan: Set bit (1)</span>
                <span>Dark: Zero bit (0)</span>
                <span>Sampled 64 / 8,000 slots</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
