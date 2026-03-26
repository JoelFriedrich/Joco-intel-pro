/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { Property } from './types';
import { PropertyMap } from './components/PropertyMap';
import { PropertyList } from './components/PropertyList';
import { FilterBar } from './components/FilterBar';
import { PropertyDetail } from './components/PropertyDetail';
import { TableView } from './components/TableView';
import { Settings } from './components/Settings';
import { calculateDistressScore, cn } from './lib/utils';
import { Layout, Database, ShieldCheck, Info, Settings as SettingsIcon, X } from 'lucide-react';
import { AppView, UserPlan, SavedFilter } from './types';

export default function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [route, setRoute] = useState(window.location.hash);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [userPlan, setUserPlan] = useState<UserPlan>('Free');
  const [userProfile, setUserProfile] = useState({
    name: 'Joel Friedrich',
    email: 'joelfriedrichdev@gmail.com',
    location: 'Kansas City, MO',
    memberSince: 'March 2026'
  });
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    propClasses: ['R', 'C', 'A'], // Default to exclude E, O, V
    absenteeOnly: false,
    delinquentOnly: false,
    valueRange: 'all',
    customValueMin: '',
    customValueMax: '',
    yearBuilt: 'any',
    customYearMin: '',
    customYearMax: '',
    permitType: 'all',
    sortBy: 'valueDesc',
  });

  // Hash routing listener
  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        // Fetch properties joined with dwelling, tax, and permits
        // Using a limit of 1000 as requested
        const { data, error } = await supabase
          .from('properties')
          .select('*, dwelling(*), tax(*), permits(*)')
          .limit(1000);

        if (error) throw error;
        
        // Normalize data: Supabase joins often return arrays even for 1-to-1 relations
        const normalizedData = (data || []).map(p => ({
          ...p,
          dwelling: Array.isArray(p.dwelling) ? p.dwelling[0] : p.dwelling,
          tax: Array.isArray(p.tax) ? p.tax[0] : p.tax,
        }));
        
        setProperties(normalizedData);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const handleSaveFilter = () => {
    setShowSaveModal(true);
  };

  const confirmSaveFilter = () => {
    if (!newFilterName.trim()) return;
    
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name: newFilterName,
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };
    
    setSavedFilters(prev => [newFilter, ...prev]);
    setNewFilterName('');
    setShowSaveModal(false);
  };

  const handleDownloadCSV = () => {
    if (userPlan === 'Free') {
      alert("CSV Export is a Pro feature. Please upgrade your plan in Settings.");
      return;
    }

    // Simple CSV generation
    const headers = ['Address', 'City', 'Zip', 'Owner', 'Value', 'Year Built', 'Class'];
    const rows = filteredProperties.map(p => [
      p.situs_address,
      p.city,
      p.zip,
      p.owner1_name,
      p.noav_curr_appraised,
      p.year_built || p.dwelling?.pdf_year_built || '',
      p.prop_class
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `plotpoint_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and Sort Logic
  const filteredProperties = useMemo(() => {
    let result = [...properties];

    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(p => 
        p.situs_address?.toLowerCase().includes(searchLower) ||
        p.owner1_name?.toLowerCase().includes(searchLower)
      );
    }

    // Property Class
    if (filters.propClasses.length > 0) {
      result = result.filter(p => filters.propClasses.includes(p.prop_class));
    }

    // Absentee
    if (filters.absenteeOnly) {
      result = result.filter(p => p.owner_absentee);
    }

    // Delinquent
    if (filters.delinquentOnly) {
      result = result.filter(p => p.tax?.tax_is_delinquent);
    }

    // Value Range
    if (filters.valueRange !== 'all') {
      result = result.filter(p => {
        const val = p.noav_curr_appraised;
        if (filters.valueRange === 'under300') return val < 300000;
        if (filters.valueRange === '300-600') return val >= 300000 && val <= 600000;
        if (filters.valueRange === '600-1.2M') return val > 600000 && val <= 1200000;
        if (filters.valueRange === 'over1.2M') return val > 1200000;
        if (filters.valueRange === 'custom') {
          const min = filters.customValueMin ? Number(filters.customValueMin) : 0;
          const max = filters.customValueMax ? Number(filters.customValueMax) : Infinity;
          return val >= min && val <= max;
        }
        return true;
      });
    }

    // Year Built
    if (filters.yearBuilt !== 'any') {
      result = result.filter(p => {
        const year = p.year_built || p.dwelling?.pdf_year_built;
        if (!year) return false;
        if (filters.yearBuilt === 'pre1970') return year < 1970;
        if (filters.yearBuilt === '1970-1990') return year >= 1970 && year <= 1990;
        if (filters.yearBuilt === '1990-2005') return year > 1990 && year <= 2005;
        if (filters.yearBuilt === '2005plus') return year > 2005;
        if (filters.yearBuilt === 'custom') {
          const min = filters.customYearMin ? Number(filters.customYearMin) : 0;
          const max = filters.customYearMax ? Number(filters.customYearMax) : Infinity;
          return year >= min && year <= max;
        }
        return true;
      });
    }

    // Permit Type
    if (filters.permitType !== 'all') {
      result = result.filter(p => {
        const permits = (p as any).permits || [];
        return permits.some((perm: any) => 
          perm.permit_type?.toLowerCase().includes(filters.permitType.toLowerCase())
        );
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (filters.sortBy === 'valueDesc') return (b.noav_curr_appraised || 0) - (a.noav_curr_appraised || 0);
      if (filters.sortBy === 'valueAsc') return (a.noav_curr_appraised || 0) - (b.noav_curr_appraised || 0);
      if (filters.sortBy === 'yearDesc') return (b.year_built || 0) - (a.year_built || 0);
      if (filters.sortBy === 'yearAsc') return (a.year_built || 0) - (b.year_built || 0);
      if (filters.sortBy === 'distressDesc') return calculateDistressScore(b).score - calculateDistressScore(a).score;
      if (filters.sortBy === 'distressAsc') return calculateDistressScore(a).score - calculateDistressScore(b).score;
      
      if (filters.sortBy === 'conditionDesc') return (b.dwelling?.pdf_pct_good || 0) - (a.dwelling?.pdf_pct_good || 0);
      if (filters.sortBy === 'conditionAsc') return (a.dwelling?.pdf_pct_good || 0) - (b.dwelling?.pdf_pct_good || 0);

      if (filters.sortBy === 'yoyAsc' || filters.sortBy === 'yoyDesc') {
        const getYoy = (p: Property) => p.noav_prev_appraised 
          ? ((p.noav_curr_appraised - p.noav_prev_appraised) / p.noav_prev_appraised) 
          : 0;
        const yoyA = getYoy(a);
        const yoyB = getYoy(b);
        return filters.sortBy === 'yoyAsc' ? yoyA - yoyB : yoyB - yoyA;
      }

      return 0;
    });

    return result;
  }, [properties, filters]);

  // Render Detail Page
  if (route.startsWith('#/property/')) {
    const quickRef = route.split('/').pop() || '';
    return (
      <PropertyDetail 
        quickRef={quickRef} 
        onBack={() => window.location.hash = '#/'} 
      />
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-dark-bg">
      {/* Header */}
      <header className="bg-[#16191d] border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => {
            setCurrentView('dashboard');
            window.location.hash = '#/';
          }}
        >
          <div className="w-10 h-10 bg-accent-amber rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(239,159,39,0.3)] group-hover:scale-105 transition-transform">
            <Database className="text-black" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter group-hover:text-accent-amber transition-colors">PlotPoint</h1>
            <div className="flex items-center gap-2 text-[10px] uppercase font-black text-gray-500 tracking-widest">
              <ShieldCheck size={12} className="text-accent-amber" />
              Investor Research Terminal
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] uppercase font-black text-gray-500">Market Status</div>
            <div className="text-xs font-bold text-positive-green flex items-center gap-1 justify-end">
              <div className="w-1.5 h-1.5 rounded-full bg-positive-green animate-pulse" />
              Live Database
            </div>
          </div>
          <div className="h-8 w-px bg-gray-800" />
          <button 
            onClick={() => setCurrentView('settings')}
            className={cn(
              "p-2 rounded-lg transition-all",
              currentView === 'settings' ? "bg-accent-amber text-black" : "text-gray-400 hover:text-white"
            )}
          >
            <SettingsIcon size={20} />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Info size={20} />
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      {currentView !== 'settings' && (
        <FilterBar 
          filters={filters} 
          setFilters={setFilters} 
          resultCount={filteredProperties.length}
          currentView={currentView}
          setCurrentView={setCurrentView}
          onSaveFilter={handleSaveFilter}
          onDownloadCSV={handleDownloadCSV}
          userPlan={userPlan}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="w-12 h-12 border-4 border-accent-amber border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-mono text-sm uppercase tracking-widest">Initializing Terminal...</p>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {currentView === 'dashboard' && (
              <div className="flex-1 flex overflow-hidden">
                <div className="w-[58%] h-full border-r border-gray-800">
                  <PropertyMap 
                    properties={filteredProperties} 
                    selectedProperty={selectedProperty}
                    onSelectProperty={setSelectedProperty}
                  />
                </div>
                <div className="w-[42%] h-full overflow-hidden">
                  <PropertyList 
                    properties={filteredProperties} 
                    selectedProperty={selectedProperty}
                    onSelectProperty={setSelectedProperty}
                  />
                </div>
              </div>
            )}
            {currentView === 'table' && (
              <div className="flex-1 overflow-hidden">
                <TableView 
                  properties={filteredProperties} 
                  onSelectProperty={setSelectedProperty}
                />
              </div>
            )}
            {currentView === 'map' && (
              <div className="flex-1 h-full">
                <PropertyMap 
                  properties={filteredProperties} 
                  selectedProperty={selectedProperty}
                  onSelectProperty={setSelectedProperty}
                />
              </div>
            )}
            {currentView === 'settings' && (
              <div className="flex-1 overflow-hidden">
                <Settings 
                  userPlan={userPlan}
                  setUserPlan={setUserPlan}
                  userProfile={userProfile}
                  setUserProfile={setUserProfile}
                  savedFilters={savedFilters}
                  onDeleteFilter={(id) => setSavedFilters(prev => prev.filter(f => f.id !== id))}
                  onApplyFilter={(f) => {
                    setFilters(f);
                    setCurrentView('dashboard');
                  }}
                  onBack={() => setCurrentView('dashboard')}
                />
              </div>
            )}
          </div>
        )}

        {/* Save Filter Modal */}
        {showSaveModal && (
          <div className="absolute inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#16191d] border border-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">Save Current Filter</h3>
                <button onClick={() => setShowSaveModal(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest block mb-1">Filter Name</label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g., High Distress Kansas City"
                    className="w-full bg-black/40 border border-gray-700 rounded-lg py-2 px-4 text-sm text-white focus:outline-none focus:border-accent-amber"
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmSaveFilter()}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 py-2 px-4 rounded-lg text-sm font-bold text-gray-400 hover:bg-gray-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmSaveFilter}
                    disabled={!newFilterName.trim()}
                    className="flex-1 py-2 px-4 bg-accent-amber text-black rounded-lg text-sm font-bold hover:bg-accent-amber/90 transition-all disabled:opacity-50"
                  >
                    Save Filter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
