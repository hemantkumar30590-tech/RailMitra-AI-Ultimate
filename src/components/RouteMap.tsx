import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface RouteMapProps {
  stations: any[];
}

function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [map]);
  return null;
}

export default function RouteMap({ stations }: RouteMapProps) {
  return (
    <div className="w-full h-full min-h-[500px]" style={{ height: '100%', minHeight: 500 }}>
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ width: '100%', height: '100%', minHeight: 500 }}
      >
        <MapResizer />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {stations.map((s, i) => {
           const lat = 20 + (i * 0.1);
           const lng = 78 + (i * 0.1);
           return (
             <Marker key={i} position={[lat, lng]}>
               <Popup>
                 <div className="font-bold text-sm">{s.station_name || s.stationName}</div>
                 <div className="text-xs">Dist: {s.distance_km || s.distance || s.dist || '0'} km</div>
               </Popup>
             </Marker>
           );
        })}
      </MapContainer>
    </div>
  );
}
