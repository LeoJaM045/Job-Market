import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  Radio,
  TrendingUp,
  Database,
  Filter,
  CheckCircle2,
  RefreshCw,
  Search,
  FileText,
} from 'lucide-react';
import { Role, ExperienceLevel, CompanyType, FilterState } from '../types';
import { ALL_ROLES, ALL_CITIES, ALL_COMPANY_TYPES, ALL_EXPERIENCE_LEVELS } from '../mockData';

export type NavPage =
  | 'overview'
  | 'skills'
  | 'streaming'
  | 'salary-ml'
  | 'reports';

interface SidebarProps {
  currentPage: NavPage;
  onPageChange: (page: NavPage) => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onResetFilters: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onPageChange,
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  const navItems: { id: NavPage; label: string; icon: React.ReactNode }[] = [
    {
      id: 'overview',
      label: '1. Overview & Summary',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'skills',
      label: '2. In-Demand Skills',
      icon: <Cpu className="w-4 h-4" />,
    },
    {
      id: 'streaming',
      label: '3. Streaming & Spikes',
      icon: <Radio className="w-4 h-4" />,
    },
    {
      id: 'salary-ml',
      label: '4. Salary Insights & ML',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'reports',
      label: '5. Reports & Export',
      icon: <FileText className="w-4 h-4" />,
    },
  ];

  const handleRoleToggle = (role: Role) => {
    const nextRoles = filters.roles.includes(role)
      ? filters.roles.filter((r) => r !== role)
      : [...filters.roles, role];
    onFilterChange({ ...filters, roles: nextRoles.length ? nextRoles : [role] });
  };

  const handleCityToggle = (city: string) => {
    const nextCities = filters.cities.includes(city)
      ? filters.cities.filter((c) => c !== city)
      : [...filters.cities, city];
    onFilterChange({ ...filters, cities: nextCities.length ? nextCities : [city] });
  };

  const handleCompTypeToggle = (type: CompanyType) => {
    const nextTypes = filters.companyTypes.includes(type)
      ? filters.companyTypes.filter((t) => t !== type)
      : [...filters.companyTypes, type];
    onFilterChange({ ...filters, companyTypes: nextTypes.length ? nextTypes : [type] });
  };

  const handleExpToggle = (exp: ExperienceLevel) => {
    const nextExp = filters.experienceLevels.includes(exp)
      ? filters.experienceLevels.filter((e) => e !== exp)
      : [...filters.experienceLevels, exp];
    onFilterChange({ ...filters, experienceLevels: nextExp.length ? nextExp : [exp] });
  };

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Streamlit Navigation Section */}
      <div className="p-4 border-b border-slate-900">
        <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2 px-1">
          Navigation Modules
        </div>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className={isActive ? 'text-sky-400' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-Time Ingestion Source Controller */}
      <div className="p-4 border-b border-slate-900">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Data Ingestion Stream
          </span>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            LIVE API
          </span>
        </div>
        <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-xs space-y-2">
          <div className="text-[11px] text-slate-300 font-medium">
            Active Feed: <span className="text-emerald-400">Arbeitnow & Jobicy REST APIs</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Streaming live tech requisitions mapped into Indian tech corridors.
          </p>
          <button
            onClick={() => {
              onResetFilters();
            }}
            className="w-full py-1.5 px-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Pull Fresh Live Stream</span>
          </button>
        </div>
      </div>

      {/* Storage & Serving Status */}
      <div className="p-4 border-b border-slate-900">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Storage & Serving
          </span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <CheckCircle2 className="w-3 h-3" />
            LIVE
          </span>
        </div>
        <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              MongoDB Cluster
            </span>
            <span className="text-[10px] text-slate-400 font-mono">v7.0</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            DB: <code className="text-sky-300">indian_job_intelligence_db</code>
            <br />
            Collections: <span className="text-slate-300">indian_postings, stream_metrics</span>
          </p>
        </div>
      </div>

      {/* Interactive Global Filters */}
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Indian Market Filters
          </span>
          <button
            onClick={onResetFilters}
            className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Reset
          </button>
        </div>

        {/* Search keyword */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Search Requisitions</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="e.g. PySpark, Bengaluru, Flipkart..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* Roles Filter */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1.5">
            Role ({filters.roles.length}/{ALL_ROLES.length})
          </label>
          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
            {ALL_ROLES.map((role) => {
              const checked = filters.roles.includes(role);
              return (
                <label
                  key={role}
                  className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleRoleToggle(role)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="truncate">{role}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Tech Hubs / City */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1.5">
            Tech Hub ({filters.cities.length}/{ALL_CITIES.length})
          </label>
          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
            {ALL_CITIES.map((city) => {
              const checked = filters.cities.includes(city);
              return (
                <label
                  key={city}
                  className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleCityToggle(city)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="truncate">{city}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Company Types */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1.5">
            Sector / Company Type
          </label>
          <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
            {ALL_COMPANY_TYPES.map((type) => {
              const checked = filters.companyTypes.includes(type);
              return (
                <label
                  key={type}
                  className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleCompTypeToggle(type)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="truncate">{type.split('(')[0]}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Experience Level */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1.5">
            Experience Tier
          </label>
          <div className="space-y-1">
            {ALL_EXPERIENCE_LEVELS.map((exp) => {
              const checked = filters.experienceLevels.includes(exp);
              return (
                <label
                  key={exp}
                  className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => handleExpToggle(exp)}
                    className="rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-0 w-3.5 h-3.5"
                  />
                  <span className="truncate">{exp}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-3 border-t border-slate-900 text-[11px] text-slate-500 font-mono text-center">
        Indian Tech Stream · Streamlit 3.10+
      </div>
    </aside>
  );
};
