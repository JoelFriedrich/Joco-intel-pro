import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '../types';
import { calculateDistressScore, cn } from '../lib/utils';

// Fix Leaflet icon issue
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: iconUrl,
  shadowUrl: iconShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const createCustomIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

const icons = {
  standard: createCustomIcon('#3b82f6'), // Blue
  absentee: createCustomIcon('#EF9F27'), // Amber
  distressed: createCustomIcon('#E24B4A'), // Red
  noCoords: createCustomIcon('#6b7280'), // Gray
};

interface PropertyMapProps {
  properties: Property[];
  selectedProperty: Property | null;
  onSelectProperty: (property: Property) => void;
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export const PropertyMap: React.FC<PropertyMapProps> = ({ properties, selectedProperty, onSelectProperty }) => {
  const [center, setCenter] = useState<[number, number]>([38.93, -94.72]);

  useEffect(() => {
    if (selectedProperty && selectedProperty.lat && selectedProperty.lng) {
      setCenter([selectedProperty.lat, selectedProperty.lng]);
    }
  }, [selectedProperty]);

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={12}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapController center={center} />
        {properties.map((prop) => {
          if (!prop.lat || !prop.lng) return null;

          const { score } = calculateDistressScore(prop);
          let icon = icons.standard;
          if (score >= 5 || prop.tax?.tax_is_delinquent) {
            icon = icons.distressed;
          } else if (prop.owner_absentee) {
            icon = icons.absentee;
          }

          return (
            <Marker
              key={prop.quick_ref}
              position={[prop.lat, prop.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectProperty(prop),
              }}
            >
              <Popup className="dark-popup">
                <div className="p-1">
                  <h3 className="font-bold text-sm">{prop.situs_address}</h3>
                  <p className="text-xs text-gray-400">{prop.city}, KS</p>
                  <button
                    onClick={() => window.location.hash = `#/property/${prop.quick_ref}`}
                    className="mt-2 w-full bg-accent-amber text-black text-xs font-bold py-1 px-2 rounded hover:bg-amber-500 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-dark-bg/90 border border-gray-800 p-3 rounded-lg shadow-xl backdrop-blur-sm">
        <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-2">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#3b82f6] border border-white/50" />
            <span className="text-xs text-gray-300">Standard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#EF9F27] border border-white/50" />
            <span className="text-xs text-gray-300">Absentee Owned</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#E24B4A] border border-white/50" />
            <span className="text-xs text-gray-300">High Distress / Delinquent</span>
          </div>
        </div>
      </div>
    </div>
  );
};
