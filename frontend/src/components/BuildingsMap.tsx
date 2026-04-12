import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

// Fix for default marker icons in React Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapBuilding {
  bin: string;
  address: string;
  latitude: number;
  longitude: number;
  verified_status: string;
  loss_of_service_30d: number;
}

interface BuildingsMapProps {
  onBuildingSelect: (bin: string) => void;
}

export function BuildingsMap({ onBuildingSelect }: BuildingsMapProps) {
  const { t } = useTranslation();
  const [buildings, setBuildings] = useState<MapBuilding[]>([]);

  useEffect(() => {
    fetch('/api/buildings/map/')
      .then(res => res.json())
      .then(data => setBuildings(data))
      .catch(err => console.error("Map Fetch Error:", err));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UP': return 'success';
      case 'DOWN': return 'danger';
      case 'TRAPPED': return 'dark';
      case 'SLOW':
      case 'UNSAFE': return 'warning';
      default: return 'secondary';
    }
  };

  const createIcon = (status: string) => {
    const color = getStatusColor(status);
    let html = `<div class="bg-${color} border border-white rounded-circle shadow-sm" style="width: 20px; height: 20px;"></div>`;
    
    // Pulse animation for critical issues
    if (status === 'DOWN' || status === 'TRAPPED') {
      html = `<div class="bg-${color} border border-white rounded-circle shadow-sm animate-pulse" style="width: 20px; height: 20px;"></div>`;
    }

    return L.divIcon({
      html: html,
      className: 'custom-map-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  return (
    <div className="rounded shadow-sm border overflow-hidden mb-4" style={{ height: '400px' }}>
      <MapContainer 
        center={[40.7128, -74.0060]} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {buildings.map(b => (
          <Marker 
            key={b.bin} 
            position={[b.latitude, b.longitude]}
            icon={createIcon(b.verified_status)}
          >
            <Popup>
              <div className="p-1">
                <h6 className="fw-bold mb-1">{b.address}</h6>
                <div className="mb-2">
                  <Badge bg={getStatusColor(b.verified_status)}>
                    {b.verified_status}
                  </Badge>
                  <span className="ms-2 text-muted small">
                    {b.loss_of_service_30d}% {t('loss_of_service')}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  variant="outline-primary" 
                  className="w-100"
                  onClick={() => onBuildingSelect(b.bin)}
                >
                  {t('building_details')}
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
