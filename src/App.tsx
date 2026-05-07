import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Map as MapIcon, Home, Clock, Building2, Users, Info, Activity, Zap, TreePine, Construction, Combine, TrendingDown, Award } from 'lucide-react';
import { STATIONS, VERTICAL_CIRCULATION, GREENWAY_PATH, POIS, TRAVEL_PARAMS, USER_PROFILES, CROSSING_PENALTY, GeoPoint, UserProfile } from './data/geoData';
import { RADAR_LABELS, RADAR_DATA, getScenarioSummary, COMFORT_THRESHOLD, getPTPET, getPESPET, getHMPET, getPTShade, getHMShade, getEcoScorePT, getEcoScorePES, getEcoScoreHM, getAnnualUsableHours } from './data/dssData';

// --- DSS View Component ---
const DSSView = ({ selectedScenario, setSelectedScenario, simulationYear, setSimulationYear, selectedStation, scenarioDetails }: any) => {
  const { data } = useMemo(() => getScenarioSummary(), []);
  
  const COLORS = {
    PT: '#ef4444',
    PES: '#3b82f6',
    HM: '#10b981'
  };

  const currentMetrics = useMemo(() => {
    const y = simulationYear;
    return {
      PT: { pet: getPTPET(y), shade: getPTShade(y), eco: getEcoScorePT(y) },
      PES: { pet: getPESPET(y), shade: 1.0, eco: getEcoScorePES(y) },
      HM: { pet: getHMPET(y), shade: getHMShade(y), eco: getEcoScoreHM(y) }
    };
  }, [simulationYear]);

  const activeMetrics = currentMetrics[selectedScenario as 'PT' | 'PES' | 'HM'];

  return (
    <div style={{ color: '#f8fafc' }}>
      {/* 區段方案切換 */}
      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
          <Combine size={14} style={{ marginRight: '8px' }} /> 01 {selectedStation.name} 方案模擬
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          {(['PT', 'PES', 'HM'] as const).map(s => (
            <button 
              key={s} onClick={() => setSelectedScenario(s)}
              style={{ 
                padding: '12px 4px', borderRadius: '8px', cursor: 'pointer',
                backgroundColor: selectedScenario === s ? COLORS[s] : '#1e293b',
                border: 'none', color: selectedScenario === s ? '#0f172a' : '#94a3b8',
                fontWeight: '900', fontSize: '0.75rem', transition: 'all 0.3s'
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* 方案詳情卡片 */}
        <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${scenarioDetails[selectedScenario].color}44`, marginBottom: '20px' }}>
          <div style={{ fontWeight: '900', fontSize: '1rem', color: scenarioDetails[selectedScenario].color, marginBottom: '8px' }}>
            {scenarioDetails[selectedScenario].name}
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '12px', lineHeight: '1.4' }}>{scenarioDetails[selectedScenario].description}</p>
          <div style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex' }}><span style={{ color: '#10b981', fontWeight: '900', marginRight: '6px' }}>[優]</span> <span style={{ color: '#f8fafc' }}>{scenarioDetails[selectedScenario].pros}</span></div>
            <div style={{ display: 'flex' }}><span style={{ color: '#ef4444', fontWeight: '900', marginRight: '6px' }}>[缺]</span> <span style={{ color: '#f8fafc' }}>{scenarioDetails[selectedScenario].cons}</span></div>
          </div>
        </div>

        {/* 模擬時間軸 */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>模擬年份：第 {simulationYear} 年</span>
          </div>
          <input 
            type="range" min="0" max="30" value={simulationYear} 
            onChange={(e) => setSimulationYear(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: scenarioDetails[selectedScenario].color }}
          />
        </div>

        {/* 即時指標統計 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginBottom: '4px' }}>PET 溫度</div>
            <div style={{ fontSize: '1rem', fontWeight: '900', color: activeMetrics.pet <= 35 ? '#10b981' : '#f87171' }}>{activeMetrics.pet.toFixed(1)}°C</div>
          </div>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginBottom: '4px' }}>遮蔭覆蓋</div>
            <div style={{ fontSize: '1rem', fontWeight: '900' }}>{(activeMetrics.shade * 100).toFixed(0)}%</div>
          </div>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginBottom: '4px' }}>生態效益</div>
            <div style={{ fontSize: '1rem', fontWeight: '900', color: '#3b82f6' }}>{activeMetrics.eco.toFixed(0)}</div>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
          <TrendingDown size={14} style={{ marginRight: '8px' }} /> 02 30年熱舒適趨勢分析
        </h2>
        <div style={{ height: '160px', width: '100%', position: 'relative', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'absolute', left: '40px', right: '15px', top: '15px', bottom: '25px' }}>
            <div style={{ position: 'absolute', top: `${(45.4 - 35) / (45.4 - 28) * 100}%`, left: 0, right: 0, borderTop: '1px dashed #f59e0b', opacity: 0.5 }} />
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline fill="none" stroke={COLORS.HM} strokeWidth={selectedScenario === 'HM' ? '3' : '1'} opacity={selectedScenario === 'HM' ? '1' : '0.3'} points={data.map((d, i) => `${(i / 30) * 100},${(45.4 - d.HM) / (45.4 - 28) * 100}`).join(' ')} />
              <polyline fill="none" stroke={COLORS.PES} strokeWidth={selectedScenario === 'PES' ? '3' : '1'} opacity={selectedScenario === 'PES' ? '1' : '0.3'} points={data.map((d, i) => `${(i / 30) * 100},${(45.4 - d.PES) / (45.4 - 28) * 100}`).join(' ')} />
              <polyline fill="none" stroke={COLORS.PT} strokeWidth={selectedScenario === 'PT' ? '3' : '1'} opacity={selectedScenario === 'PT' ? '1' : '0.3'} strokeDasharray="2" points={data.map((d, i) => `${(i / 30) * 100},${(45.4 - d.PT) / (45.4 - 28) * 100}`).join(' ')} />
              {/* 年份指示線 */}
              <line x1={(simulationYear / 30) * 100} y1="0" x2={(simulationYear / 30) * 100} y2="100" stroke="#fff" strokeWidth="1" opacity="0.4" />
            </svg>
          </div>
        </div>
      </section>

      <section style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h3 style={{ fontSize: '0.8rem', fontWeight: '900', color: COLORS[selectedScenario as 'PT'|'PES'|'HM'], marginBottom: '12px' }}>決策建議：{selectedStation.name}</h3>
        <p style={{ fontSize: '0.75rem', lineHeight: '1.6', color: '#f8fafc' }}>
          {selectedScenario === 'HM' 
            ? `此段建議採 ${scenarioDetails.HM.name}，因為可在第8年即進入熱舒適區，並隨時間提供更高的生態效益。`
            : selectedScenario === 'PT'
            ? `採 ${scenarioDetails.PT.name} 雖具備高生態潛力，但在此路段受土層限制，30年內 PET 仍達 ${(getPTPET(30)).toFixed(1)}°C，無法有效改善暑熱。`
            : `採 ${scenarioDetails.PES.name} 雖能立即降溫，但長期而言缺乏生物多樣性與蒸發散熱帶來的額外效益。`}
        </p>
      </section>
    </div>
  );
};

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
  const [activeTab, setActiveTab] = useState<'access' | 'dss'>('access');
  const [routingMode, setRoutingMode] = useState<'fastest' | 'safest' | 'coolest' | 'accessible' | 'recommended'>('recommended');
  const [selectedScenario, setSelectedScenario] = useState<'PT' | 'PES' | 'HM'>('HM');
  const [simulationYear, setSimulationYear] = useState<number>(10);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    accessTime: false,
    crossingRisk: false,
    thermalPET: true,
    shadeCoverage: false,
    usability: false,
    decisionScore: false
  });

  const COLORS = {
    PT: '#ef4444',
    PES: '#3b82f6',
    HM: '#10b981'
  };

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const scenarioDetails = useMemo(() => ({
    PT: { name: '純植樹 (PT)', color: '#ef4444', pros: '生態效益高、成本較低', cons: '初期遮蔭不足，需等待樹冠成熟', description: '以自然植栽為主，受土層深度限制較大。' },
    PES: { name: '純高架結構 (PES)', color: '#3b82f6', pros: '立即遮蔭，熱舒適穩定', cons: '生態效益與空間彈性較低', description: '即時提供100%遮蔭，但缺乏生物多樣性。' },
    HM: { name: '混合模型 (HM)', color: '#10b981', pros: '兼具立即遮蔭與長期生態', cons: '構造與維護較複雜', description: '結構遮蔭與側植喬木結合，都市整合最優解。' }
  }), []);

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

  const getPlannedPath = (poi: any) => {
    // 簡單路由邏輯：
    // 如果是夏季避暑、最安全、或推薦（且非學生），則走綠園道路徑
    const useGreenway = routingMode === 'coolest' || routingMode === 'safest' || (routingMode === 'recommended' && currentUser.id !== 'student');
    
    if (useGreenway) {
      // 尋找離 POI 最近的綠園道節點
      let minPOI = Infinity;
      let poiNode = GREENWAY_PATH[0];
      GREENWAY_PATH.forEach(pos => {
        const d = Math.sqrt(Math.pow(pos[0]-poi.coordinates[0], 2) + Math.pow(pos[1]-poi.coordinates[1], 2));
        if (d < minPOI) { minPOI = d; poiNode = pos; }
      });

      // 尋找離 Station 最近的綠園道節點
      let minStation = Infinity;
      let stationNode = GREENWAY_PATH[0];
      let stationIdx = 0;
      GREENWAY_PATH.forEach((pos, idx) => {
        const d = Math.sqrt(Math.pow(pos[0]-selectedStation.coordinates[0], 2) + Math.pow(pos[1]-selectedStation.coordinates[1], 2));
        if (d < minStation) { minStation = d; stationNode = pos; stationIdx = idx; }
      });

      // 取得 POI 節點在路徑中的索引
      const poiIdx = GREENWAY_PATH.findIndex(p => p === poiNode);
      
      // 提取綠園道路段
      const start = Math.min(stationIdx, poiIdx);
      const end = Math.max(stationIdx, poiIdx);
      const segments = GREENWAY_PATH.slice(start, end + 1);
      if (stationIdx > poiIdx) segments.reverse();

      // 尋找適合使用者的垂直動線 (如：輪椅優先找電梯)
      const targetVType = currentUser.id === 'wheelchair' ? 'elevator' : 'slope';
      const bestV = VERTICAL_CIRCULATION
        .filter(v => v.name.toLowerCase().includes(targetVType))
        .sort((a, b) => {
          const distA = Math.sqrt(Math.pow(a.coordinates[0]-poiNode[0], 2) + Math.pow(a.coordinates[1]-poiNode[1], 2));
          const distB = Math.sqrt(Math.pow(b.coordinates[0]-poiNode[0], 2) + Math.pow(b.coordinates[1]-poiNode[1], 2));
          return distA - distB;
        })[0];

      return {
        positions: [
          selectedStation.coordinates,
          ...segments,
          bestV ? bestV.coordinates : poiNode,
          poi.coordinates
        ],
        vPoint: bestV
      };
    } else {
      // 平面路徑模擬
      return {
        positions: [
          selectedStation.coordinates,
          [selectedStation.coordinates[0], poi.coordinates[1]],
          poi.coordinates
        ],
        vPoint: null
      };
    }
  };

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
      <div className="glass-panel" style={{ width: '480px', padding: '24px', overflowY: 'auto', zIndex: 1000 }}>
        <header style={{ marginBottom: '24px' }}>
          <h1 style={{ color: '#10b981', fontSize: '1.5rem', fontWeight: '900', marginBottom: '4px', display: 'flex', alignItems: 'center', letterSpacing: '-0.5px' }}>
            <Activity style={{ marginRight: '12px' }} /> SMART CITY ANALYTICS
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>南鐵綠園道 · 通達性決策系統</p>
        </header>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: '#1e293b', padding: '4px', borderRadius: '10px', marginBottom: '24px' }}>
          <button 
            onClick={() => setActiveTab('access')}
            style={{ 
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === 'access' ? '#0f172a' : 'transparent',
              color: activeTab === 'access' ? '#10b981' : '#94a3b8',
              fontWeight: '800', fontSize: '0.85rem', transition: 'all 0.3s'
            }}
          >
            通達分析
          </button>
          <button 
            onClick={() => setActiveTab('dss')}
            style={{ 
              flex: 1, padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              backgroundColor: activeTab === 'dss' ? '#0f172a' : 'transparent',
              color: activeTab === 'dss' ? '#10b981' : '#94a3b8',
              fontWeight: '800', fontSize: '0.85rem', transition: 'all 0.3s'
            }}
          >
            DSS 決策系統
          </button>
        </div>

        {activeTab === 'access' ? (
          <>
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

            {/* 三、路徑偏好 */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
                <Compass size={14} style={{ marginRight: '8px' }} /> 03 規劃路徑偏好
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                {[
                  { id: 'fastest', label: '最快路徑', color: '#ef4444' },
                  { id: 'safest', label: '最安全', color: '#3b82f6' },
                  { id: 'coolest', label: '夏季避暑', color: '#10b981' },
                  { id: 'accessible', label: '無障礙', color: '#8b5cf6' },
                  { id: 'recommended', label: '綜合推薦', color: '#f59e0b' },
                ].map(mode => (
                  <button 
                    key={mode.id} onClick={() => setRoutingMode(mode.id as any)}
                    style={{ 
                      padding: '8px', borderRadius: '6px', cursor: 'pointer',
                      backgroundColor: routingMode === mode.id ? mode.color : '#1e293b',
                      border: '1px solid rgba(255,255,255,0.05)',
                      color: routingMode === mode.id ? '#0f172a' : '#94a3b8',
                      fontWeight: '800', fontSize: '0.65rem', transition: 'all 0.2s'
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </section>

            {/* 四、分析卡片 */}
            <section style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', marginBottom: '20px' }}>04 通達效益實測</h2>
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
                  {/* 地面模式卡片 */}
                  <div style={{ padding: '12px', background: 'rgba(239,68,68,0.05)', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <div style={{ color: '#f87171', fontSize: '0.65rem', fontWeight: '900', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                      <Construction size={10} style={{ marginRight: '4px' }} /> 地面模式 (A)
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '8px' }}>{formatTime(groundTime)}</div>
                    
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>熱舒適 PET</span>
                        <span style={{ color: '#f87171' }}>45.4°C (極高)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>遮蔭覆蓋率</span>
                        <span style={{ color: '#f87171' }}>10%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>安全風險</span>
                        <span style={{ color: '#f87171' }}>{poi.trafficRisk === 'High' ? '高' : '中'} ({poi.crossings}路口)</span>
                      </div>
                    </div>
                  </div>

                  {/* 綠園道模式卡片 */}
                  <div style={{ padding: '12px', background: 'rgba(16,185,129,0.05)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <div style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: '900', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
                      <TreePine size={10} style={{ marginRight: '4px' }} /> 綠園道模式 (B)
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '8px' }}>{formatTime(bridgeTime)}</div>

                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>熱舒適 PET</span>
                        <span style={{ color: '#10b981' }}>34.0°C (舒適)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>遮蔭覆蓋率</span>
                        <span style={{ color: '#10b981' }}>95%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>安全風險</span>
                        <span style={{ color: '#10b981' }}>極低 (0路口)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', fontSize: '0.75rem', borderLeft: '3px solid #3b82f6', lineHeight: '1.6' }}>
                  <strong style={{ color: '#3b82f6' }}>綜合評估建議：</strong> 
                  {bridgeTime > groundTime 
                    ? `雖步行時間稍長，但考量「夏季熱舒適」與「人車分流安全性」，綠園道模式能提供更友善的慢行體驗，對${currentUser.name}尤其關鍵。`
                    : `綠園道模式在「時間效率」與「熱環境舒適」上均具壓倒性優勢，可省下 ${Math.round(groundTime - bridgeTime)}s 並避開車流衝突點。`}
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
          </>
        ) : (
          <DSSView 
            selectedScenario={selectedScenario} 
            setSelectedScenario={setSelectedScenario} 
            simulationYear={simulationYear} 
            setSimulationYear={setSimulationYear} 
            selectedStation={selectedStation} 
            scenarioDetails={scenarioDetails} 
          />
        )}
      </div>


      {/* Map Content */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* Layer Switcher Panel */}
        <div style={{ 
          position: 'absolute', top: '20px', right: '20px', zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)',
          padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
          width: '200px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
        }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: '900', color: '#10b981', marginBottom: '12px', display: 'flex', alignItems: 'center' }}>
            <MapIcon size={14} style={{ marginRight: '8px' }} /> 圖層切換
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { id: 'accessTime', label: '通達時間圖層' },
              { id: 'crossingRisk', label: '過馬路風險圖層' },
              { id: 'thermalPET', label: '熱舒適 PET 圖層' },
              { id: 'shadeCoverage', label: '遮蔭覆蓋率圖層' },
              { id: 'usability', label: '30 年可用性圖層' },
              { id: 'decisionScore', label: '綜合決策分數圖層' },
            ].map(layer => (
              <label key={layer.id} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.75rem', color: '#f8fafc' }}>
                <input 
                  type="checkbox" 
                  checked={activeLayers[layer.id]} 
                  onChange={() => toggleLayer(layer.id)}
                  style={{ marginRight: '10px', accentColor: '#10b981' }}
                />
                {layer.label}
              </label>
            ))}
          </div>
        </div>

        <MapContainer center={mapCenter} zoom={16} style={{ height: '100%', width: '100%' }}>
          {/* 使用深色酷炫底圖 */}
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <MapController center={mapCenter} />
          
          {/* 綠園道霓虹路徑 */}
          <Polyline positions={GREENWAY_PATH} color="#10b981" weight={6} opacity={0.6} />
          <Polyline positions={GREENWAY_PATH} color="#10b981" weight={2} opacity={0.9} />
          
          {/* PET / Shade / Usability Heatmap along Greenway */}
          {(activeLayers.thermalPET || activeLayers.shadeCoverage || activeLayers.usability) && (
            GREENWAY_PATH.map((pos, i) => {
              if (i === 0) return null;
              const prev = GREENWAY_PATH[i-1];
              const pet = selectedScenario === 'PT' ? getPTPET(simulationYear) : (selectedScenario === 'PES' ? getPESPET(simulationYear) : getHMPET(simulationYear));
              const shade = selectedScenario === 'PT' ? getPTShade(simulationYear) : (selectedScenario === 'PES' ? 1.0 : getHMShade(simulationYear));
              const hours = getAnnualUsableHours(pet);

              let color = '#10b981';
              if (activeLayers.thermalPET) {
                color = pet <= 35 ? '#10b981' : (pet <= 38 ? '#f59e0b' : '#ef4444');
              } else if (activeLayers.shadeCoverage) {
                color = shade >= 0.8 ? '#10b981' : (shade >= 0.4 ? '#3b82f6' : '#94a3b8');
              } else if (activeLayers.usability) {
                color = hours >= 2000 ? '#10b981' : (hours >= 1000 ? '#3b82f6' : '#ef4444');
              }

              return <Polyline key={`heat-${i}`} positions={[prev, pos]} color={color} weight={12} opacity={0.4} />;
            })
          )}

          {/* 綜合決策分數圖層 - 用雷達圖覆蓋在站點上或顯示分數 */}
          {activeLayers.decisionScore && STATIONS.map(s => {
            const score = Math.round(Object.values(RADAR_DATA[selectedScenario]).reduce((a: number, b: number) => a + b, 0) / 5);
            return (
              <Circle 
                key={`score-${s.id}`}
                center={s.coordinates}
                radius={score * 1.5}
                pathOptions={{ fillColor: COLORS[selectedScenario as keyof typeof COLORS], fillOpacity: 0.3, color: COLORS[selectedScenario as keyof typeof COLORS], weight: 1 }}
              >
                <Popup>綜合評分: {score}分</Popup>
              </Circle>
            );
          })}

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

          {/* 區域色塊 (Zoning) - 商辦與住宅區 */}
          {POIS.map(p => {
            const offset = 0.0015; // 區域大小偏移量
            const bounds: [number, number][] = [
              [p.coordinates[0] - offset, p.coordinates[1] - offset],
              [p.coordinates[0] + offset, p.coordinates[1] - offset],
              [p.coordinates[0] + offset, p.coordinates[1] + offset],
              [p.coordinates[0] - offset, p.coordinates[1] + offset],
            ];
            
            return (
              <Polygon 
                key={`zone-${p.id}`}
                positions={bounds}
                pathOptions={{
                  fillColor: p.poiType === 'residential' ? '#10b981' : '#3b82f6',
                  fillOpacity: 0.1,
                  color: p.poiType === 'residential' ? '#10b981' : '#3b82f6',
                  weight: 1,
                  dashArray: '5, 5'
                }}
              >
                <Popup>
                  <div style={{ fontSize: '0.75rem' }}>
                    <strong style={{ color: p.poiType === 'residential' ? '#10b981' : '#3b82f6' }}>
                      {p.poiType === 'residential' ? '住宅社區區域' : '商辦核心區域'}
                    </strong><br/>
                    預估影響範圍: 150m x 150m
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {/* POI 與社區範圍標示 */}
          {POIS.map(p => (
            <React.Fragment key={p.id}>
              {/* 通達時間圖層 - 顯示緩衝圓圈 */}
              {activeLayers.accessTime && (
                <Circle 
                  center={p.coordinates} 
                  radius={(p.distToGreenway / currentUser.speed) * 0.5} 
                  pathOptions={{ 
                    fillColor: '#8b5cf6', 
                    fillOpacity: 0.2, 
                    color: '#8b5cf6',
                    weight: 1,
                    dashArray: '5, 5'
                  }} 
                />
              )}

              {/* 過馬路風險圖層 - 標示危險點 */}
              {activeLayers.crossingRisk && p.crossings > 0 && (
                <Circle 
                  center={p.coordinates} 
                  radius={p.crossings * 10} 
                  pathOptions={{ 
                    fillColor: p.trafficRisk === 'High' ? '#ef4444' : '#f59e0b', 
                    fillOpacity: 0.4, 
                    color: 'white',
                    weight: 1
                  }} 
                />
              )}

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

          {/* 連結動線視覺化 - 根據路由模式顯示不同顏色與路徑 */}
          {selectedStation && relatedPOIs.map(poi => {
            let pathColor = '#3b82f6'; // Default (Safest/Recommended)
            let pathWeight = 2;
            let pathOpacity = 0.6;
            let dashArray = "5, 10";

            if (routingMode === 'fastest') {
              pathColor = '#ef4444';
              dashArray = "";
            } else if (routingMode === 'coolest') {
              pathColor = '#10b981';
              pathWeight = 4;
              pathOpacity = 0.8;
              dashArray = "";
            } else if (routingMode === 'accessible') {
              pathColor = '#8b5cf6';
              dashArray = "10, 5";
            } else if (routingMode === 'recommended') {
              pathColor = '#f59e0b';
              pathWeight = 3;
              pathOpacity = 0.9;
              dashArray = "";
            }

            const { positions, vPoint } = getPlannedPath(poi);

            return (
              <React.Fragment key={poi.id}>
                <Polyline 
                  positions={positions as any} 
                  color={pathColor} 
                  weight={pathWeight} 
                  dashArray={dashArray} 
                  opacity={pathOpacity} 
                >
                  <Popup>
                    <div style={{ padding: '4px' }}>
                      <strong style={{ color: pathColor }}>{
                        routingMode === 'coolest' ? '夏季避暑推薦路徑' : 
                        routingMode === 'fastest' ? '最快平面路徑' : '分析規劃路徑'
                      }</strong>
                      <div style={{ fontSize: '0.7rem', marginTop: '4px', color: '#64748b' }}>
                        優先權：{routingMode}<br/>
                        路徑節點：{positions.length} 處<br/>
                        {vPoint && `建議轉乘點：${vPoint.name}`}
                      </div>
                    </div>
                  </Popup>
                </Polyline>

                {/* 轉乘點高亮標示 */}
                {vPoint && (
                  <Circle 
                    center={vPoint.coordinates}
                    radius={15}
                    pathOptions={{ color: '#fff', fillColor: pathColor, fillOpacity: 0.8, weight: 2 }}
                  >
                    <Popup>建議此處上下綠園道 ({vPoint.name})</Popup>
                  </Circle>
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default App;
