import React from 'react';
import { Property } from '../types';
import { formatCurrency, calculateDistressScore, getDistressLevel } from '../lib/utils';
import { ExternalLink, MapPin, Home, Calendar, User } from 'lucide-react';

interface TableViewProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
}

export const TableView: React.FC<TableViewProps> = ({ properties, onSelectProperty }) => {
  return (
    <div className="flex-1 overflow-auto bg-dark-bg">
      <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-[#16191d] z-10 border-b border-gray-800">
          <tr>
            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-500 tracking-widest">Address</th>
            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-500 tracking-widest">Owner</th>
            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-500 tracking-widest">Value</th>
            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-500 tracking-widest">Year</th>
            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-500 tracking-widest">Class</th>
            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-500 tracking-widest">Distress</th>
            <th className="px-6 py-4 text-[10px] uppercase font-black text-gray-500 tracking-widest text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {properties.map((property) => {
            const { score } = calculateDistressScore(property);
            const distress = getDistressLevel(score);
            
            return (
              <tr 
                key={property.quick_ref}
                className="hover:bg-white/5 transition-colors group cursor-pointer"
                onClick={() => onSelectProperty(property)}
              >
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white group-hover:text-accent-amber transition-colors">
                      {property.situs_address}
                    </span>
                    <span className="text-xs text-gray-500">{property.city}, {property.zip}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <User size={12} className="text-gray-500" />
                    {property.owner1_name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-mono font-bold text-white">
                    {formatCurrency(property.noav_curr_appraised)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm font-mono text-gray-400">
                    {property.year_built || property.dwelling?.pdf_year_built || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-[10px] font-bold text-gray-400 uppercase">
                    {property.prop_class}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${distress.color}`}>
                    {distress.label}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.hash = `#/property/${property.quick_ref}`;
                    }}
                    className="p-2 hover:bg-accent-amber/10 rounded-lg text-gray-500 hover:text-accent-amber transition-all"
                  >
                    <ExternalLink size={16} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
