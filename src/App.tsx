import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Map as MapIcon, Home, Clock, Building2, Users, Info, Activity, Zap } from 'lucide-react';
import { STATIONS, VERTICAL_CIRCULATION, GREENWAY_PATH, POIS, TRAVEL_PARAMS, USER_PROFILES, CROSSING_PENALTY, GeoPoint, UserProfile } from './data/geoData';

// 自定義酷炫標記圖示
const createCustomIcon = (color: string, iconHtml: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 15px ${color};
        border: 2px solid white;
      ">
        <div style="transform: rotate(45deg); color: white;">
          ${iconHtml}
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

const stationIcon = L.divIcon({
  className: 'station-marker',
  html: `<div style="width: 20px; height: 20px; background: #10b981; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 20px #10b981; animation: pulse 2s infinite;"></div>`,
  iconSize: [20, 20]
});

const verticalIcon = L.divIcon({
  className: 'v-marker',
  html: `<div style="width: 16px; height: 16px; background: #3b82f6; border: 2px solid white; border-radius: 3px; box-shadow: 0 0 15px #3b82f6; transform: rotate(45deg);"></div>`,
  iconSize: [16, 16]
});

const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  map.setView(center, 16);
  return null;
};

const App: React.FC = () => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([22.9972, 120.2126]);
  const [selectedStation, setSelectedStation] = useState<GeoPoint>(STATIONS[1]);
  const [currentUser, setCurrentUser] = useState<UserProfile>(USER_PROFILES[0]);

  const focusOn = (point: GeoPoint) => {
    setMapCenter(point.coordinates);
    if (STATIONS.find(s => s.id === point.id)) {
      setSelectedStation(point);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m > 0 ? `${m}m ` : ''}${s}s`;
  };

  const relatedPOIs = useMemo(() => 
    POIS.filter(p => p.linkedStationId === selectedStation.id),
    [selectedStation]
  );

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#0f172a', color: '#f8fafc' }}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .leaflet-container { background: #0f172a !important; }
        .glass-panel {
          background: rgba(30, 41, 59, 0.7);
          backdrop-filter: blur(12px);
          border-right: 1px solid rgba(255, 255, 255, 0.1);
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
      `}</style>

      {/* Sidebar */}
      <div className="glass-panel" style={{ width: '450px', padding: '24px', overflowY: 'auto', zIndex: 1000 }}>
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: '900', marginBottom: '4px', display: 'flex', alignItems: 'center', letterSpacing: '-0.5px' }}>
            <Activity style={{ marginRight: '12px' }} /> SMART CITY ANALYTICS
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>南鐵綠園道 · 通達性決策系統</p>
        </header>

        {/* 一、選擇站點 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <Zap size={14} style={{ marginRight: '8px' }} /> 01 觀測節點
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {STATIONS.map(s => (
              <button 
                key={s.id} onClick={() => focusOn(s)}
                style={{ 
                  padding: '14px 10px', borderRadius: '8px', cursor: 'pointer',
                  backgroundColor: selectedStation.id === s.id ? '#10b981' : '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: selectedStation.id === s.id ? '#0f172a' : '#f8fafc',
                  fontWeight: '800', fontSize: '0.85rem', transition: 'all 0.3s'
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </section>

        {/* 二、模擬角色 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <Users size={14} style={{ marginRight: '8px' }} /> 02 模擬使用者
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {USER_PROFILES.map(user => (
              <button 
                key={user.id} onClick={() => setCurrentUser(user)}
                style={{ 
                  padding: '8px 16px', borderRadius: '6px', cursor: 'pointer',
                  backgroundColor: currentUser.id === user.id ? '#3b82f6' : '#334155',
                  border: 'none', color: '#fff', fontWeight: '700', fontSize: '0.75rem', transition: 'all 0.2s'
                }}
              >
                {user.name}
              </button>
            ))}
          </div>
        </section>

        {/* 三、分析卡片 */}
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', marginBottom: '20px' }}>03 通達效益實測</h2>
          {relatedPOIs.map(poi => {
            const penalty = CROSSING_PENALTY[poi.crossingType] * poi.crossings;
            const groundTime = (poi.distToGreenway / currentUser.speed) + penalty + (poi.roadWidth / currentUser.speed);
            const bridgeTime = (poi.distToGreenway / currentUser.speed) + TRAVEL_PARAMS.slopeTime;

            return (
              <div key={poi.id} style={{ marginBottom: '20px', padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontWeight: '800', fontSize: '1rem', color: '#f8fafc', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>往 {poi.name}</span>
                  <span style={{ fontSize: '0.7rem', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '4px' }}>{poi.distToGreenway}m</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ color: '#f87171', fontSize: '0.65rem', fontWeight: '900', marginBottom: '4px' }}>地面模式</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900' }}>{formatTime(groundTime)}</div>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '4px' }}>⚠ {poi.crossings}路口 | +{penalty}s 延遲</div>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(16,185,129,0.05)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: '900', marginBottom: '4px' }}>綠園道模式</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '900' }}>{formatTime(bridgeTime)}</div>
                    <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '4px' }}>✅ 0次穿越 | 垂直流動</div>
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.75rem', borderLeft: '3px solid #3b82f6', lineHeight: '1.6' }}>
                  <strong style={{ color: '#3b82f6' }}>分析結論：</strong> 
                  {bridgeTime > groundTime 
                    ? `雖慢 ${Math.round(bridgeTime - groundTime)}s，但顯著降低車流衝突與體力耗損，適合${currentUser.name}。`
                    : `可節省 ${Math.round(groundTime - bridgeTime)}s，且提供完全的人車分流環境。`}
                </div>
              </div>
            );
          })}
        </section>

        {/* 四、設計建議 */}
        <section style={{ padding: '24px', backgroundColor: '#10b981', borderRadius: '16px', color: '#0f172a', boxShadow: '0 10px 30px rgba(16,185,129,0.3)' }}>
          <h2 style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
            <Info size={16} style={{ marginRight: '8px' }} /> 04 規劃建議結論
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 'bold', opacity: 0.7 }}>建議設置形式</div>
              <div style={{ fontWeight: '900', fontSize: '0.9rem' }}>
                {currentUser.id === 'wheelchair' ? '電梯優先' : '坡道 + 樓梯'}
              </div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 'bold', opacity: 0.7 }}>設置急迫性</div>
              <div style={{ fontWeight: '900', fontSize: '0.9rem' }}>
                {relatedPOIs.some(p => p.crossingType === 'Major') ? '關鍵核心' : '一般節點'}
              </div>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', lineHeight: '1.6', fontWeight: '700' }}>
            此區域住宅密度高且馬路穿越風險大，建議強化無障礙動線連續性。
          </p>
        </section>
      </div>

      {/* Map Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
          {/* 使用深色酷炫底圖 */}
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <MapController center={mapCenter} />
          
          {/* 綠園道霓虹路徑 */}
          <Polyline positions={GREENWAY_PATH} color="#10b981" weight={6} opacity={0.6} />
          <Polyline positions={GREENWAY_PATH} color="#10b981" weight={2} opacity={0.9} />
          
          {/* 站點標記 */}
          {STATIONS.map(s => (
            <Marker key={s.id} position={s.coordinates} icon={stationIcon}>
              <Popup><strong style={{ color: '#10b981' }}>{s.name}</strong><br/>關鍵分析節點</Popup>
            </Marker>
          ))}
          
          {/* 垂直動線標記 */}
          {VERTICAL_CIRCULATION.map(v => (
            <Marker key={v.id} position={v.coordinates} icon={verticalIcon}>
              <Popup><strong style={{ color: '#3b82f6' }}>{v.name}</strong><br/>垂直設施點</Popup>
            </Marker>
          ))}

          {/* POI 與社區範圍標示 */}
          {POIS.map(p => (
            <React.Fragment key={p.id}>
              {/* 社區影響範圍光圈 */}
              <Circle 
                center={p.coordinates} 
                radius={200} 
                pathOptions={{ 
                  fillColor: p.poiType === 'residential' ? '#10b981' : '#3b82f6', 
                  fillOpacity: 0.15, 
                  color: 'transparent' 
                }} 
              />
              <Marker position={p.coordinates} icon={createCustomIcon(p.poiType === 'residential' ? '#10b981' : '#3b82f6', p.poiType === 'residential' ? 'H' : 'O')}>
                <Popup><strong>{p.name}</strong><br/>服務人口: {p.population}</Popup>
              </Marker>
            </React.Fragment>
          ))}

          {/* 連結動線視覺化 */}
          {selectedStation && relatedPOIs.map(poi => (
            <Polyline 
              key={poi.id} 
              positions={[selectedStation.coordinates, poi.coordinates]} 
              color="#3b82f6" 
              weight={2} 
              dashArray="5, 10" 
              opacity={0.6} 
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default App;
