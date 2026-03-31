import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Building, Deal } from '../../types';

// Fix Leaflet default icon issue with Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function getBuildingPinColor(building: Building): string {
  if (['Won', 'Installed', 'WaaS'].includes(building.status)) return '#0F6E56';
  if (building.status === 'Hot') return '#dc2626';
  const monthly = building.monthlyWaterSpend || (building.tankerCostAnnual ? building.tankerCostAnnual / 12 : 0);
  if (monthly > 50000) return '#dc2626';
  if (monthly > 20000) return '#ca8a04';
  if (['Warm Lead', 'Warm', 'Prospect', 'Audited', 'Referred'].includes(building.status)) return '#ca8a04';
  if (building.status === 'Cold' || building.status === 'Lost') return '#9ca3af';
  return '#3b82f6';
}

function createColoredIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 22px; height: 22px;
      background-color: ${color};
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -24],
  });
}

interface MapViewProps {
  buildings: Building[];
  deals: Deal[];
  onBuildingClick?: (building: Building) => void;
  center?: [number, number];
  zoom?: number;
}

export function MapView({
  buildings,
  deals,
  onBuildingClick,
  center = [28.7041, 77.1025],
  zoom = 11,
}: MapViewProps) {
  const [showHeatmap, setShowHeatmap] = useState(false);

  const getDealStage = (buildingId: string): string => {
    const deal = deals.find(d => d.buildingId === buildingId);
    return deal?.stage || 'No deal';
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height: '500px' }}>
      {/* Heatmap toggle */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`px-3 py-2 rounded-lg text-xs font-medium shadow-md border transition-colors ${
            showHeatmap
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg p-3 shadow-md border border-gray-200 text-xs">
        <p className="font-semibold text-gray-700 mb-2">Legend</p>
        <div className="flex flex-col gap-1.5">
          <LegendItem color="#16a34a" label="Won" />
          <LegendItem color="#dc2626" label="High tanker cost (>5L)" />
          <LegendItem color="#ca8a04" label="Warm Lead / Prospect" />
          <LegendItem color="#9ca3af" label="Cold / Lost" />
        </div>
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {buildings.map(building => {
          const color = getBuildingPinColor(building);
          const dealStage = getDealStage(building.id);
          return (
            <React.Fragment key={building.id}>
              {showHeatmap && (building.monthlyWaterSpend || 0) * 12 > 300000 && (
                <Circle
                  center={[building.lat, building.lng]}
                  radius={((building.monthlyWaterSpend || 0) * 12) / 10}
                  pathOptions={{
                    color: '#dc2626',
                    fillColor: '#dc2626',
                    fillOpacity: 0.08,
                    weight: 0,
                  }}
                />
              )}
              <Marker
                position={[building.lat, building.lng]}
                icon={createColoredIcon(color)}
                eventHandlers={{
                  click: () => onBuildingClick?.(building),
                }}
              >
                <Popup maxWidth={260}>
                  <div className="p-1">
                    <p className="font-bold text-gray-900 text-sm mb-1">{building.name}</p>
                    <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                      <span className="font-medium">Type:</span>
                      <span>{building.type}</span>
                      <span className="font-medium">Status:</span>
                      <span>{building.status}</span>
                      <span className="font-medium">Monthly Water:</span>
                      <span>{building.monthlyWaterSpend ? formatCurrency(building.monthlyWaterSpend) + '/mo' : '—'}</span>
                      <span className="font-medium">Deal Stage:</span>
                      <span>{dealStage}</span>
                      <span className="font-medium">Contact:</span>
                      <span>{building.contactName}</span>
                    </div>
                    {building.notes && (
                      <p className="mt-2 text-xs text-gray-500 border-t pt-1">{building.notes}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-gray-600">{label}</span>
    </div>
  );
}
