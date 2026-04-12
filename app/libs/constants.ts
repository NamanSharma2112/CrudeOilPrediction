// ----------------------------------------------------------------------
// Market Symbols & Time Ranges
// ----------------------------------------------------------------------

export const COMMODITIES = {
  BRENT: 'brent',
  WTI: 'wti',
} as const;

export type CommoditySymbol = typeof COMMODITIES[keyof typeof COMMODITIES];

export const TIME_RANGES = ['1W', '1M', '3M', '1Y', '5Y'] as const;
export type TimeRange = typeof TIME_RANGES[number];

// ----------------------------------------------------------------------
// ML Model Defaults
// ----------------------------------------------------------------------

export const FORECAST_HORIZONS = [7, 30] as const;
export type ForecastHorizon = typeof FORECAST_HORIZONS[number];

export const DEFAULT_SCENARIO_OVERRIDES = {
  opec_cut_pct: 0,
  usd_index: 104.0, 
  demand_growth: 1.0,
};

// ----------------------------------------------------------------------
// Geopolitical & Supply Chain (Chokepoints)
// Volumes are approximate million barrels per day (mb/d) based on EIA data
// ----------------------------------------------------------------------

export type ChokepointStatus = 'normal' | 'warning' | 'disrupted';

export interface Chokepoint {
  id: string;
  name: string;
  volumeMbd: number;
  coordinates: [number, number]; // [Longitude, Latitude] for D3.js
  description: string;
}

export const GLOBAL_CHOKEPOINTS: Chokepoint[] = [
  {
    id: 'hormuz',
    name: 'Strait of Hormuz',
    volumeMbd: 21.0,
    coordinates: [56.25, 26.56], 
    description: 'The world\'s most critical oil transit chokepoint between Oman and Iran.',
  },
  {
    id: 'malacca',
    name: 'Strait of Malacca',
    volumeMbd: 16.0,
    coordinates: [100.0, 4.0],
    description: 'Key bottleneck linking the Indian Ocean to the South China Sea and Pacific.',
  },
  {
    id: 'suez',
    name: 'Suez Canal & SUMED',
    volumeMbd: 9.0,
    coordinates: [32.3, 30.6],
    description: 'Crucial transit route between the Red Sea and the Mediterranean.',
  },
  {
    id: 'bab-el-mandeb',
    name: 'Bab el-Mandeb',
    volumeMbd: 7.0,
    coordinates: [43.3, 12.6],
    description: 'Chokepoint between the Horn of Africa and the Middle East connecting to the Red Sea.',
  },
  {
    id: 'panama',
    name: 'Panama Canal',
    volumeMbd: 1.2,
    coordinates: [-79.9, 9.1],
    description: 'Important for petroleum products connecting the Pacific and Atlantic.',
  },
];

// ----------------------------------------------------------------------
// Country Groupings (ISO 3166-1 alpha-3 codes for D3 Choropleth Map)
// ----------------------------------------------------------------------

// OPEC current active members (as of 2024)
export const OPEC_MEMBERS = [
  'DZA', // Algeria
  'COG', // Congo
  'GNQ', // Equatorial Guinea
  'GAB', // Gabon
  'IRN', // Iran
  'IRQ', // Iraq
  'KWT', // Kuwait
  'LBY', // Libya
  'NGA', // Nigeria
  'SAU', // Saudi Arabia
  'ARE', // United Arab Emirates
  'VEN', // Venezuela
];

// Key Non-OPEC Producers (OPEC+ allies and major independents)
export const MAJOR_NON_OPEC_PRODUCERS = [
  'USA', // United States
  'RUS', // Russia (OPEC+)
  'CAN', // Canada
  'CHN', // China
  'BRA', // Brazil
  'KAZ', // Kazakhstan (OPEC+)
  'MEX', // Mexico (OPEC+)
  'NOR', // Norway
];