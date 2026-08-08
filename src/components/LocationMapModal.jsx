import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import colors from '../utils/colors';

const TEAL = colors.primary.teal;
const DARK = '#073944';

const PRESET_LOCATIONS = {
  toronto:          { name: 'Toronto, ON',        lat: 43.6532, lng: -79.3832 },
  niagara:          { name: 'Niagara Falls, ON',  lat: 43.0962, lng: -79.0377 },
  quebec:           { name: 'Quebec City, QC',    lat: 46.8139, lng: -71.2082 },
  'mont-tremblant': { name: 'Mont-Tremblant, QC', lat: 46.1186, lng: -74.5961 },
  barrie:           { name: 'Barrie, ON',         lat: 44.3894, lng: -79.6903 },
};

export function getPostLocationInfo(post) {
  if (!post?.location || post.location === '') return null;
  if (post.location === 'custom') {
    const lat = Number(post.locationLat);
    const lng = Number(post.locationLng);
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;
    return { name: post.locationCustomName || 'Custom location', lat, lng };
  }
  const preset = PRESET_LOCATIONS[post.location];
  return preset ? { ...preset } : null;
}

const LocationMapModal = ({ name, lat, lng, onClose }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const init = () => {
      if (!mapContainerRef.current || mapRef.current) return;
      const L = window.L;
      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 12,
        scrollWheelZoom: true,
        zoomControl: true,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const pinIcon = L.divIcon({
        html: '<span style="font-size:32px;line-height:1;display:block">📍</span>',
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -34],
      });
      L.marker([lat, lng], { icon: pinIcon }).addTo(map).bindPopup(name).openPopup();
      setTimeout(() => map.invalidateSize(), 100);
      mapRef.current = map;
    };

    if (!document.querySelector('#leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (window.L) {
      setTimeout(init, 60);
    } else if (!document.querySelector('#leaflet-js')) {
      const s = document.createElement('script');
      s.id = 'leaflet-js';
      s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s.onload = () => setTimeout(init, 60);
      document.body.appendChild(s);
    } else {
      const poll = setInterval(() => { if (window.L) { clearInterval(poll); setTimeout(init, 60); } }, 100);
      return () => clearInterval(poll);
    }

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [lat, lng, name]);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'white', borderRadius: 18, overflow: 'hidden', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #D9EBEE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>📍</span>
            <span style={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 17, fontWeight: 500, color: DARK }}>{name}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78959D', padding: 4 }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Map */}
        <div ref={mapContainerRef} style={{ height: 320 }} />

        {/* Footer */}
        <div style={{ padding: '10px 18px', borderTop: '1px solid #D9EBEE', textAlign: 'right' }}>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: TEAL, fontWeight: 700, textDecoration: 'none', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.04em' }}
          >
            Open in Google Maps →
          </a>
        </div>
      </div>
    </div>
  );
};

export default LocationMapModal;
