export interface GeoPoint {
  id: string;
  name: string;
  coordinates: [number, number];
  type: 'station' | 'slope' | 'vertical';
  description?: string;
}

export const STATIONS: GeoPoint[] = [
  { id: 'daqiao', name: '大橋車站', coordinates: [23.0238, 120.2223], type: 'station' },
  { id: 'tainan', name: '台南車站', coordinates: [22.9972, 120.2126], type: 'station' },
  { id: 'linsen', name: '林森站', coordinates: [22.9845, 120.2198], type: 'station' },
  { id: 'stainan', name: '南台南站', coordinates: [22.9734, 120.2245], type: 'station' },
];

export const SLOPES: GeoPoint[] = [
  { id: 's1', name: '斜坡 A', coordinates: [22.9823682, 120.2160112], type: 'slope' },
  { id: 's2', name: '斜坡 B', coordinates: [22.9942553, 120.2123863], type: 'slope' },
  { id: 's3', name: '斜坡 C', coordinates: [22.9790112, 120.217398], type: 'slope' },
];

export const VERTICAL_CIRCULATION: GeoPoint[] = [
  { id: 'v1', name: '垂直動線 1', coordinates: [22.9942405, 120.2123855], type: 'vertical' },
  { id: 'v2', name: '垂直動線 2', coordinates: [22.9914412, 120.2118782], type: 'vertical' },
  { id: 'v3', name: '垂直動線 3', coordinates: [22.9889734, 120.2114417], type: 'vertical' },
  { id: 'v4', name: '垂直動線 4', coordinates: [22.9854127, 120.2135232], type: 'vertical' },
  { id: 'v5', name: '垂直動線 5', coordinates: [22.9822235, 120.2152778], type: 'vertical' },
  { id: 'v6', name: '垂直動線 6', coordinates: [22.9786717, 120.2162833], type: 'vertical' },
];

export const GREENWAY_PATH: [number, number][] = [
  [23.0238, 120.2223],        // 大橋車站
  [22.9972, 120.2126],        // 台南車站
  [22.9942553, 120.2123863],  // 斜坡 B (高架橋北端)
  [22.9942405, 120.2123855],  // 垂直動線 1
  [22.9914412, 120.2118782],  // 垂直動線 2
  // 排除 v3 作為地面繞行展示
  [22.9854127, 120.2135232],  // 垂直動線 4
  [22.9845, 120.2198],        // 林森站
  [22.9823682, 120.2160112],  // 斜坡 A
  [22.9822235, 120.2152778],  // 垂直動線 5
  [22.9790112, 120.217398],   // 斜坡 C (高架橋南端終點)
  [22.9786717, 120.2162833],  // 垂直動線 6 (高架橋南端起點)
  [22.9734, 120.2245],        // 南台南站
];

export interface POI extends GeoPoint {
  linkedStationId: string;
  distToGreenway: number; // 距離綠園道的水平距離 (公尺)
  roadWidth: number;      // 需穿越的馬路寬度 (公尺)
  poiType: 'residential' | 'office';
  crossings: number;      // 平面需穿越馬路的次數
  crossingType: 'Small' | 'Standard' | 'Major'; // 路口規模
  trafficRisk: 'High' | 'Medium' | 'Low'; // 車流干擾程度
  population?: number;    // 預估服務人口
}

