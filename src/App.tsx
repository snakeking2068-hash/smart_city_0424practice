import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Triangle, ArrowUpSquare, Compass, Map as MapIcon, Info, Layers, Navigation } from 'lucide-react';
import { STATIONS, SLOPES, VERTICAL_CIRCULATION, GREENWAY_PATH, VIADUCT_PATH, GeoPoint } from './data/geoData';

// ... (marker fix and MapController stay the same)

const App: React.FC = () => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.9972, 120.2126]);
  const [showSlopes, setShowSlopes] = useState(true);
  const [showVertical, setShowVertical] = useState(true);

  const focusOn = (point: GeoPoint) => {
    setMapCenter(point.coordinates);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f0f4f0' }}>
      {/* Sidebar */}
      <div style={{ width: '350px', padding: '20px', overflowY: 'auto', backgroundColor: '#ffffff', boxShadow: '2px 0 10px rgba(0,0,0,0.1)', zIndex: 1000 }}>
        <h1 style={{ color: '#2d5a27', fontSize: '1.5rem', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
          <MapIcon style={{ marginRight: '10px' }} /> 台南南鐵綠園道
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '20px' }}>
          台南史上最大都市縫合計畫，預計 2030 年完工。
        </p>

        <section style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#333', borderBottom: '2px solid #e0eee0', paddingBottom: '5px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <Layers size={18} style={{ marginRight: '8px' }} /> 圖層控制
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={showSlopes} onChange={() => setShowSlopes(!showSlopes)} style={{ marginRight: '5px' }} /> 斜坡
            </label>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={showVertical} onChange={() => setShowVertical(!showVertical)} style={{ marginRight: '5px' }} /> 垂直動線
            </label>
          </div>
        </section>

        <section style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#333', borderBottom: '2px solid #e0eee0', paddingBottom: '5px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <Compass size={18} style={{ marginRight: '8px' }} /> 關鍵站點
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {STATIONS.map(s => (
              <button key={s.id} onClick={() => focusOn(s)} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9f9f9', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}>
                {s.name}
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#333', borderBottom: '2px solid #e0eee0', paddingBottom: '5px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <Navigation size={18} style={{ marginRight: '8px' }} /> 垂直動線位置
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {VERTICAL_CIRCULATION.map(v => (
              <button key={v.id} onClick={() => focusOn(v)} style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f0f7ff', cursor: 'pointer', textAlign: 'left', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 'bold', color: '#1976d2' }}>{v.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#666' }}>{v.coordinates[1]}, {v.coordinates[0]}</div>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '1.1rem', color: '#333', borderBottom: '2px solid #e0eee0', paddingBottom: '5px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <Info size={18} style={{ marginRight: '8px' }} /> 亮點介紹
          </h2>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.6', color: '#444' }}>
            <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#eef7ee', borderRadius: '6px', borderLeft: '4px solid #4caf50' }}>
              <strong>綠園道高架橋 (研究範圍)</strong><br />
              北起斜坡 B，南至斜坡 C。此為未來規劃之線性路徑，不依附現有道路網。
            </div>
            <div style={{ padding: '10px', backgroundColor: '#fff8ee', borderRadius: '6px', borderLeft: '4px solid #ff9800' }}>
              <strong>無障礙設計</strong><br />
              全線規劃多處斜坡與垂直動線，確保行動不便者亦能輕鬆遊玩。
            </div>
          </div>
        </section>
      </div>

      {/* Map Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={mapCenter} />

          {/* Ground Level Greenway Path */}
          <Polyline positions={GREENWAY_PATH} color="#4caf50" weight={4} opacity={0.5} dashArray="5, 10">
            <Popup>地面綠園道</Popup>
          </Polyline>

          {/* Future Viaduct Greenway (Main Study Path) */}
          <Polyline positions={VIADUCT_PATH} color="#2e7d32" weight={10} opacity={0.8}>
            <Popup>未來綠園道高架橋 (規劃路徑)</Popup>
          </Polyline>

          {/* Stations Markers */}
          {STATIONS.map(station => (
            <Marker key={station.id} position={station.coordinates}>
              <Popup>
                <div style={{ fontWeight: 'bold' }}>{station.name}</div>
                <div>綠園道核心站點</div>
              </Popup>
            </Marker>
          ))}

          {/* Slopes Markers */}
          {showSlopes && SLOPES.map(slope => (
            <Marker key={slope.id} position={slope.coordinates}>
              <Popup>
                <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>🌿 {slope.name}</div>
                <p>無障礙斜坡銜接點</p>
                <code style={{ fontSize: '0.7rem' }}>{slope.coordinates[1]}, {slope.coordinates[0]}</code>
              </Popup>
            </Marker>
          ))}

          {/* Vertical Markers */}
          {showVertical && VERTICAL_CIRCULATION.map(v => (
            <Marker key={v.id} position={v.coordinates}>
              <Popup>
                <div style={{ color: '#1976d2', fontWeight: 'bold' }}>🏢 {v.name}</div>
                <p>垂直動線設施 (