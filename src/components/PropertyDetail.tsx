import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Property, Dwelling, Tax, Permit, Sale, CompSale, AppraisalHistory, PropertyPhoto, PropertyEvent } from '../types';
import { calculateDistressScore, formatCurrency, formatNumber, getDistressLevel, cn } from '../lib/utils';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Home, 
  User, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  Droplets, 
  Zap, 
  Flame, 
  Wind,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PropertyDetailProps {
  quickRef: string;
  onBack: () => void;
}

export const PropertyDetail: React.FC<PropertyDetailProps> = ({ quickRef, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    property: Property | null;
    dwelling: Dwelling | null;
    tax: Tax | null;
    permits: Permit[];
    sales: Sale[];
    comps: CompSale[];
    history: AppraisalHistory[];
    photos: PropertyPhoto[];
    events: PropertyEvent[];
  }>({
    property: null,
    dwelling: null,
    tax: null,
    permits: [],
    sales: [],
    comps: [],
    history: [],
    photos: [],
    events: [],
  });

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          propRes,
          dwellRes,
          taxRes,
          permitsRes,
          salesRes,
          compsRes,
          historyRes,
          photosRes,
          eventsRes
        ] = await Promise.all([
          supabase.from('properties').select('*').eq('quick_ref', quickRef).single(),
          supabase.from('dwelling').select('*').eq('quick_ref', quickRef).maybeSingle(),
          supabase.from('tax').select('*').eq('quick_ref', quickRef).maybeSingle(),
          supabase.from('permits').select('*').eq('quick_ref', quickRef).order('issue_date', { ascending: false }),
          supabase.from('sales').select('*').eq('quick_ref', quickRef).order('sale_date', { ascending: false }),
          supabase.from('noav_comps').select('*').eq('quick_ref', quickRef).order('sale_date', { ascending: false }),
          supabase.from('appraisal_history').select('*').eq('quick_ref', quickRef).order('year', { ascending: true }),
          supabase.from('property_photos').select('*').eq('quick_ref', quickRef).order('sequence', { ascending: true }),
          supabase.from('events').select('*').eq('quick_ref', quickRef).order('occurred_at', { ascending: false }),
        ]);

        setData({
          property: propRes.data,
          dwelling: dwellRes.data,
          tax: taxRes.data,
          permits: permitsRes.data || [],
          sales: salesRes.data || [],
          comps: compsRes.data || [],
          history: historyRes.data || [],
          photos: photosRes.data || [],
          events: eventsRes.data || [],
        });
      } catch (error) {
        console.error('Error fetching property detail:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quickRef]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-dark-bg text-gray-500">
        <div className="w-12 h-12 border-4 border-accent-amber border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-sm uppercase tracking-widest">Loading Property Intel...</p>
      </div>
    );
  }

  const { property, dwelling, tax, permits, sales, comps, history, photos, events } = data;
  if (!property) return (
    <div className="h-full flex flex-col items-center justify-center bg-dark-bg text-gray-500 p-10 text-center">
      <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
        <Home size={32} className="text-gray-600" />
      </div>
      <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Property Not Found</h2>
      <p className="text-sm text-gray-500 max-w-xs mb-8">This property might not be in the current dataset or the reference is invalid.</p>
      <button 
        onClick={onBack}
        className="flex items-center gap-2 bg-accent-amber text-black px-6 py-2 rounded-xl font-bold text-sm hover:bg-accent-amber/90 transition-all"
      >
        <ArrowLeft size={18} />
        Back to Terminal
      </button>
    </div>
  );

  // Ensure 2025 is in the history chart
  const chartData = [...history];
  const has2025 = chartData.some(h => h.year === 2025);
  if (!has2025 && property.noav_curr_appraised) {
    chartData.push({
      quick_ref: property.quick_ref,
      year: 2025,
      appraised: property.noav_curr_appraised
    });
  }
  // Sort by year to be safe
  chartData.sort((a, b) => a.year - b.year);

  const { score, factors } = calculateDistressScore({ ...property, dwelling, tax });
  const distress = getDistressLevel(score);
  const yoyChange = property.noav_prev_appraised 
    ? ((property.noav_curr_appraised - property.noav_prev_appraised) / property.noav_prev_appraised) * 100 
    : 0;

  const mainPhoto = photos.length > 0 
    ? photos[activePhotoIndex].photo_url 
    : (property.property_image_url || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1000');

  return (
    <div className="h-full overflow-y-auto bg-dark-bg pb-20">
      {/* Photo Gallery */}
      <div className="relative h-[300px] bg-black overflow-hidden group">
        <img 
          src={mainPhoto} 
          alt={property.situs_address}
          className="w-full h-full object-cover opacity-80"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent" />
        
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 z-10 bg-black/60 hover:bg-black p-2 rounded-full backdrop-blur-md transition-all border border-white/10"
        >
          <ArrowLeft size={20} />
        </button>

        {photos.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10">
            {photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => setActivePhotoIndex(idx)}
                className={cn(
                  "w-12 h-8 rounded-md overflow-hidden border-2 transition-all",
                  activePhotoIndex === idx ? "border-accent-amber scale-110" : "border-transparent opacity-50 hover:opacity-100"
                )}
              >
                <img src={photo.photo_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        )}

        {photos.length > 0 && photos[activePhotoIndex].photo_date && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-mono uppercase tracking-wider flex items-center gap-2">
            <Camera size={12} className="text-accent-amber" />
            Captured: {new Date(photos[activePhotoIndex].photo_date).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-6 relative z-10">
        {/* Header */}
        <div className="bg-[#16191d] border border-gray-800 rounded-2xl p-6 shadow-2xl mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-accent-amber text-black text-[10px] font-black rounded-full uppercase">
                  Class {property.prop_class}
                </span>
                <span className="text-gray-500 font-mono text-sm">Ref: {property.quick_ref}</span>
              </div>
              <h1 className="text-3xl font-black text-white mb-1">{property.situs_address}</h1>
              <div className="flex items-center gap-2 text-gray-400">
                <MapPin size={16} className="text-accent-amber" />
                <span className="font-medium">{property.city}, KS {property.zip}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1">Current Appraised Value</div>
              <div className="text-4xl font-mono font-black text-white">{formatCurrency(property.noav_curr_appraised)}</div>
              <div className={cn(
                "flex items-center justify-end gap-1 font-mono font-bold text-sm",
                yoyChange >= 0 ? "text-positive-green" : "text-distress-red"
              )}>
                <TrendingUp size={16} />
                {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(1)}% YoY
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Calendar size={20} />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-black">Year Built</div>
                <div className="font-mono font-bold">{property.year_built || dwelling?.pdf_year_built || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Home size={20} />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-black">Total Sqft</div>
                <div className="font-mono font-bold">{formatNumber(dwelling?.pdf_total_sqft)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                <TrendingUp size={20} />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-black">Beds/Baths</div>
                <div className="font-mono font-bold">{dwelling?.pdf_bedrooms || '—'} / {dwelling?.pdf_full_baths || '—'}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <DollarSign size={20} />
              </div>
              <div>
                <div className="text-[10px] text-gray-500 uppercase font-black">Quality</div>
                <div className="font-mono font-bold">{dwelling?.pdf_quality || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Owner Section */}
            <div className="bg-[#16191d] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                <h2 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                  <User size={16} className="text-accent-amber" />
                  Ownership Data
                </h2>
                {property.owner_absentee ? (
                  <span className="px-2 py-1 bg-accent-amber/10 text-accent-amber text-[10px] font-black rounded uppercase border border-accent-amber/20">Absentee Owned</span>
                ) : (
                  <span className="px-2 py-1 bg-positive-green/10 text-positive-green text-[10px] font-black rounded uppercase border border-positive-green/20">Owner Occupied</span>
                )}
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Primary Owner</div>
                  <div className="font-bold text-lg text-white">{property.owner1_name}</div>
                  {property.owner2_name && <div className="text-gray-400 text-sm">{property.owner2_name}</div>}
                </div>
                <div>
                  <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Mailing Address</div>
                  <div className="text-gray-300 leading-relaxed">{property.owner1_address}</div>
                </div>
              </div>
            </div>

            {/* Sale History */}
            <div className="bg-[#16191d] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                  <DollarSign size={16} className="text-accent-amber" />
                  Sale History
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/20 text-[10px] uppercase font-black text-gray-500">
                      <th className="px-6 py-3">Sale Date</th>
                      <th className="px-6 py-3">Type / Validity</th>
                      <th className="px-6 py-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {(() => {
                      // Combine sales from multiple sources
                      const allSales: { date: string; type: string; price?: number; validity?: string }[] = [];
                      
                      // 1. From sales table
                      sales.forEach(s => {
                        allSales.push({
                          date: s.sale_date,
                          type: s.sale_type,
                          price: s.sale_price,
                          validity: s.validity
                        });
                      });

                      // 2. From comps table (if it's the subject property)
                      comps.forEach(c => {
                        // Check if this comp entry actually refers to the subject property
                        // Sometimes the subject property is included in the comps list for comparison
                        const isSubject = (c.comp_quick_ref && c.comp_quick_ref === property.quick_ref) || 
                                        (c.comp_address && property.situs_address && c.comp_address.toLowerCase().trim() === property.situs_address.toLowerCase().trim());
                        
                        if (isSubject && c.sale_date) {
                          // Only add if not already present by date (to avoid duplicates)
                          if (!allSales.some(s => s.date === c.sale_date)) {
                            allSales.push({
                              date: c.sale_date,
                              type: 'Market Sale (Comp Data)',
                              price: c.sale_price
                            });
                          } else {
                            // If already present, update price if missing
                            const existing = allSales.find(s => s.date === c.sale_date);
                            if (existing && !existing.price && c.sale_price) {
                              existing.price = c.sale_price;
                            }
                          }
                        }
                      });

                      // 3. From property table (last sale)
                      if (property.last_sale_date && !allSales.some(s => s.date === property.last_sale_date)) {
                        allSales.push({
                          date: property.last_sale_date,
                          type: 'Last Recorded Sale',
                          price: property.last_sale_price
                        });
                      }

                      // Sort all combined sales by date descending
                      allSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                      if (allSales.length === 0) {
                        return <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500 italic">No sale history on record</td></tr>;
                      }

                      return allSales.map((sale, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-sm font-mono text-gray-400">{new Date(sale.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm">
                            <div className="font-medium text-white">{sale.type || '—'}</div>
                            {sale.validity && <div className="text-[10px] text-gray-500 uppercase font-bold">{sale.validity}</div>}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-mono font-bold text-white">
                            {sale.price ? formatCurrency(sale.price) : '—'}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Comparable Sales */}
            <div className="bg-[#16191d] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} className="text-accent-amber" />
                  Comparable Sales
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-black/20 text-[10px] uppercase font-black text-gray-500">
                      <th className="px-6 py-3">Address</th>
                      <th className="px-6 py-3">Sale Date</th>
                      <th className="px-6 py-3 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {comps.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500 italic">No recent comparable sales found</td></tr>
                    ) : (
                      comps.map((comp, idx) => (
                        <tr 
                          key={idx} 
                          className="hover:bg-white/5 transition-colors cursor-pointer group"
                          onClick={() => {
                            if (comp.comp_quick_ref) {
                              window.location.hash = `#/property/${comp.comp_quick_ref}`;
                            }
                          }}
                        >
                          <td className="px-6 py-4 text-sm font-medium group-hover:text-accent-amber transition-colors">
                            {comp.comp_address}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400 font-mono">{new Date(comp.sale_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm text-right font-mono font-bold text-white">{formatCurrency(comp.sale_price)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Valuation History Chart */}
            <div className="bg-[#16191d] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                  <TrendingUp size={16} className="text-accent-amber" />
                  Appraisal History
                </h2>
              </div>
              <div className="p-6 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2d333b" vertical={false} />
                    <XAxis 
                      dataKey="year" 
                      stroke="#6b7280" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => `$${val/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#16191d', border: '1px solid #374151', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px' }}
                      formatter={(val: number) => [formatCurrency(val), 'Appraised']}
                    />
                    <Bar dataKey="appraised" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => {
                        let fillColor = '#3b82f6'; // Default Blue
                        if (index === chartData.length - 1) {
                          fillColor = '#d946ef'; // Most recent: Magenta
                        } else if (index === 0) {
                          fillColor = '#EF9F27'; // Least recent: Orange/Yellow
                        }
                        return <Cell key={`cell-${index}`} fill={fillColor} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Permits */}
            <div className="bg-[#16191d] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                  <FileText size={16} className="text-accent-amber" />
                  Permit History
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {permits.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 italic">No permits on record</div>
                  ) : (
                    permits.map((permit, idx) => (
                      <div key={idx} className="flex gap-4 relative">
                        {idx !== permits.length - 1 && (
                          <div className="absolute left-[19px] top-10 bottom-[-24px] w-px bg-gray-800" />
                        )}
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center shrink-0 z-10">
                          <FileText size={16} className="text-gray-400" />
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-white">{permit.permit_type}</h4>
                            <span className="text-xs font-mono font-bold text-accent-amber">{formatCurrency(permit.amount)}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(permit.issue_date).toLocaleDateString()}</span>
                            <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-bold uppercase text-[9px]">{permit.status}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Distress Score */}
            <div className="bg-[#16191d] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-6 text-center border-b border-gray-800">
                <div className="text-[10px] text-gray-500 uppercase font-black mb-2">Distress Risk Score</div>
                <div className={cn("text-6xl font-black mb-2", distress.color.split(' ')[0])}>
                  {score}<span className="text-2xl text-gray-600">/14</span>
                </div>
                <div className={cn("inline-block px-4 py-1 rounded-full text-xs font-black uppercase border", distress.color)}>
                  {distress.label} Risk
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest">Risk Factors</h3>
                <div className="space-y-3">
                  {factors.length === 0 ? (
                    <div className="text-xs text-gray-500 italic">No significant distress factors identified</div>
                  ) : (
                    factors.map((factor, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <AlertTriangle size={14} className="text-distress-red" />
                        <span className="text-gray-300">{factor}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Tax Section */}
            <div className="bg-[#16191d] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                  <DollarSign size={16} className="text-accent-amber" />
                  Tax Information
                </h2>
              </div>
              <div className="p-6 space-y-6">
                {tax?.tax_is_delinquent && (
                  <div className="bg-distress-red/10 border border-distress-red/20 p-4 rounded-xl flex gap-3">
                    <AlertTriangle className="text-distress-red shrink-0" size={20} />
                    <div>
                      <div className="text-distress-red font-black uppercase text-[10px] mb-1">Delinquency Warning</div>
                      <p className="text-xs text-gray-300">This property has delinquent taxes. Balance due: <span className="font-bold text-white">{formatCurrency(tax.tax_balance_due)}</span></p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Annual Tax</div>
                    <div className="font-mono font-bold text-white">{formatCurrency(tax?.tax_full_payment)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Mill Levy</div>
                    <div className="font-mono font-bold text-white">{tax?.tax_mill_levy_rate || '—'}</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-800">
                  <div className="text-[10px] text-gray-500 uppercase font-black mb-1">Special Assessments</div>
                  <div className="font-mono font-bold text-white">{formatCurrency(tax?.tax_special_assessments)}</div>
                </div>
              </div>
            </div>

            {/* Location & Utilities */}
            <div className="bg-[#16191d] border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="font-black uppercase text-xs tracking-widest flex items-center gap-2">
                  <MapPin size={16} className="text-accent-amber" />
                  Location & Utilities
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <span className="text-xs text-gray-500 font-bold uppercase">Watershed</span>
                  <span className="text-xs font-medium text-gray-200">{property.watershed || '—'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <span className="text-xs text-gray-500 font-bold uppercase">Elevation</span>
                  <span className="text-xs font-medium text-gray-200">{property.elevation_ft ? `${property.elevation_ft} ft` : '—'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <span className="text-xs text-gray-500 font-bold uppercase">Fire Station</span>
                  <span className="text-xs font-medium text-gray-200">{property.fire_station_dist_ft ? `${formatNumber(property.fire_station_dist_ft)} ft` : '—'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-800/50">
                  <span className="text-xs text-gray-500 font-bold uppercase">Hydrant Dist</span>
                  <span className="text-xs font-medium text-gray-200">{property.hydrant_dist_ft ? `${formatNumber(property.hydrant_dist_ft)} ft` : '—'}</span>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex items-center gap-3 text-xs">
                    <Zap size={14} className="text-yellow-500" />
                    <span className="text-gray-500">Electric:</span>
                    <span className="text-gray-200 font-medium">{property.electric_provider || '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <Flame size={14} className="text-orange-500" />
                    <span className="text-gray-500">Gas:</span>
                    <span className="text-gray-200 font-medium">{property.gas_provider || '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <Droplets size={14} className="text-blue-500" />
                    <span className="text-gray-500">Water:</span>
                    <span className="text-gray-200 font-medium">{property.water_provider || '—'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <Wind size={14} className="text-green-500" />
                    <span className="text-gray-500">Sewer:</span>
                    <span className="text-gray-200 font-medium">{property.sewer_provider || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Source Links */}
            <div className="bg-[#16191d] border border-gray-800 rounded-2xl p-6 space-y-3">
              <h3 className="text-[10px] uppercase font-black text-gray-500 tracking-widest mb-2">External Records</h3>
              <a 
                href={`https://land.jocogov.org/Property.aspx?QuickRef=${property.quick_ref}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-300">County Assessor Page</span>
                <ExternalLink size={14} className="text-gray-500 group-hover:text-accent-amber" />
              </a>
              <a 
                href={property.pdf_source_url || `https://land.jocogov.org/PropertyCard.aspx?QuickRef=${property.quick_ref}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-300">Property Card PDF</span>
                <ExternalLink size={14} className="text-gray-500 group-hover:text-accent-amber" />
              </a>
              <a 
                href={`https://land.jocogov.org/NoticeOfValue.aspx?QuickRef=${property.quick_ref}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 bg-black/20 rounded-xl hover:bg-black/40 transition-colors group"
              >
                <span className="text-xs font-bold text-gray-300">Notice of Value PDF</span>
                <ExternalLink size={14} className="text-gray-500 group-hover:text-accent-amber" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