export const POIS: POI[] = [
  // 大橋車站周邊
  { id: 'p1', name: '大橋住宅區', coordinates: [23.0245, 120.2245], type: 'station', poiType: 'residential', linkedStationId: 'daqiao', distToGreenway: 250, roadWidth: 20, crossings: 2, crossingType: 'Standard', trafficRisk: 'Medium', population: 850 },
  // 台南車站周邊
  { id: 'p2', name: '站前商辦大樓', coordinates: [22.9975, 120.2145], type: 'station', poiType: 'office', linkedStationId: 'tainan', distToGreenway: 180, roadWidth: 30, crossings: 3, crossingType: 'Major', trafficRisk: 'High', population: 1500 },
  { id: 'p3', name: '成功大學區', coordinates: [23.0000, 120.2160], type: 'station', poiType: 'office', linkedStationId: 'tainan', distToGreenway: 450, roadWidth: 40, crossings: 4, crossingType: 'Major', trafficRisk: 'High', population: 3200 },
  // 林森站周邊
  { id: 'p4', name: '林森辦公區', coordinates: [22.9860, 120.2220], type: 'station', poiType: 'office', linkedStationId: 'linsen', distToGreenway: 220, roadWidth: 25, crossings: 2, crossingType: 'Standard', trafficRisk: 'Medium', population: 1200 },
  { id: 'p5', name: '東區住宅 A', coordinates: [22.9835, 120.2240], type: 'station', poiType: 'residential', linkedStationId: 'linsen', distToGreenway: 350, roadWidth: 15, crossings: 1, crossingType: 'Small', trafficRisk: 'Medium', population: 950 },
  // 南台南站周邊
  { id: 'p6', name: '崇德住宅區', coordinates: [22.9720, 120.2270], type: 'station', poiType: 'residential', linkedStationId: 'stainan', distToGreenway: 280, roadWidth: 20, crossings: 2, crossingType: 'Standard', trafficRisk: 'Low', population: 1100 },
];

export const CROSSING_PENALTY = {
  Small: 15,    // 等待+心理 15s
  Standard: 45, // 等待+心理 45s
  Major: 90,    // 等待+心理 90s
};

export interface UserProfile {
  id: string;
  name: string;
  speed: number;        // m/s
  slopePreference: number; // 0-1
  safetyWeight: number;    // 0-1
  accessWeight: number;    // 0-1
  timeWeight: number;      // 0-1
  canUseStairs: boolean;
  description: string;
}

export const USER_PROFILES: UserProfile[] = [
  { id: 'pedestrian', name: '一般行人', speed: 1.2, slopePreference: 0.5, safetyWeight: 0.3, accessWeight: 0.2, timeWeight: 0.5, canUseStairs: true, description: '重視效率，體能良好。' },
  { id: 'elderly', name: '長者', speed: 0.8, slopePreference: 0.8, safetyWeight: 0.6, accessWeight: 0.3, timeWeight: 0.1, canUseStairs: false, description: '行走較緩慢，對車流風險敏感。' },
  { id: 'wheelchair', name: '輪椅使用者', speed: 0.7, slopePreference: 1.0, safetyWeight: 0.5, accessWeight: 0.5, timeWeight: 0.0, canUseStairs: false, description: '高度依賴無障礙設施。' },
  { id: 'stroller', name: '推嬰兒車', speed: 0.9, slopePreference: 0.9, safetyWeight: 0.6, accessWeight: 0.3, timeWeight: 0.1, canUseStairs: false, description: '需要平穩且安全的動線。' },
  { id: 'bicycle', name: '腳踏車牽行', speed: 1.0, slopePreference: 0.9, safetyWeight: 0.4, accessWeight: 0.4, timeWeight: 0.2, canUseStairs: false, description: '坡道價值高於樓梯。' },
  { id: 'student', name: '通勤學生', speed: 1.3, slopePreference: 0.3, safetyWeight: 0.2, accessWeight: 0.1, timeWeight: 0.7, canUseStairs: true, description: '時間最優先，通常選擇捷徑。' },
];

export const TRAVEL_PARAMS = {
  walkingSpeed: 1.0,      // m/s (default)
  slopeTime: 70,          // 70 seconds
  stairsTime: 40,         // 40 seconds
  baselinePET: 45.4,      // 台南夏季正午 PET (未遮蔭)
  comfortThreshold: 35.0, // 舒適門檻
  bridgePETReduction: 11.4, // 高架結構即時降溫效益
};
