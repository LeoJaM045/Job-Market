import React, { useState, useMemo } from 'react';
import { JobPosting } from '../types';
import { ALL_SKILLS } from '../mockData';
import { Sliders, HelpCircle, Layers, Check } from 'lucide-react';

interface SkillsPageProps {
  postings: JobPosting[];
}

export const SkillsPage: React.FC<SkillsPageProps> = ({ postings }) => {
  const [topN, setTopN] = useState<number>(10);
  const [selectedPair, setSelectedPair] = useState<[string, string] | null>(null);

  // Frequency of each skill across filtered postings
  const skillFrequencies = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of postings) {
      for (const s of p.skills) {
        counts[s] = (counts[s] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count);
  }, [postings]);

  const topSkills = useMemo(() => {
    return skillFrequencies.slice(0, topN);
  }, [skillFrequencies, topN]);

  const topSkillNames = useMemo(() => {
    return topSkills.map((s) => s.skill);
  }, [topSkills]);

  // Heatmap matrix skills (top 8 or 10)
  const matrixSkills = useMemo(() => {
    return skillFrequencies.slice(0, 10).map((s) => s.skill);
  }, [skillFrequencies]);

  // Compute co-occurrence matrix
  const coOccurrenceMatrix = useMemo(() => {
    const matrix: number[][] = [];
    const n = matrixSkills.length;
    for (let i = 0; i < n; i++) {
      matrix.push(new Array(n).fill(0));
    }

    for (const p of postings) {
      const pSkills = new Set(p.skills);
      for (let i = 0; i < n; i++) {
        const s1 = matrixSkills[i];
        if (!pSkills.has(s1)) continue;
        for (let j = 0; j < n; j++) {
          const s2 = matrixSkills[j];
          if (pSkills.has(s2)) {
            matrix[i][j]++;
          }
        }
      }
    }
    return matrix;
  }, [matrixSkills, postings]);

  // Max co-occurrence for color scale
  const maxCoOccurrence = useMemo(() => {
    let maxVal = 1;
    for (let i = 0; i < coOccurrenceMatrix.length; i++) {
      for (let j = 0; j < coOccurrenceMatrix[i].length; j++) {
        if (i !== j && coOccurrenceMatrix[i][j] > maxVal) {
          maxVal = coOccurrenceMatrix[i][j];
        }
      }
    }
    return maxVal;
  }, [coOccurrenceMatrix]);

  // Selected pair stats
  const pairStats = useMemo(() => {
    if (!selectedPair) {
      const def1 = matrixSkills[0] || 'PySpark';
      const def2 = matrixSkills[1] || 'AWS';
      return { s1: def1, s2: def2, count: 0, pct: 0, samples: [] };
    }
    const [s1, s2] = selectedPair;
    const matching = postings.filter(
      (p) => p.skills.includes(s1) && p.skills.includes(s2)
    );
    const pct = postings.length > 0 ? (matching.length / postings.length) * 100 : 0;
    return {
      s1,
      s2,
      count: matching.length,
      pct,
      samples: matching.slice(0, 3),
    };
  }, [selectedPair, matrixSkills, postings]);

  const maxFreq = topSkills.length > 0 ? topSkills[0].count : 1;

  return (
    <div className="space-y-6">
      {/* Intro banner */}
      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 font-medium text-slate-200 mb-1">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>PySpark Tokenization & Frequent Pattern Mining (FP-Growth Equivalent)</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          Job requisition skill requirements parsed via regex tokenizers in PySpark, vectorized, and analyzed for co-occurrence affinities to understand tech stack synergy (e.g. PySpark + AWS + Kafka).
        </p>
      </div>

      {/* Control bar for Top N */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-slate-900/90 border border-slate-800">
        <div className="flex items-center gap-3">
          <Sliders className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-slate-200">
            Top N In-Demand Skills Display:
          </span>
          <span className="text-xs font-mono font-bold text-sky-400 px-2 py-0.5 bg-sky-950 border border-sky-800 rounded">
            N = {topN}
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-64">
          <input
            type="range"
            min={5}
            max={18}
            value={topN}
            onChange={(e) => setTopN(parseInt(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer"
          />
          <span className="text-xs font-mono text-slate-400 w-6 text-right">18</span>
        </div>
      </div>

      {/* Top N Skills Bar Chart */}
      <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800/90">
        <h3 className="text-sm font-semibold text-slate-200 mb-1">
          Top {topN} Skills Across Ingested Postings
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Frequency of technology mention in current requisition subset
        </p>

        <div className="space-y-2.5">
          {topSkills.map((item, idx) => {
            const widthPct = Math.round((item.count / maxFreq) * 100);
            const overallPct = ((item.count / (postings.length || 1)) * 100).toFixed(1);
            return (
              <div key={item.skill} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-mono w-5 text-right">
                      #{idx + 1}
                    </span>
                    <span className="font-medium text-slate-200">{item.skill}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-slate-400">
                    <span className="text-sky-400 font-semibold">{item.count.toLocaleString()}</span>
                    <span className="text-slate-500 text-[11px]">({overallPct}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${widthPct}%` }}
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Skill Co-occurrence Matrix / Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-5 rounded-lg bg-slate-900/90 border border-slate-800/90">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                Pairwise Skill Co-occurrence Matrix (Heatmap)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any cell to inspect dual-requirement job listings
              </p>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Top 10 Tech Vector
            </span>
          </div>

          {/* Heatmap Grid */}
          <div className="overflow-x-auto pb-2">
            <div className="inline-block min-w-full">
              {/* Header row */}
              <div className="flex">
                <div className="w-24 shrink-0" />
                {matrixSkills.map((colSkill) => (
                  <div
                    key={colSkill}
                    className="w-16 shrink-0 text-center text-[10px] font-mono text-slate-400 truncate px-1 py-1"
                    title={colSkill}
                  >
                    {colSkill.substring(0, 7)}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {matrixSkills.map((rowSkill, rIdx) => (
                <div key={rowSkill} className="flex items-center">
                  <div
                    className="w-24 shrink-0 text-right pr-2 text-[11px] font-mono text-slate-300 truncate"
                    title={rowSkill}
                  >
                    {rowSkill}
                  </div>
                  {matrixSkills.map((colSkill, cIdx) => {
                    const val = coOccurrenceMatrix[rIdx][cIdx];
                    const isDiag = rIdx === cIdx;
                    const isSelected =
                      selectedPair &&
                      ((selectedPair[0] === rowSkill && selectedPair[1] === colSkill) ||
                        (selectedPair[0] === colSkill && selectedPair[1] === rowSkill));

                    // Color calculation
                    const intensity = isDiag
                      ? 0.15
                      : Math.min(1, Math.max(0.1, val / maxCoOccurrence));
                    const bgStyle = isDiag
                      ? 'rgba(71, 85, 105, 0.3)'
                      : `rgba(14, 165, 233, ${intensity})`;

                    return (
                      <button
                        key={colSkill}
                        onClick={() => setSelectedPair([rowSkill, colSkill])}
                        style={{ backgroundColor: bgStyle }}
                        className={`w-16 h-10 shrink-0 m-0.5 rounded text-[11px] font-mono font-medium transition-all flex items-center justify-center ${
                          isSelected
                            ? 'ring-2 ring-amber-400 text-white z-10'
                            : 'text-slate-200 hover:ring-1 hover:ring-sky-400'
                        }`}
                        title={`${rowSkill} + ${colSkill}: ${val} postings`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Co-occurrence Details Panel */}
        <div className="lg:col-span-4 p-5 rounded-lg bg-slate-900/90 border border-slate-800/90 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Affinity Pair Deep Dive
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Joint requisition presence & demand synergy
            </p>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 mb-4">
              <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-100 font-mono">
                <span className="text-sky-400">{pairStats.s1}</span>
                <span className="text-slate-600">+</span>
                <span className="text-emerald-400">{pairStats.s2}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center border-t border-slate-800/80 pt-2">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Co-occurrences</div>
                  <div className="text-lg font-bold font-mono text-slate-100">
                    {pairStats.count}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Joint Demand</div>
                  <div className="text-lg font-bold font-mono text-amber-400">
                    {pairStats.pct.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs font-semibold text-slate-300 mb-2">
              Representative Postings Requiring Both:
            </div>
            <div className="space-y-2">
              {pairStats.samples.length > 0 ? (
                pairStats.samples.map((s) => (
                  <div
                    key={s.jobId}
                    className="p-2.5 rounded bg-slate-950/60 border border-slate-800/60 text-xs"
                  >
                    <div className="font-medium text-slate-200 truncate">{s.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {s.company} · ₹{s.salaryLpa} LPA · {s.city}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic py-2">
                  No co-occurring postings found for current filter.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
            Computed across {postings.length.toLocaleString()} active MongoDB documents.
          </div>
        </div>
      </div>
    </div>
  );
};
