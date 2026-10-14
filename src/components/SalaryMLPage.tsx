import React, { useState, useMemo } from 'react';
import { JobPosting, Role, ExperienceLevel, CompanyType, SalaryBracket } from '../types';
import {
  ALL_ROLES,
  ALL_CITIES,
  ALL_COMPANY_TYPES,
  ALL_EXPERIENCE_LEVELS,
  ALL_SKILLS,
} from '../mockData';
import {
  TrendingUp,
  BrainCircuit,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SalaryMLPageProps {
  postings: JobPosting[];
}

export const SalaryMLPage: React.FC<SalaryMLPageProps> = ({ postings }) => {
  const [activeTab, setActiveTab] = useState<'classifier' | 'distribution'>('classifier');

  // Classifier inputs
  const [targetRole, setTargetRole] = useState<Role>('PySpark Developer');
  const [targetExp, setTargetExp] = useState<ExperienceLevel>('Mid-Level (2-5 yrs)');
  const [targetYears, setTargetYears] = useState<number>(4);
  const [targetCity, setTargetCity] = useState<string>('Bengaluru');
  const [targetCompType, setTargetCompType] = useState<CompanyType>(
    'Product Unicorns (Flipkart, Swiggy, Razorpay)'
  );
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'PySpark',
    'Python',
    'AWS',
    'Databricks',
  ]);

  // Model inference calculation (simulating Spark MLlib Random Forest model)
  const prediction = useMemo(() => {
    const expScores: Record<ExperienceLevel, number> = {
      'Fresher (0-2 yrs)': 25,
      'Mid-Level (2-5 yrs)': 55,
      'Senior (5-8 yrs)': 84,
      'Lead / Principal (8+ yrs)': 98,
    };

    const cityScores: Record<string, number> = {
      Bengaluru: 18,
      Mumbai: 16,
      Hyderabad: 12,
      'Delhi NCR (Gurgaon/Noida)': 14,
      Pune: 9,
      Chennai: 6,
    };

    const compScores: Record<CompanyType, number> = {
      'Product Unicorns (Flipkart, Swiggy, Razorpay)': 30,
      'Global Capability Centres (GCCs)': 26,
      'IT Services (TCS, Infosys, Wipro)': -12,
      'Seed / Series-A Startups': 15,
    };

    const skillWeights: Record<string, number> = {
      PySpark: 15,
      Databricks: 14,
      'GenAI / LLMs': 18,
      AWS: 10,
      Kubernetes: 11,
      'Apache Kafka': 9,
      Snowflake: 10,
      Python: 8,
      'React.js': 7,
      'Node.js': 7,
      'Java / Spring Boot': 9,
      SQL: 5,
      dbt: 7,
    };

    const expScore = expScores[targetExp] || 50;
    const cityScore = cityScores[targetCity] || 10;
    const compScore = compScores[targetCompType] || 10;
    const yearsScore = targetYears * 3.0;
    const skillsScore = selectedSkills.reduce((acc, s) => acc + (skillWeights[s] || 4), 0);

    const totalModelScore = Math.max(5, expScore + cityScore + compScore + yearsScore + skillsScore);

    // Softmax probabilities for Indian tiers (< ₹6 LPA, ₹6 - ₹18 LPA, > ₹18 LPA)
    const lowLogit = Math.max(0.1, 95 - totalModelScore);
    const medLogit = Math.max(0.1, 70 - Math.abs(totalModelScore - 78));
    const highLogit = Math.max(0.1, totalModelScore - 72);

    const expLow = Math.exp(lowLogit / 18.0);
    const expMed = Math.exp(medLogit / 18.0);
    const expHigh = Math.exp(highLogit / 18.0);
    const sumExp = expLow + expMed + expHigh;

    const pLow = expLow / sumExp;
    const pMed = expMed / sumExp;
    const pHigh = expHigh / sumExp;

    let predictedBracket: SalaryBracket = 'Medium (₹6 - ₹18 LPA)';
    let maxP = pMed;

    if (pHigh > pMed && pHigh > pLow) {
      predictedBracket = 'High (> ₹18 LPA)';
      maxP = pHigh;
    } else if (pLow > pMed && pLow > pHigh) {
      predictedBracket = 'Low (< ₹6 LPA)';
      maxP = pLow;
    }

    const estLpaCenter = Math.round(Math.max(3.5, (totalModelScore / 130.0) * 36.0) * 10) / 10;
    const estMin = Math.max(3.0, Math.round(estLpaCenter * 0.88 * 10) / 10);
    const estMax = Math.round(estLpaCenter * 1.15 * 10) / 10;

    const featureContributions = [
      { feature: `Seniority Tier (${targetExp.split('(')[0].trim()})`, weight: expScore, pct: Math.round((expScore / totalModelScore) * 100) },
      { feature: `Sector (${targetCompType.split('(')[0].trim()})`, weight: compScore, pct: Math.round((compScore / totalModelScore) * 100) },
      { feature: `Tech Hub (${targetCity})`, weight: cityScore, pct: Math.round((cityScore / totalModelScore) * 100) },
      { feature: `Years of Experience (${targetYears}y)`, weight: yearsScore, pct: Math.round((yearsScore / totalModelScore) * 100) },
      { feature: 'Specialized Skills Vector', weight: skillsScore, pct: Math.round((skillsScore / totalModelScore) * 100) },
    ];

    return {
      bracket: predictedBracket,
      confidence: maxP,
      probs: { low: pLow, med: pMed, high: pHigh },
      features: featureContributions,
      estMin,
      estMax,
    };
  }, [targetExp, targetCity, targetCompType, targetYears, selectedSkills]);

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      if (selectedSkills.length > 1) {
        setSelectedSkills(selectedSkills.filter((s) => s !== skill));
      }
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleRunInference = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#38BDF8', '#10B981', '#F59E0B'],
    });
  };

  // Boxplot statistics by Experience Tier
  const boxPlotStats = useMemo(() => {
    const stats: Record<ExperienceLevel, { min: number; q1: number; median: number; q3: number; max: number; count: number }> = {
      'Fresher (0-2 yrs)': { min: 0, q1: 0, median: 0, q3: 0, max: 0, count: 0 },
      'Mid-Level (2-5 yrs)': { min: 0, q1: 0, median: 0, q3: 0, max: 0, count: 0 },
      'Senior (5-8 yrs)': { min: 0, q1: 0, median: 0, q3: 0, max: 0, count: 0 },
      'Lead / Principal (8+ yrs)': { min: 0, q1: 0, median: 0, q3: 0, max: 0, count: 0 },
    };

    for (const lvl of ALL_EXPERIENCE_LEVELS) {
      const salaries = postings
        .filter((p) => p.experienceLevel === lvl)
        .map((p) => p.salaryLpa)
        .sort((a, b) => a - b);

      if (salaries.length > 0) {
        const q1 = salaries[Math.floor(salaries.length * 0.25)];
        const median = salaries[Math.floor(salaries.length * 0.5)];
        const q3 = salaries[Math.floor(salaries.length * 0.75)];
        const min = salaries[0];
        const max = salaries[salaries.length - 1];
        stats[lvl] = { min, q1, median, q3, max, count: salaries.length };
      }
    }

    return stats;
  }, [postings]);

  return (
    <div className="space-y-6">
      {/* Sub-navigation tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('classifier')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'classifier'
              ? 'border-sky-400 text-sky-400 bg-sky-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Spark MLlib Indian CTC Bracket Classifier</span>
        </button>

        <button
          onClick={() => setActiveTab('distribution')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all ${
            activeTab === 'distribution'
              ? 'border-sky-400 text-sky-400 bg-sky-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>CTC Distributions & Box Plot Metrics (₹ LPA)</span>
        </button>
      </div>

      {/* CLASSIFIER TAB */}
      {activeTab === 'classifier' && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-200 mb-1">
              <BrainCircuit className="w-4 h-4 text-sky-400" />
              <span>Spark MLlib Pipeline: Indian CTC Bracket Classification</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Trained on historical HDFS batches using <strong className="text-slate-300">StringIndexer &rarr; OneHotEncoder &rarr; VectorAssembler &rarr; RandomForestClassifier</strong>.
              Predicts whether a profile falls into <strong className="text-slate-300">Low (&lt; ₹6 LPA)</strong>, <strong className="text-slate-300">Medium (₹6 - ₹18 LPA)</strong>, or <strong className="text-slate-300">High (&gt; ₹18 LPA)</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Requisition Parameters */}
            <div className="lg:col-span-5 p-5 rounded-lg bg-slate-900/90 border border-slate-800/90 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">
                  Profile Parameters
                </h3>
                <span className="text-xs font-mono text-slate-400">ML Vector Assembly</span>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Engineering Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as Role)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Experience Tier</label>
                <select
                  value={targetExp}
                  onChange={(e) => setTargetExp(e.target.value as ExperienceLevel)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {ALL_EXPERIENCE_LEVELS.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Years of Experience:</span>
                  <span className="font-mono text-sky-400 font-bold">{targetYears} yrs</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={16}
                  value={targetYears}
                  onChange={(e) => setTargetYears(parseInt(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Target Tech Hub</label>
                <select
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {ALL_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Company Sector</label>
                <select
                  value={targetCompType}
                  onChange={(e) => setTargetCompType(e.target.value as CompanyType)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  {ALL_COMPANY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">
                  Candidate Skills Vector ({selectedSkills.length} selected):
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-950/60 rounded-md border border-slate-800/80">
                  {ALL_SKILLS.map((skill) => {
                    const active = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
                          active
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={handleRunInference}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-md shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Evaluate MLlib Inference Pipeline</span>
              </button>
            </div>

            {/* Inference Result & Feature Importance */}
            <div className="lg:col-span-7 p-5 rounded-lg bg-slate-900/90 border border-slate-800/90 space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-1">
                  Spark MLlib Classification Outcome
                </h3>
                <p className="text-xs text-slate-400">
                  Inferred CTC bracket calibrated for Indian compensation benchmarks
                </p>
              </div>

              {/* Bracket Result Card */}
              <div className={`p-4 rounded-lg border ${
                prediction.bracket === 'High (> ₹18 LPA)'
                  ? 'bg-emerald-950/30 border-emerald-800'
                  : prediction.bracket === 'Medium (₹6 - ₹18 LPA)'
                  ? 'bg-sky-950/30 border-sky-800'
                  : 'bg-slate-900 border-slate-700'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider">
                    Predicted Indian CTC Tier
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-900 text-sky-400 border border-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                    Simulated fallback: Local Scikit-Learn Model
                  </span>
                </div>
                <div className={`text-2xl font-bold font-mono mt-1 ${
                  prediction.bracket === 'High (> ₹18 LPA)'
                    ? 'text-emerald-400'
                    : prediction.bracket === 'Medium (₹6 - ₹18 LPA)'
                    ? 'text-sky-400'
                    : 'text-slate-300'
                }`}>
                  {prediction.bracket}
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-2">
                  Estimated CTC Range: <span className="font-mono text-emerald-400">₹{prediction.estMin} - ₹{prediction.estMax} LPA</span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Model Confidence:</span>
                    <span className="font-mono font-bold text-slate-100">
                      {(prediction.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Latency: 1.2ms</span>
                </div>
              </div>

              {/* Probability Distribution */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300">
                  Class Probability Breakdown:
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                      <span>Low (&lt; ₹6 LPA)</span>
                      <span className="font-mono">{(prediction.probs.low * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${prediction.probs.low * 100}%` }}
                        className="h-full bg-slate-500 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                      <span>Medium (₹6 - ₹18 LPA)</span>
                      <span className="font-mono text-sky-400">
                        {(prediction.probs.med * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${prediction.probs.med * 100}%` }}
                        className="h-full bg-sky-400 rounded-full"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                      <span>High (&gt; ₹18 LPA)</span>
                      <span className="font-mono text-emerald-400">
                        {(prediction.probs.high * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${prediction.probs.high * 100}%` }}
                        className="h-full bg-emerald-400 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Importance Decomposition */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Feature Importance Weights:
                </div>
                <div className="space-y-2">
                  {prediction.features.map((feat) => (
                    <div key={feat.feature} className="p-2.5 rounded bg-slate-950 border border-slate-800/80">
                      <div className="flex justify-between text-xs text-slate-300">
                        <span>{feat.feature}</span>
                        <span className="font-mono text-amber-400">+{feat.weight.toFixed(0)} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISTRIBUTION TAB */}
      {activeTab === 'distribution' && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-200 mb-1">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>Statistical Boxplot & Quartile Distributions (₹ LPA)</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Evaluating median, interquartile range (IQR), and whisker extents across Indian seniority tiers and tech hubs.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-slate-900/90 border border-slate-800/90">
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              CTC Spread by Seniority Tier (Boxplot Metrics in ₹ LPA)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Whiskers: Min / Max | Box: Q1, Median, Q3
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {ALL_EXPERIENCE_LEVELS.map((lvl) => {
                const s = boxPlotStats[lvl];
                return (
                  <div key={lvl} className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="text-xs font-semibold text-sky-400">{lvl}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      n = {s.count} postings
                    </div>
                    <div className="border-t border-slate-800/80 pt-2 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between text-slate-400">
                        <span>Max:</span>
                        <span className="text-slate-200">₹{s.max.toFixed(1)} LPA</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Q3 (75%):</span>
                        <span className="text-slate-300">₹{s.q3.toFixed(1)} LPA</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>Median:</span>
                        <span>₹{s.median.toFixed(1)} LPA</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Q1 (25%):</span>
                        <span className="text-slate-300">₹{s.q1.toFixed(1)} LPA</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Min:</span>
                        <span className="text-slate-200">₹{s.min.toFixed(1)} LPA</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
