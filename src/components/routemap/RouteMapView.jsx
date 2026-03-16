import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const statusColors = {
  completed: '#22c55e',
  in_progress: '#3b82f6',
  pending: '#94a3b8',
  cancelled: '#64748b',
  rescheduled: '#a855f7',
};

function createColoredIcon(color, label) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background: ${color};
        width: 32px; height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      ">
        <span style="transform: rotate(45deg); color: white; font-weight: bold; font-size: 11px;">${label}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

// Componente auxiliar para centrar el mapa en los marcadores
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
}

export default function RouteMapView({ visits, clientsMap, selectedId, onSelectVisit }) {
  // Construir puntos del mapa
  const markers = useMemo(() => {
    return visits
      .map((visit, index) => {
        const client = clientsMap[visit.client_id];
        const lat = visit.lat ?? client?.lat;
        const lng = visit.lng ?? client?.lng;
        if (!lat || !lng) return null;
        return { visit, lat, lng, index };
      })
      .filter(Boolean);
  }, [visits, clientsMap]);

  const polylinePositions = markers.map(m => [m.lat, m.lng]);

  const defaultCenter = [-4.0, -77.0]; // Centro aproximado Perú/Colombia

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {markers.length > 0 && <FitBounds positions={polylinePositions} />}

      {/* Línea de ruta */}
      {polylinePositions.length > 1 && (
        <Polyline
          positions={polylinePositions}
          pathOptions={{ color: '#1565C0', weight: 3, dashArray: '8 6', opacity: 0.7 }}
        />
      )}

      {/* Marcadores */}
      {markers.map(({ visit, lat, lng, index }) => {
        const color = statusColors[visit.status] ?? statusColors.pending;
        const label = String(visit.route_order ?? index + 1);
        const icon = createColoredIcon(
          selectedId === visit.id ? '#F57C00' : color,
          label
        );

        return (
          <Marker
            key={visit.id}
            position={[lat, lng]}
            icon={icon}
            eventHandlers={{ click: () => onSelectVisit(visit) }}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="font-bold text-slate-800">{visit.client_name || 'Cliente'}</p>
                <p className="text-xs text-slate-500 mt-1">
                  🕐 {format(new Date(visit.scheduled_at), 'hh:mm a', { locale: es })}
                </p>
                <p className="text-xs text-slate-500 capitalize">📋 {visit.activity_type}</p>
                {visit.checkin_at && (
                  <p className="text-xs text-green-600 mt-1">✅ Check-in realizado</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}