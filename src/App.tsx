import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavPage } from './components/Sidebar';
import { OverviewPage } from './components/OverviewPage';
import { SkillsPage } from './components/SkillsPage';
import { StreamingPage } from './components/StreamingPage';
import { SalaryMLPage } from './components/SalaryMLPage';
import { SourceCodeModal } from './components/SourceCodeModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import {
  generateJobPostings,
  ALL_ROLES,
  ALL_CITIES,
  ALL_COMPANY_TYPES,
  ALL_EXPERIENCE_LEVELS,
} from './mockData';
import { FilterState } from './types';
import { ClientBloomFilter, ClientDGIMStream } from './algorithms';
import appPyRaw from '/app.py?raw';

export default function App() {
  const [currentPage, setCurrentPage] = useState<NavPage>('overview');
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);
  const [isArchModalOpen, setIsArchModalOpen] = useState(false);

  // Initialize dataset for Indian Tech Hubs
  const allPostings = useMemo(() => generateJobPostings(2400), []);

  // Initialize filters
  const [filters, setFilters] = useState<FilterState>({
    roles: ALL_ROLES,
    cities: ALL_CITIES,
    companyTypes: ALL_COMPANY_TYPES,
    experienceLevels: ALL_EXPERIENCE_LEVELS,
    dateRangeDays: 90,
    searchQuery: '',
  });

  // Initialize Algorithmic State
  const [bloomFilter] = useState<ClientBloomFilter>(() => {
    const bf = new ClientBloomFilter(12000, 4);
    // Populate with simulated known Indian placement consultancy scam signatures
    for (let i = 1; i <= 40; i++) {
      bf.add(`CONS-FAKE-PLACEMENT-${String(i).padStart(3, '0')}`);
    }
    return bf;
  });

  const [dgimStream] = useState<ClientDGIMStream>(() => {
    const dgim = new ClientDGIMStream(100);
    // Seed with 100 historical ticks
    for (let i = 0; i < 100; i++) {
      dgim.update(Math.random() < 0.30 ? 1 : 0);
    }
    return dgim;
  });

  const [, setAlgRenderTick] = useState(0);
  const triggerAlgRefresh = () => setAlgRenderTick((t) => t + 1);

  // Filter postings reactively
  const filteredPostings = useMemo(() => {
    return allPostings.filter((p) => {
      if (filters.roles.length > 0 && !filters.roles.includes(p.role)) {
        return false;
      }
      if (filters.cities.length > 0 && !filters.cities.includes(p.city)) {
        return false;
      }
      if (filters.companyTypes.length > 0 && !filters.companyTypes.includes(p.companyType)) {
        return false;
      }
      if (
        filters.experienceLevels.length > 0 &&
        !filters.experienceLevels.includes(p.experienceLevel)
      ) {
        return false;
      }
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesRole = p.role.toLowerCase().includes(query);
        const matchesSkills = p.skills.some((s) => s.toLowerCase().includes(query));
        const matchesCompany = p.company.toLowerCase().includes(query);
        const matchesCity = p.city.toLowerCase().includes(query);
        if (!matchesTitle && !matchesRole && !matchesSkills && !matchesCompany && !matchesCity) {
          return false;
        }
      }
      return true;
    });
  }, [allPostings, filters]);

  const handleResetFilters = () => {
    setFilters({
      roles: ALL_ROLES,
      cities: ALL_CITIES,
      companyTypes: ALL_COMPANY_TYPES,
      experienceLevels: ALL_EXPERIENCE_LEVELS,
      dateRangeDays: 90,
      searchQuery: '',
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Bar Header */}
      <Header
        onOpenSourceModal={() => setIsSourceModalOpen(true)}
        onOpenArchModal={() => setIsArchModalOpen(true)}
        totalFiltered={filteredPostings.length}
      />

      {/* Main Workspace: Sidebar + Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={handleResetFilters}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto">
            {currentPage === 'overview' && (
              <OverviewPage
                postings={filteredPostings}
                totalRawCount={allPostings.length}
              />
            )}

            {currentPage === 'skills' && (
              <SkillsPage postings={filteredPostings} />
            )}

            {currentPage === 'streaming' && (
              <StreamingPage
                bloomFilter={bloomFilter}
                dgimStream={dgimStream}
                onRefreshDGIM={triggerAlgRefresh}
                onRefreshBloom={triggerAlgRefresh}
              />
            )}

            {currentPage === 'salary-ml' && (
              <SalaryMLPage postings={filteredPostings} />
            )}
          </div>
        </main>
      </div>

      {/* Source Code Modal */}
      <SourceCodeModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        appPyContent={appPyRaw}
      />

      {/* Architecture Modal */}
      <ArchitectureModal
        isOpen={isArchModalOpen}
        onClose={() => setIsArchModalOpen(false)}
      />
    </div>
  );
}
