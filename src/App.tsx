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
import { calculateDistressScore } from './lib/utils';
import { Layout, Database, ShieldCheck, Info } from 'lucide-react';

export default function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [route, setRoute] = useState(window.location.hash);

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-amber rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(239,159,39,0.3)]">
            <Database className="text-black" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tighter">JOCO INTEL</h1>
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
          <button className="text-gray-400 hover:text-white transition-colors">
            <Info size={20} />
          </button>
        </div>
      </header>

      {/* Filter Bar */}
      <FilterBar 
        filters={filters} 
        setFilters={setFilters} 
        resultCount={filteredProperties.length} 
      />

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="w-12 h-12 border-4 border-accent-amber border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-mono text-sm uppercase tracking-widest">Initializing Terminal...</p>
          </div>
        ) : (
          <>
            <div className="w-[58%] h-full">
              <PropertyMap 
                properties={filteredProperties} 
                selectedProperty={selectedProperty}
                onSelectProperty={setSelectedProperty}
              />
            </div>
            <div className="w-[42%] h-full">
              <PropertyList 
                properties={filteredProperties} 
                selectedProperty={selectedProperty}
                onSelectProperty={setSelectedProperty}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
