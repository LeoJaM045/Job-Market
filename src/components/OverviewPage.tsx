import React, { useMemo } from 'react';
import {
  ShieldCheck,
  Briefcase,
  Layers,
  ArrowUpRight,
  Sparkles,
  IndianRupee,
} from 'lucide-react';
import { JobPosting } from '../types';

interface OverviewPageProps {
  postings: JobPosting[];
  totalRawCount: number;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  postings,
  totalRawCount,
}) => {
  const totalAnalyzed = postings.length;
  const avgLpa = useMemo(() => {
    if (!totalAnalyzed) return 0;
    const sum = postings.reduce((acc, p) => acc + p.salaryLpa, 0);
    return Math.round((sum / totalAnalyzed) * 10) / 10;
  }, [postings, totalAnalyzed]);

  const spamRate = useMemo(() => {
    if (!totalAnalyzed) return 0;
    const spamCount = postings.filter((p) => p.isSpam).length;
    return (spamCount / totalAnalyzed) * 100;
  }, [postings, totalAnalyzed]);

  const topSkill = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of postings) {
      for (const s of p.skills) {
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    let best = 'PySpark';
    let maxC = 0;
    for (const [k, v] of Object.entries(counts)) {
      if (v > maxC) {
        maxC = v;
        best = k;
      }
    }
    return { name: best, count: maxC };
  }, [postings]);

  // Aggregate by Role
  const roleDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of postings) {
      map[p.role] = (map[p.role] || 0) + 1;
    }
    return Object.entries(map)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
  }, [postings]);

  // Aggregate by City
  const cityDistribution = useMemo(() => {
    const map: Record<string, { count: number; totalLpa: number }> = {};
    for (const p of postings) {
      if (!map[p.city]) map[p.city] = { count: 0, totalLpa: 0 };
      map[p.city].count += 1;
      map[p.city].totalLpa += p.salaryLpa;
    }
    return Object.entries(map).map(([city, val]) => ({
      city,
      count: val.count,
      avgLpa: Math.round((val.totalLpa / val.count) * 10) / 10,
    }));
  }, [postings]);

  // Aggregate by Company Type
  const compTypeDistribution = useMemo(() => {
    const map: Record<string, { count: number; totalLpa: number }> = {};
    for (const p of postings) {
      if (!map[p.companyType]) map[p.companyType] = { count: 0, totalLpa: 0 };
      map[p.companyType].count += 1;
      map[p.companyType].totalLpa += p.salaryLpa;
    }
    return Object.entries(map).map(([compType, val]) => ({
      compType,
      count: val.count,
      avgLpa: Math.round((val.totalLpa / val.count) * 10) / 10,
    }));
  }, [postings]);

  // Timeline aggregation
  const timelineData = useMemo(() => {
    const buckets: Record<string, number> = {};
    for (const p of postings) {
      const dateKey = p.postedDate.substring(0, 7) + '-W' + Math.ceil(parseInt(p.postedDate.substring(8, 10)) / 7);
      buckets[dateKey] = (buckets[dateKey] || 0) + 1;
    }
    return Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0]));
  }, [postings]);

  const maxTimelineCount = Math.max(...timelineData.map((d) => d[1]), 1);

  return (
    <div className="space-y-6">
      {/* Architecture Context Banner */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 font-medium text-slate-200 mb-1">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Indian Tech Ecosystem Intelligence: Operational</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          Aggregating requisitions across <strong className="text-slate-300">Bengaluru, Hyderabad, Pune, Mumbai, Delhi NCR, and Chennai</strong>.
          Cleaned via <strong className="text-slate-300">PySpark</strong> on HDFS. Fraudulent placement consultancies filtered via a <strong className="text-slate-300">Bloom Filter</strong>.
          Real-time technology surges (PySpark, Databricks, GenAI) tracked via <strong className="text-slate-300">DGIM</strong>. Compensation modeled in <strong className="text-slate-300">₹ LPA</strong> and served from <strong className="text-slate-300">MongoDB</strong>.
        </p>
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium uppercase tracking-wider">Indian Postings Analyzed</span>
            <Briefcase className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-100">
            {totalAnalyzed.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+18.5% QoQ Ingestion</span>
            <span className="text-slate-500 font-mono">({totalRawCount} raw batch)</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium uppercase tracking-wider">Top Detected Skill</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-300 truncate">
            {topSkill.name}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            In <span className="font-mono tabular-nums text-slate-200 font-medium">{topSkill.count.toLocaleString()}</span> requisitions ({((topSkill.count / (totalAnalyzed || 1)) * 100).toFixed(1)}%)
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium uppercase tracking-wider">Average CTC</span>
            <IndianRupee className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
            ₹{avgLpa.toFixed(1)} LPA
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span>Range: ₹3.6 LPA – ₹58.0 LPA</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800/90 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium uppercase tracking-wider">Consultancy Scam Intercept</span>
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-400">
            {spamRate.toFixed(1)}%
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Filtered by Bloom Filter
          </div>
        </div>
      </div>

      {/* Row 1 Charts: Ingestion Velocity & Role Share */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timeline Velocity Chart */}
        <div className="lg:col-span-7 p-5 rounded-lg bg-slate-900/90 border border-slate-800/90">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Daily Postings Ingestion Velocity (Indian IT Corridors)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                PySpark streaming ingestion across Bengaluru, Hyderabad & Pune
              </p>
            </div>
            <span className="text-xs font-mono text-sky-400 bg-sky-950/60 border border-sky-800/50 px-2 py-0.5 rounded">
              90-Day Window
            </span>
          </div>

          <div className="h-56 flex items-end gap-1.5 pt-4">
            {timelineData.map(([period, count]) => {
              const heightPct = Math.round((count / maxTimelineCount) * 100);
              return (
                <div key={period} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="absolute -top-8 hidden group-hover:flex bg-slate-800 text-slate-100 text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 font-mono">
                    {period}: {count} postings
                  </div>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-gradient-to-t from-sky-600/30 to-sky-400 rounded-t-sm hover:brightness-125 transition-all"
                  />
                  <span className="text-[9px] text-slate-500 font-mono truncate w-full text-center mt-1 hidden sm:block">
                    {period.split('-')[2]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Role Share Breakdown */}
        <div className="lg:col-span-5 p-5 rounded-lg bg-slate-900/90 border border-slate-800/90">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            Requisition Share by Engineering Role
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Volume per tech specialism in Indian hiring
          </p>

          <div className="space-y-3">
            {roleDistribution.map((item) => {
              const pct = ((item.count / (totalAnalyzed || 1)) * 100).toFixed(1);
              return (
                <div key={item.role} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate max-w-[200px]">{item.role}</span>
                    <span className="font-mono text-slate-400">
                      {item.count.toLocaleString()} <span className="text-slate-600">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-sky-400 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2 Charts: Tech Hub Volume & Sector Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 p-5 rounded-lg bg-slate-900/90 border border-slate-800/90">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            Tech Hub Volume & Mean CTC (₹ LPA)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Requisition volume vs average annual CTC across Indian cities
          </p>
          <div className="space-y-3.5">
            {cityDistribution.map((item) => {
              return (
                <div key={item.city} className="flex items-center justify-between border-b border-slate-800/50 pb-2.5">
                  <div>
                    <div className="text-xs font-medium text-slate-200">{item.city}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {item.count} job postings
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-semibold text-emerald-400">
                      ₹{item.avgLpa.toFixed(1)} LPA
                    </div>
                    <div className="text-[10px] text-slate-500">avg CTC</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Company Types Comparison */}
        <div className="lg:col-span-6 p-5 rounded-lg bg-slate-900/90 border border-slate-800/90">
          <h3 className="text-sm font-semibold text-slate-200 mb-1">
            Company Category Compensation
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Product Unicorns vs GCCs vs IT Services vs Startups
          </p>

          <div className="space-y-3.5">
            {compTypeDistribution.map((item) => (
              <div key={item.compType} className="p-3 bg-slate-950 rounded-lg border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.compType}</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    ₹{item.avgLpa.toFixed(1)} LPA
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>{item.count} active requisitions</span>
                  <span>Benchmark ratio: {(item.avgLpa / (avgLpa || 1)).toFixed(2)}x</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
