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
