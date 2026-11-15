// ----------------------------------------------------------------------
// Static reference data for the maps.
// Production: approximate 2023 total petroleum & other liquids output
// (million barrels/day), rounded, after EIA International Energy Statistics.
// Keys match the country names used by meridian-ui's world map.
// ----------------------------------------------------------------------

export const PRODUCTION_MBD: Record<string, number> = {
  'United States of America': 21.9,
  'Saudi Arabia': 11.1,
  Russia: 10.8,
  Canada: 5.8,
  China: 5.3,
  Iraq: 4.4,
  Brazil: 4.3,
  'United Arab Emirates': 4.2,
  Iran: 4.0,
  Kuwait: 2.9,
  Mexico: 2.0,
  Norway: 2.0,
  Kazakhstan: 1.9,
  Qatar: 1.8,
  Nigeria: 1.5,
  Algeria: 1.4,
  Libya: 1.3,
  Angola: 1.2,
  Oman: 1.0,
  India: 0.9,
  Argentina: 0.8,
  Colombia: 0.8,
  Venezuela: 0.8,
  Indonesia: 0.8,
  'United Kingdom': 0.7,
  Azerbaijan: 0.6,
  Malaysia: 0.6,
  Egypt: 0.6,
  Ecuador: 0.5,
  Guyana: 0.4,
};

export const PRODUCTION_SHORT_NAMES: Record<string, string> = {
  'United States of America': 'United States',
  'United Arab Emirates': 'UAE',
};

type Pt = { lat: number; lng: number };
const P = {
  rasTanura: { lat: 26.64, lng: 50.16 },
  basra: { lat: 30.5, lng: 47.8 },
  fujairah: { lat: 25.12, lng: 56.33 },
  primorsk: { lat: 60.35, lng: 28.62 },
  kozmino: { lat: 42.73, lng: 133.0 },
  hardisty: { lat: 52.67, lng: -111.3 },
  cushing: { lat: 35.98, lng: -96.77 },
  corpusChristi: { lat: 27.8, lng: -97.4 },
  santos: { lat: -23.96, lng: -46.33 },
  bonny: { lat: 4.43, lng: 7.15 },
  ningbo: { lat: 29.87, lng: 121.55 },
  qingdao: { lat: 36.07, lng: 120.38 },
  jamnagar: { lat: 22.47, lng: 70.06 },
  chiba: { lat: 35.6, lng: 140.1 },
  rotterdam: { lat: 51.95, lng: 4.14 },
  ulsan: { lat: 35.5, lng: 129.38 },
} satisfies Record<string, Pt>;

/** Major seaborne / pipeline crude routes (illustrative). */
export const TRADE_ROUTES: { from: Pt; to: Pt; label: string }[] = [
  { from: P.rasTanura, to: P.ningbo, label: 'Saudi Arabia → China' },
  { from: P.rasTanura, to: P.jamnagar, label: 'Saudi Arabia → India' },
  { from: P.basra, to: P.jamnagar, label: 'Iraq → India' },
  { from: P.fujairah, to: P.chiba, label: 'UAE → Japan' },
  { from: P.rasTanura, to: P.ulsan, label: 'Saudi Arabia → South Korea' },
  { from: P.kozmino, to: P.qingdao, label: 'Russia → China' },
  { from: P.primorsk, to: P.jamnagar, label: 'Russia → India' },
  { from: P.hardisty, to: P.cushing, label: 'Canada → United States' },
  { from: P.corpusChristi, to: P.rotterdam, label: 'United States → Europe' },
  { from: P.santos, to: P.qingdao, label: 'Brazil → China' },
  { from: P.bonny, to: P.rotterdam, label: 'Nigeria → Europe' },
];
