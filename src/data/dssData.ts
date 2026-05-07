
export const BASELINE_PET = 45.4;
export const COMFORT_THRESHOLD = 35.0;
export const PET_PER_SHADE = 11.4;
export const YEARS = 30;

// Logistic function helper
const logistic = (year: number, k: number, mid: number) => {
  return 1.0 / (1.0 + Math.exp(-k * (year - mid)));
};

// --- PT: Pure Tree ---
const PT_INITIAL_SHADE = 0.10;
const PT_MAX_NAT_SHADE = 0.70;
const PT_SOIL_PENALTY = 0.30;
const PT_MAX_SHADE = PT_MAX_NAT_SHADE * (1 - PT_SOIL_PENALTY); // 0.49
const PT_GROWTH_K = 0.28;
const PT_GROWTH_MID = 13.0;
const PT_RESILIENCE_BASE = 0.75;
const PT_RESILIENCE_MAX = 0.93;
const PT_RESILIENCE_RATE = 0.18;

export const getPTShade = (year: number) => {
  const s = PT_INITIAL_SHADE + (PT_MAX_SHADE - PT_INITIAL_SHADE) * logistic(year, PT_GROWTH_K, PT_GROWTH_MID);
  return Math.max(PT_INITIAL_SHADE, Math.min(s, PT_MAX_SHADE));
};

export const getPTResilience = (year: number) => {
  return Math.min(PT_RESILIENCE_BASE + PT_RESILIENCE_RATE * (1 - Math.exp(-0.18 * year)), PT_RESILIENCE_MAX);
};

export const getPTPET = (year: number) => {
  return BASELINE_PET - getPTShade(year) * getPTResilience(year) * PET_PER_SHADE;
};

// --- PES: Pure Elevated Structure ---
const PES_SHADE = 1.00;
export const getPESPET = (year: number) => {
  return BASELINE_PET - PES_SHADE * PET_PER_SHADE;
};

// --- HM: Hybrid Model ---
const HM_STRUCT_SHADE = 0.82;
const HM_SIDE_TREE_MAX = 0.13;
const HM_TREE_K = 0.38;
const HM_TREE_MID = 8.0;
const HM_MAX_ET_BONUS = 1.5;
const HM_ET_K = 0.28;
const HM_ET_MID = 12.0;

export const getHMShade = (year: number) => {
  return HM_STRUCT_SHADE + HM_SIDE_TREE_MAX * logistic(year, HM_TREE_K, HM_TREE_MID);
};

export const getHMETBonus = (year: number) => {
  return HM_MAX_ET_BONUS * logistic(year, HM_ET_K, HM_ET_MID);
};

export const getHMPET = (year: number) => {
  return BASELINE_PET - getHMShade(year) * PET_PER_SHADE - getHMETBonus(year);
};

// --- Eco Scores ---
export const getEcoScorePT = (year: number) => {
  const carbon = 40 * logistic(year, 0.25, 15) * getPTResilience(year);
  return 10 + carbon;
};

export const getEcoScorePES = (year: number) => {
  return 52 - 2 * logistic(year, 0.08, 20);
};

export const getEcoScoreHM = (year: number) => {
  const solar = 42;
  const carbon = 28 * logistic(year, 0.30, 10);
  const biodiv = 22 * logistic(year, 0.25, 12);
  return Math.min(solar + carbon + biodiv, 98);
};

// --- Usable Hours ---
const SUMMER_DAYS = 214;
const ACTIVE_HOURS = 14;
const PET_MIN_FLOOR = 30.0;

export const getDailyUsableHours = (noonPET: number) => {
  const dailyMin = Math.max(PET_MIN_FLOOR, noonPET * 0.72);
  if (noonPET <= COMFORT_THRESHOLD) return ACTIVE_HOURS;
  if (dailyMin >= COMFORT_THRESHOLD) return 0;

  // Numerical integration
  const steps = 100;
  let count = 0;
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * ACTIVE_HOURS;
    const petT = dailyMin + (noonPET - dailyMin) * Math.sin((Math.PI * t) / ACTIVE_HOURS);
    if (petT < COMFORT_THRESHOLD) count++;
  }
  return (count / steps) * ACTIVE_HOURS;
};

export const getAnnualUsableHours = (noonPET: number) => {
  return getDailyUsableHours(noonPET) * SUMMER_DAYS;
};

// --- Radar Data ---
export const RADAR_LABELS = ['成本效益', '即時見效', '生態效益', '熱舒適度', '空間自由度'];
export const RADAR_DATA = {
  PT: [62, 12, 60, 15, 52],
  PES: [58, 98, 52, 87, 68],
  HM: [78, 80, 92, 95, 91],
};

export const getScenarioSummary = () => {
  const years = Array.from({ length: YEARS + 1 }, (_, i) => i);
  const data = years.map(y => ({
    year: y,
    PT: getPTPET(y),
    PES: getPESPET(y),
    HM: getHMPET(y),
    PT_eco: getEcoScorePT(y),
    PES_eco: getEcoScorePES(y),
    HM_eco: getEcoScoreHM(y),
    PT_hours: getAnnualUsableHours(getPTPET(y)),
    PES_hours: getAnnualUsableHours(getPESPET(y)),
    HM_hours: getAnnualUsableHours(getHMPET(y)),
  }));

  const totalHours = {
    PT: data.reduce((acc, curr) => acc + curr.PT_hours, 0),
    PES: data.reduce((acc, curr) => acc + curr.PES_hours, 0),
    HM: data.reduce((acc, curr) => acc + curr.HM_hours, 0),
  };

  return { data, totalHours };
};
