import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  Table,
  Layers,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  MapPin,
  Cpu,
  FileSpreadsheet,
} from 'lucide-react';
import { JobPosting } from '../types';

interface ReportsPageProps {
  postings: JobPosting[];
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ postings }) => {
  const [reportTitle, setReportTitle] = useState('Indian Tech Hiring Intelligence & Compensation Dossier');
  const [author, setAuthor] = useState('Enterprise Talent Intelligence & Big Data Architecture Team');
  const [memo, setMemo] = useState(
    'Executive briefing highlighting Q4 hiring velocity, premium CTC bands across Bengaluru/Hyderabad, and emerging data engineering competencies.'
  );

  const [incKpis, setIncKpis] = useState(true);
  const [incCities, setIncCities] = useState(true);
  const [incSkills, setIncSkills] = useState(true);
  const [incRoles, setIncRoles] = useState(true);
  const [incAlgorithms, setIncAlgorithms] = useState(true);

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'data-exports'>('preview');

  // Aggregations
  const totalCount = postings.length;
  const avgLpa = totalCount > 0 ? postings.reduce((acc, p) => acc + p.salaryLpa, 0) / totalCount : 0;
  const spamCount = postings.filter((p) => p.isSpam).length;
  const spamRate = totalCount > 0 ? (spamCount / totalCount) * 100 : 0;

  // City breakdown
  const cityStats = useMemo(() => {
    const map = new Map<string, { count: number; totalLpa: number; min: number; max: number; salaries: number[] }>();
    postings.forEach((p) => {
      const cur = map.get(p.city) || { count: 0, totalLpa: 0, min: p.salaryLpa, max: p.salaryLpa, salaries: [] };
      cur.count += 1;
      cur.totalLpa += p.salaryLpa;
      cur.min = Math.min(cur.min, p.salaryLpa);
      cur.max = Math.max(cur.max, p.salaryLpa);
      cur.salaries.push(p.salaryLpa);
      map.set(p.city, cur);
    });

    return Array.from(map.entries())
      .map(([city, data]) => {
        data.salaries.sort((a, b) => a - b);
        const mid = Math.floor(data.salaries.length / 2);
        const median = data.salaries.length % 2 !== 0 ? data.salaries[mid] : (data.salaries[mid - 1] + data.salaries[mid]) / 2;
        return {
          city,
          count: data.count,
          avgLpa: data.totalLpa / data.count,
          medianLpa: median,
          minLpa: data.min,
          maxLpa: data.max,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [postings]);

  // Skill frequencies
  const topSkills = useMemo(() => {
    const map = new Map<string, number>();
    postings.forEach((p) => {
      p.skills.forEach((s) => {
        map.set(s, (map.get(s) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .map(([skill, count]) => ({
        skill,
        count,
        pct: totalCount > 0 ? (count / totalCount) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }, [postings, totalCount]);

  // Role stats
  const roleStats = useMemo(() => {
    const map = new Map<string, { count: number; totalLpa: number }>();
    postings.forEach((p) => {
      const cur = map.get(p.role) || { count: 0, totalLpa: 0 };
      cur.count += 1;
      cur.totalLpa += p.salaryLpa;
      map.set(p.role, cur);
    });
    return Array.from(map.entries())
      .map(([role, data]) => ({
        role,
        count: data.count,
        avgLpa: data.totalLpa / data.count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [postings]);

  // Generate Markdown
  const markdownReport = useMemo(() => {
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const topSkillName = topSkills[0]?.skill || 'N/A';

    let md = `# ${reportTitle}\n`;
    md += `**Author / Lead:** ${author}  \n`;
    md += `**Generated:** ${dateStr}  \n`;
    md += `**Pipeline Stack:** Apache Spark (Batch), HDFS, Kafka Stream, Bloom Filter, DGIM Window, Spark MLlib, MongoDB  \n`;
    md += `**Requisitions Analyzed:** ${totalCount.toLocaleString()} Indian Tech Postings  \n\n`;

    if (memo.trim()) {
      md += `### 📝 Strategic Executive Memo\n> ${memo.trim()}\n\n`;
    }

    if (incKpis) {
      md += `---\n## 1. Executive Summary & Core Metrics\n`;
      md += `- **Total Postings Indexed:** ${totalCount.toLocaleString()}\n`;
      md += `- **Primary In-Demand Skill:** ${topSkillName}\n`;
      md += `- **Mean Indian Compensation:** ₹${avgLpa.toFixed(2)} LPA\n`;
      md += `- **Spam & Fake Consultancy Intercept Rate:** ${spamRate.toFixed(1)}% (${spamCount} fraudulent posts blocked)\n\n`;
    }

    if (incCities && cityStats.length > 0) {
      md += `---\n## 2. Regional Tech Hub Compensation Benchmarks (₹ LPA)\n`;
      md += `| Tech Hub | Postings | Mean CTC (₹ LPA) | Median CTC | CTC Range |\n`;
      md += `| :--- | :--- | :--- | :--- | :--- |\n`;
      cityStats.forEach((c) => {
        md += `| ${c.city} | ${c.count.toLocaleString()} | ₹${c.avgLpa.toFixed(2)} | ₹${c.medianLpa.toFixed(2)} | ₹${c.minLpa.toFixed(1)} - ₹${c.maxLpa.toFixed(1)} |\n`;
      });
      md += `\n`;
    }

    if (incSkills && topSkills.length > 0) {
      md += `---\n## 3. High-Velocity Skills Ranking\n`;
      md += `| Rank | Skill Name | Requisitions | Market Saturation |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      topSkills.forEach((s, idx) => {
        md += `| #${idx + 1} | ${s.skill} | ${s.count.toLocaleString()} | ${s.pct.toFixed(1)}% |\n`;
      });
      md += `\n`;
    }

    if (incRoles && roleStats.length > 0) {
      md += `---\n## 4. Engineering Role Breakdown\n`;
      roleStats.forEach((r) => {
        md += `- **${r.role}:** ${r.count.toLocaleString()} requisitions (Mean CTC: ₹${r.avgLpa.toFixed(2)} LPA)\n`;
      });
      md += `\n`;
    }

    if (incAlgorithms) {
      md += `---\n## 5. Big Data Algorithmic Defense Audit\n`;
      md += `- **Bloom Filter:** Verified recruiter bit array ($m=50,000, k=5$), preventing scam ring infiltration.\n`;
      md += `- **DGIM Algorithm:** Sliding window $O(\\log^2 N)$ memory counters detecting surging skill trends.\n`;
      md += `- **Spark MLlib Classifier:** Multi-tier Random Forest CTC bracket model (< ₹6 LPA, ₹6 - ₹18 LPA, > ₹18 LPA).\n\n`;
    }

    md += `---\n*Report generated via Indian Job Market Trends & Hiring Intelligence System.*\n`;
    return md;
  }, [reportTitle, author, memo, incKpis, incCities, incSkills, incRoles, incAlgorithms, totalCount, avgLpa, spamRate, spamCount, topSkills, cityStats, roleStats]);

  // Generate HTML for printing
  const htmlReport = useMemo(() => {
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const topSkillName = topSkills[0]?.skill || 'N/A';

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${reportTitle}</title>
<style>
  @media print {
    body { background: #fff !important; color: #000 !important; font-size: 11pt; }
    .no-print { display: none !important; }
  }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 40px 20px; }
  .box { max-width: 900px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; }
  h1 { margin: 0 0 8px; font-size: 1.8rem; color: #0f172a; border-bottom: 2px solid #0284c7; padding-bottom: 12px; }
  .meta { color: #64748b; font-size: 0.85rem; margin-bottom: 24px; }
  .kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0; }
  .kpi { background: #f1f5f9; padding: 16px; border-radius: 8px; text-align: center; }
  .kpi-num { font-size: 1.4rem; font-weight: 700; color: #0284c7; }
  .kpi-lbl { font-size: 0.75rem; text-transform: uppercase; color: #64748b; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 0.9rem; }
  th { background: #f1f5f9; text-align: left; padding: 8px 12px; border-bottom: 2px solid #cbd5e1; }
  td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
  .btn { background: #0284c7; color: #fff; padding: 8px 16px; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; }
</style>
</head>
<body>
<div class="box">
  <div class="no-print" style="text-align:right;margin-bottom:16px;">
    <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
  </div>
  <h1>${reportTitle}</h1>
  <div class="meta">
    Author: <strong>${author}</strong> &nbsp;|&nbsp; Generated: <strong>${dateStr}</strong>
  </div>
  ${memo.trim() ? `<div style="background:#f0f9ff;border-left:4px solid #0284c7;padding:12px 16px;border-radius:6px;margin:20px 0;"><strong>Executive Memo:</strong> ${memo.trim()}</div>` : ''}
  <div class="kpis">
    <div class="kpi"><div class="kpi-num">${totalCount.toLocaleString()}</div><div class="kpi-lbl">Postings Indexed</div></div>
    <div class="kpi"><div class="kpi-num">${topSkillName}</div><div class="kpi-lbl">Top Skill</div></div>
    <div class="kpi"><div class="kpi-num">₹${avgLpa.toFixed(1)} LPA</div><div class="kpi-lbl">Mean CTC</div></div>
    <div class="kpi"><div class="kpi-num">${spamRate.toFixed(1)}%</div><div class="kpi-lbl">Scam Filter Rate</div></div>
  </div>
  <h2>Regional Tech Hub Benchmarks</h2>
  <table>
    <thead><tr><th>Tech Hub</th><th>Openings</th><th>Mean CTC</th><th>Median CTC</th><th>Salary Range</th></tr></thead>
    <tbody>
      ${cityStats.map((c) => `<tr><td><strong>${c.city}</strong></td><td>${c.count}</td><td>₹${c.avgLpa.toFixed(2)} LPA</td><td>₹${c.medianLpa.toFixed(2)} LPA</td><td>₹${c.minLpa.toFixed(1)} - ₹${c.maxLpa.toFixed(1)} LPA</td></tr>`).join('')}
    </tbody>
  </table>
  <h2>Top In-Demand Skills</h2>
  <table>
    <thead><tr><th>Rank</th><th>Skill</th><th>Requisitions</th><th>Market Share</th></tr></thead>
    <tbody>
      ${topSkills.map((s, idx) => `<tr><td>#${idx + 1}</td><td><strong>${s.skill}</strong></td><td>${s.count}</td><td>${s.pct.toFixed(1)}%</td></tr>`).join('')}
    </tbody>
  </table>
</div>
</body>
</html>`;
  }, [reportTitle, author, memo, topSkills, totalCount, avgLpa, spamRate, cityStats]);

  // Helper download trigger
  const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = () => {
    triggerDownload(`indian_tech_hiring_report_${Date.now()}.md`, markdownReport, 'text/markdown');
  };

  const handleDownloadHtml = () => {
    triggerDownload(`indian_tech_hiring_report_${Date.now()}.html`, htmlReport, 'text/html');
  };

  const handleDownloadPostingsCsv = () => {
    const headers = ['job_id', 'title', 'role', 'city', 'company_type', 'experience_level', 'salary_lpa', 'salary_bracket', 'skills', 'is_spam'];
    const rows = postings.map((p) => [
      p.jobId,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.role}"`,
      `"${p.city}"`,
      `"${p.companyType}"`,
      `"${p.experienceLevel}"`,
      p.salaryLpa,
      `"${p.salaryBracket}"`,
      `"${p.skills.join(';')}"`,
      p.isSpam ? 1 : 0,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    triggerDownload(`indian_job_postings_filtered_${Date.now()}.csv`, csvContent, 'text/csv');
  };

  const handleDownloadCitiesCsv = () => {
    const headers = ['city', 'total_postings', 'mean_ctc_lpa', 'median_ctc_lpa', 'min_ctc_lpa', 'max_ctc_lpa'];
    const rows = cityStats.map((c) => [c.city, c.count, c.avgLpa.toFixed(2), c.medianLpa.toFixed(2), c.minLpa.toFixed(2), c.maxLpa.toFixed(2)]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    triggerDownload(`city_compensation_benchmarks_${Date.now()}.csv`, csvContent, 'text/csv');
  };

  const handleDownloadSkillsCsv = () => {
    const headers = ['skill_name', 'requisitions_count', 'market_saturation_pct'];
    const rows = topSkills.map((s) => [`"${s.skill}"`, s.count, s.pct.toFixed(2)]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    triggerDownload(`skill_frequencies_${Date.now()}.csv`, csvContent, 'text/csv');
  };

  const handleDownloadJson = () => {
    const snapshot = {
      metadata: {
        title: reportTitle,
        author,
        generatedAt: new Date().toISOString(),
        totalPostings: totalCount,
      },
      kpis: {
        meanLpa: Number(avgLpa.toFixed(2)),
        spamInterceptRatePct: Number(spamRate.toFixed(2)),
      },
      topSkills: topSkills,
      cityBenchmarks: cityStats,
      sampleRecords: postings.slice(0, 50),
    };
    triggerDownload(`intelligence_snapshot_${Date.now()}.json`, JSON.stringify(snapshot, null, 2), 'application/json');
  };

  const handleCopyClipboard = async () => {
    try {
      await navigator.clipboard.writeText(markdownReport);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">Intelligence Reports & Export Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Generate executive dossiers, city compensation benchmarks, and structured Big Data dumps from HDFS & PySpark.
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'preview' ? 'bg-sky-500 text-slate-950 font-semibold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Executive Brief & Preview
          </button>
          <button
            onClick={() => setActiveTab('data-exports')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'data-exports' ? 'bg-sky-500 text-slate-950 font-semibold shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Structured Data Dumps (CSV/JSON)
          </button>
        </div>
      </div>

      {activeTab === 'preview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Report Controls */}
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>Report Customizer</span>
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {totalCount.toLocaleString()} Postings
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Report Title</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Author / Lead Team</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Executive Memo</label>
                <textarea
                  rows={3}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Strategic notes for C-suite..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              {/* Sections Checklist */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Sections Included</label>
                <div className="space-y-2 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={incKpis}
                      onChange={(e) => setIncKpis(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                    />
                    <span>1. Executive Summary & KPIs</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={incCities}
                      onChange={(e) => setIncCities(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                    />
                    <span>2. Regional Tech Hub Benchmarks</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={incSkills}
                      onChange={(e) => setIncSkills(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                    />
                    <span>3. Top Skills Market Saturation</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={incRoles}
                      onChange={(e) => setIncRoles(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                    />
                    <span>4. Role & Seniority Breakdown</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={incAlgorithms}
                      onChange={(e) => setIncAlgorithms(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-950 text-sky-500 focus:ring-0"
                    />
                    <span>5. Big Data Algorithmic Defense</span>
                  </label>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <button
                  onClick={handleDownloadMarkdown}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Markdown (.md)</span>
                </button>

                <button
                  onClick={handleDownloadHtml}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download Printable HTML / PDF</span>
                </button>

                <button
                  onClick={handleCopyClipboard}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Brief to Clipboard'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Styled Preview */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
              {/* Header preview */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
                    Executive Briefing Document
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-100 mt-2">{reportTitle}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Prepared by <span className="text-slate-300 font-medium">{author}</span> | Big Data Stack: Spark &middot; HDFS &middot; MongoDB
                </p>
              </div>

              {/* Memo */}
              {memo.trim() && (
                <div className="bg-sky-950/20 border-l-2 border-sky-400 p-3 rounded-r-lg text-xs text-slate-300 leading-relaxed">
                  <strong className="text-sky-300 block mb-0.5 font-medium">Strategic Memo:</strong>
                  {memo}
                </div>
              )}

              {/* KPI Grid */}
              {incKpis && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    1. Key Performance Indicators
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Total Postings</div>
                      <div className="text-lg font-bold text-slate-100 mt-0.5">{totalCount.toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-400">Indexed</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Top Skill</div>
                      <div className="text-lg font-bold text-sky-400 mt-0.5 truncate">{topSkills[0]?.skill || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400">High Velocity</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Mean CTC</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5">₹{avgLpa.toFixed(1)} LPA</div>
                      <div className="text-[10px] text-slate-400">Market Avg</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg text-center">
                      <div className="text-[10px] text-slate-400 uppercase">Scam Intercept</div>
                      <div className="text-lg font-bold text-rose-400 mt-0.5">{spamRate.toFixed(1)}%</div>
                      <div className="text-[10px] text-slate-400">Bloom Filter</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Regional Benchmarks */}
              {incCities && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    2. Regional Tech Hub Benchmarks (₹ LPA)
                  </h4>
                  <div className="border border-slate-800 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950 text-slate-400 font-mono text-[10px]">
                        <tr>
                          <th className="py-2 px-3">City</th>
                          <th className="py-2 px-3">Openings</th>
                          <th className="py-2 px-3">Mean CTC</th>
                          <th className="py-2 px-3">Median CTC</th>
                          <th className="py-2 px-3">Range</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {cityStats.map((c) => (
                          <tr key={c.city} className="hover:bg-slate-800/20">
                            <td className="py-2 px-3 font-medium text-slate-200">{c.city}</td>
                            <td className="py-2 px-3 text-slate-400">{c.count.toLocaleString()}</td>
                            <td className="py-2 px-3 text-sky-400 font-medium">₹{c.avgLpa.toFixed(2)} LPA</td>
                            <td className="py-2 px-3 text-slate-300">₹{c.medianLpa.toFixed(2)} LPA</td>
                            <td className="py-2 px-3 text-slate-400">₹{c.minLpa.toFixed(1)} - ₹{c.maxLpa.toFixed(1)} LPA</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Skills Saturation */}
              {incSkills && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    3. High-Velocity Skills Ranking
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {topSkills.slice(0, 8).map((s, idx) => (
                      <div key={s.skill} className="bg-slate-950 border border-slate-800/70 p-2.5 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500">#{idx + 1}</span>
                          <span className="font-medium text-slate-200">{s.skill}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-sky-400 h-full rounded-full" style={{ width: `${Math.min(s.pct * 2, 100)}%` }} />
                          </div>
                          <span className="font-mono text-slate-400 text-[11px]">{s.pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Algorithm Summary */}
              {incAlgorithms && (
                <div className="border-t border-slate-800 pt-4 text-xs text-slate-400 space-y-1.5">
                  <h4 className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                    5. Big Data Algorithmic Defense Telemetry
                  </h4>
                  <p>
                    Scam defense secured via <strong>Bloom Filter</strong> with bit capacity $m=50,000$ and $k=5$ hash functions, isolating placement consultancies. Continuous stream trends monitored via <strong>DGIM sliding window</strong> with $O(\log^2 N)$ memory footprint.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Structured Big Data Exports Tab */
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-1">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Structured Data Dumps for Downstream Analytics</span>
            </h3>
            <p className="text-xs text-slate-400">
              Export raw cleaned postings or aggregated matrices for use in Jupyter Notebooks, Spark MLlib training jobs, Pandas, or PowerBI dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Filtered Jobs CSV */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">1. Filtered Requisitions (CSV)</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Complete tabular dataset of all {totalCount.toLocaleString()} currently filtered postings including role, city, salary LPA, bracket, and skills tokens.
                  </p>
                </div>
                <span className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
                  <Table className="w-4 h-4" />
                </span>
              </div>
              <button
                onClick={handleDownloadPostingsCsv}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Postings Dataset (.csv)</span>
              </button>
            </div>

            {/* Card 2: City Benchmarks CSV */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">2. Regional Compensation Matrix (CSV)</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    City-level aggregation showing total posting counts, mean CTC, median CTC, and salary min/max spreads across Indian hubs.
                  </p>
                </div>
                <span className="p-2 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg">
                  <MapPin className="w-4 h-4" />
                </span>
              </div>
              <button
                onClick={handleDownloadCitiesCsv}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export City Benchmarks (.csv)</span>
              </button>
            </div>

            {/* Card 3: Skills Frequency CSV */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">3. Technology Skills Frequency (CSV)</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Aggregated frequency ranking of all technology tokens extracted from job descriptions, including penetration percentages.
                  </p>
                </div>
                <span className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
                  <Cpu className="w-4 h-4" />
                </span>
              </div>
              <button
                onClick={handleDownloadSkillsCsv}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Skills Frequency (.csv)</span>
              </button>
            </div>

            {/* Card 4: Full JSON Intelligence Snapshot */}
            <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">4. Machine-Readable Intelligence Snapshot (JSON)</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Hierarchical JSON snapshot with pipeline metadata, KPI summaries, city distribution, top skills, and sample records.
                  </p>
                </div>
                <span className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                  <Layers className="w-4 h-4" />
                </span>
              </div>
              <button
                onClick={handleDownloadJson}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Snapshot (.json)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
