import React from 'react';
import { Property } from '../types';
import { calculateDistressScore, formatCurrency, getDistressLevel, cn } from '../lib/utils';
import { MapPin, Home, TrendingUp, AlertTriangle } from 'lucide-react';

interface PropertyListProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
}

export const PropertyList: React.FC<PropertyListProps> = ({ properties, selectedProperty, onSelectProperty }) => {
  return (
    <div className="h-full overflow-y-auto bg-dark-bg border-l border-gray-800">
      <div className="p-4 space-y-3">
        {properties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Home size={48} className="mb-4 opacity-20" />
            <p>No properties found matching filters</p>
          </div>
        ) : (
          properties.map((prop) => {
            const isSelected = selectedProperty?.quick_ref === prop.quick_ref;
            const { score } = calculateDistressScore(prop);
            const distress = getDistressLevel(score);
            const yoyChange = prop.noav_prev_appraised 
              ? ((prop.noav_curr_appraised - prop.noav_prev_appraised) / prop.noav_prev_appraised) * 100 
              : 0;

            return (
              <div
                key={prop.quick_ref}
                onClick={() => onSelectProperty(prop)}
                className={cn(
                  "group relative p-4 rounded-xl border transition-all cursor-pointer overflow-hidden bg-[#16191d]",
                  isSelected 
                    ? "border-accent-amber shadow-[0_0_20px_rgba(239,159,39,0.1)] bg-accent-amber/5" 
                    : "border-gray-800 hover:border-gray-700 hover:bg-[#1c2127]"
                )}
              >
                {/* Background Image with Overlay */}
                {prop.property_image_url && (
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={prop.property_image_url} 
                      alt="" 
                      className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                      referrerPolicy="no-referrer"
                    />
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-br from-[#16191d] via-[#16191d]/90 to-transparent",
                      isSelected ? "from-accent-amber/10" : ""
                    )} />
                  </div>
                )}

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-100 group-hover:text-white transition-colors">
                      {prop.situs_address}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {prop.city}, KS {prop.zip}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-gray-100">
                      {formatCurrency(prop.noav_curr_appraised)}
                    </div>
                    <div className={cn(
                      "text-[10px] font-mono flex items-center justify-end gap-1",
                      yoyChange >= 0 ? "text-positive-green" : "text-distress-red"
                    )}>
                      <TrendingUp size={10} />
                      {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-black/20 rounded p-1.5 text-center">
                    <span className="block text-[9px] uppercase text-gray-500 font-bold">Built</span>
                    <span className="text-xs font-mono">{prop.year_built || prop.dwelling?.pdf_year_built || '—'}</span>
                  </div>
                  <div className="bg-black/20 rounded p-1.5 text-center">
                    <span className="block text-[9px] uppercase text-gray-500 font-bold">Sqft</span>
                    <span className="text-xs font-mono">{prop.dwelling?.pdf_total_sqft || '—'}</span>
                  </div>
                  <div className="bg-black/20 rounded p-1.5 text-center">
                    <span className="block text-[9px] uppercase text-gray-500 font-bold">Beds/Baths</span>
                    <span className="text-xs font-mono">
                      {prop.dwelling?.pdf_bedrooms || '—'}/{prop.dwelling?.pdf_full_baths || '—'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {prop.owner_absentee && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
                      Absentee
                    </span>
                  )}
                  {prop.tax?.tax_is_delinquent && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-distress-red/10 text-distress-red border border-distress-red/20 flex items-center gap-1">
                      <AlertTriangle size={10} />
                      Delinquent
                    </span>
                  )}
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                    distress.color
                  )}>
                    {distress.label} Distress
                  </span>
                </div>

                {isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.hash = `#/property/${prop.quick_ref}`;
                    }}
                    className="mt-4 w-full bg-accent-amber text-black text-xs font-bold py-2 rounded-lg hover:bg-amber-500 transition-all flex items-center justify-center gap-2"
                  >
                    View Full Detail
                  </button>
                )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
