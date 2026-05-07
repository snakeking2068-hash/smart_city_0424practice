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

// 綠園道高架橋：研究範圍主路徑 (不依附既有道路)
export const VIADUCT_PATH: [number, number][] = [
  [22.9942553, 120.2123863],  // 北端：斜坡 B
  [22.9942405, 120.2123855],  // 垂直動線 1
  [22.9914412, 120.2118782],  // 垂直動線 2
  [22.9889734, 120.2114417],  // 垂直動線 3 (納入高架橋研究範圍)
  [22.9854127, 120.2135232],  // 垂直動線 4
  [22.9822235, 120.2152778],  // 垂直動線 5
  [22.9823682, 120.2160112],  // 斜坡 A
  [22.9786717, 120.2162833],  // 南端：垂直動線 6
  [22.9790112, 120.217398],   // 南端：斜坡 C
];
