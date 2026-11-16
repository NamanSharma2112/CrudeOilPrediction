// ----------------------------------------------------------------------
// Major seaborne crude oil routes, as [lng, lat] waypoints that follow
// real shipping lanes (straits, canals, capes) so tankers stay at sea.
// Laden direction: exporter → importer. Illustrative, not live data.
// ----------------------------------------------------------------------

export type LngLat = [number, number];

export interface SeaRoute {
  id: string;
  from: string;
  to: string;
  /** Typical cargo and vessel class, shown in the tooltip. */
  vessel: string;
  /** Approximate flow, million barrels/day (rounded). */
  mbd: number;
  points: LngLat[];
}

// Shared lane segments ----------------------------------------------------

/** Persian Gulf terminals → Strait of Hormuz → Gulf of Oman. */
const GULF_EXIT: LngLat[] = [
  [52.6, 26.4], [54.0, 26.15], [55.3, 26.1], [56.1, 26.45], [56.6, 26.35], [57.0, 25.5], [58.6, 24.4], [60.5, 23.4],
];
/** Arabian Sea → south of Sri Lanka → Strait of Malacca → Singapore. */
const TO_MALACCA: LngLat[] = [
  [64.0, 19.0], [70.0, 12.0], [76.0, 6.8], [80.6, 5.3], [86.0, 5.6], [92.0, 6.0],
  [95.6, 6.2], [97.8, 5.2], [99.6, 3.6], [101.3, 2.4], [102.8, 1.4], [103.9, 1.15],
];
/** Singapore → South China Sea → Luzon Strait. */
const SCS_TO_LUZON: LngLat[] = [
  [104.6, 1.6], [105.8, 3.5], [108.5, 7.0], [111.5, 11.0], [114.5, 15.5], [118.0, 19.5], [120.9, 20.6],
];
/** Singapore → South China Sea → Taiwan Strait → East China Sea. */
const SCS_TO_TAIWAN: LngLat[] = [
  [104.6, 1.6], [105.8, 3.5], [108.5, 7.0], [111.5, 11.0], [114.5, 16.0], [117.0, 21.0],
  [118.8, 23.3], [120.0, 24.7], [121.2, 26.5], [122.6, 28.6],
];
/** Gulf of Aden → Bab el-Mandeb → Red Sea → Suez Canal → Port Said (northbound). */
const RED_SEA_NORTH: LngLat[] = [
  [51.0, 12.6], [47.0, 12.3], [44.6, 12.4], [43.45, 12.6], [42.6, 13.7], [41.0, 15.6],
  [38.6, 19.6], [36.3, 23.6], [34.6, 26.8], [33.9, 27.5], [33.5, 28.0], [33.1, 28.6], [32.75, 29.2], [32.56, 29.92],
  [32.34, 30.6], [32.33, 31.25], [32.4, 31.6],
];
/** English Channel → Dover Strait → Rotterdam (eastbound). */
const CHANNEL_TO_ROTTERDAM: LngLat[] = [
  [-5.6, 49.2], [-2.0, 50.0], [0.5, 50.5], [1.6, 51.05], [2.6, 51.6], [3.6, 51.95], [4.05, 51.98],
];

const reverse = (pts: LngLat[]) => [...pts].reverse();

// Routes ------------------------------------------------------------------

export const SEA_ROUTES: SeaRoute[] = [
  {
    id: "sa-cn",
    from: "Ras Tanura, Saudi Arabia",
    to: "Ningbo, China",
    vessel: "VLCC · ~2 million bbl",
    mbd: 1.6,
    points: [[50.3, 26.7], ...GULF_EXIT, ...TO_MALACCA, ...SCS_TO_TAIWAN, [122.2, 29.9]],
  },
  {
    id: "sa-in",
    from: "Ras Tanura, Saudi Arabia",
    to: "Jamnagar, India",
    vessel: "VLCC · ~2 million bbl",
    mbd: 0.7,
    points: [[50.3, 26.7], ...GULF_EXIT, [63.0, 22.6], [66.5, 22.2], [68.7, 22.65], [69.75, 22.55]],
  },
  {
    id: "iq-in",
    from: "Basra, Iraq",
    to: "Sikka, India",
    vessel: "VLCC · ~2 million bbl",
    mbd: 0.9,
    points: [[48.8, 29.65], [49.6, 29.0], [50.6, 27.8], [51.6, 27.0], ...GULF_EXIT, [63.0, 22.6], [66.5, 22.2], [68.7, 22.65], [69.75, 22.55]],
  },
  {
    id: "ae-jp",
    from: "Fujairah, UAE",
    to: "Chiba, Japan",
    vessel: "VLCC · ~2 million bbl",
    mbd: 0.6,
    points: [
      [56.45, 25.15], [58.6, 24.4], [60.5, 23.4], ...TO_MALACCA, ...SCS_TO_LUZON,
      [123.5, 22.5], [127.5, 26.5], [132.0, 30.0], [136.5, 32.8], [139.5, 34.6], [139.75, 35.15], [140.05, 35.5],
    ],
  },
  {
    id: "sa-kr",
    from: "Ras Tanura, Saudi Arabia",
    to: "Ulsan, South Korea",
    vessel: "VLCC · ~2 million bbl",
    mbd: 0.9,
    points: [
      [50.3, 26.7], ...GULF_EXIT, ...TO_MALACCA, ...SCS_TO_LUZON,
      [122.8, 22.6], [124.7, 24.6], [126.0, 28.0], [127.5, 32.0], [129.0, 34.3], [129.45, 35.35],
    ],
  },
  {
    id: "ru-in",
    from: "Primorsk, Russia",
    to: "Sikka, India",
    vessel: "Aframax · ~0.7 million bbl",
    mbd: 0.5,
    points: [
      [28.6, 60.3], [26.0, 59.85], [23.0, 59.6], [20.5, 58.6], [19.0, 57.0], [16.0, 55.3], [14.6, 54.85], [13.0, 54.65],
      [11.25, 54.52], [11.0, 54.75], [11.05, 55.0], [10.95, 55.3], [11.0, 56.2], [11.4, 57.2], [10.9, 57.9], [9.0, 57.75], [6.0, 57.0],
      [3.5, 54.5], [2.4, 52.0], [1.55, 51.0], [-0.5, 50.35], [-3.5, 49.9], [-5.8, 48.9], [-9.0, 46.0],
      [-9.8, 43.5], [-10.0, 39.0], [-8.8, 36.5], [-6.0, 35.95], [-5.2, 35.95], [-2.0, 36.3], [3.0, 37.6],
      [10.5, 37.7], [14.0, 35.6], [22.0, 34.2], [28.0, 32.4],
      ...reverse(RED_SEA_NORTH),
      [56.0, 15.0], [62.0, 19.0], [66.5, 21.6], [68.7, 22.65], [69.75, 22.55],
    ],
  },
  {
    id: "ru-cn",
    from: "Kozmino, Russia",
    to: "Qingdao, China",
    vessel: "Aframax · ~0.7 million bbl",
    mbd: 0.6,
    points: [
      [133.0, 42.7], [132.5, 41.0], [131.0, 38.5], [130.2, 36.0], [129.3, 34.6], [128.0, 33.8],
      [126.5, 32.8], [125.0, 33.6], [123.6, 35.2], [121.8, 35.8], [120.45, 35.95],
    ],
  },
  {
    id: "us-eu",
    from: "Corpus Christi, USA",
    to: "Rotterdam, Netherlands",
    vessel: "Aframax · ~0.7 million bbl",
    mbd: 0.6,
    points: [
      [-97.0, 27.75], [-95.0, 26.5], [-90.0, 25.4], [-85.5, 24.6], [-82.5, 24.15], [-80.4, 24.6],
      [-79.7, 25.9], [-79.6, 27.5], [-77.0, 31.0], [-70.0, 36.5], [-55.0, 41.5], [-35.0, 45.5],
      [-18.0, 48.0], [-9.0, 48.8], ...CHANNEL_TO_ROTTERDAM,
    ],
  },
  {
    id: "br-cn",
    from: "Santos Basin, Brazil",
    to: "Qingdao, China",
    vessel: "VLCC · ~2 million bbl",
    mbd: 0.8,
    points: [
      [-44.5, -24.8], [-38.0, -28.0], [-25.0, -32.0], [-5.0, -35.5], [10.0, -36.5], [18.5, -36.3],
      [25.0, -35.8], [33.0, -33.5], [45.0, -28.0], [62.0, -18.0], [80.0, -10.0], [95.0, -7.5],
      [103.0, -7.0], [105.4, -6.35], [105.9, -5.85], [106.4, -5.3], [106.9, -4.2], [107.1, -2.8], [107.3, -1.8], [108.0, -0.5],
      [108.6, 1.5], [110.0, 7.0], [113.0, 13.0], [116.0, 18.5], [118.8, 23.3], [120.0, 24.7],
      [121.2, 26.5], [123.0, 31.0], [122.8, 34.0], [121.4, 35.6], [120.45, 35.95],
    ],
  },
  {
    id: "ng-eu",
    from: "Bonny, Nigeria",
    to: "Rotterdam, Netherlands",
    vessel: "Suezmax · ~1 million bbl",
    mbd: 0.4,
    points: [
      [7.05, 4.2], [5.0, 3.3], [1.0, 2.8], [-8.0, 3.2], [-13.0, 5.5], [-17.5, 10.0], [-19.0, 20.0],
      [-19.5, 26.0], [-19.5, 30.0], [-18.5, 34.0], [-14.0, 37.5], [-10.5, 40.0], [-9.8, 44.0], ...CHANNEL_TO_ROTTERDAM,
    ],
  },
];

/** Named map regions for the detail views: [west, south, east, north]. */
export const MAP_VIEWS: { id: string; label: string; bounds: [number, number, number, number] }[] = [
  { id: "world", label: "World", bounds: [-130, -48, 155, 68] },
  { id: "gulf", label: "Persian Gulf & Hormuz", bounds: [46, 21.5, 62.5, 31] },
  { id: "red-sea", label: "Red Sea & Suez", bounds: [30, 10.5, 52, 32.5] },
  { id: "malacca", label: "Malacca & Singapore", bounds: [93, -3, 108, 9] },
  { id: "east-asia", label: "East Asia", bounds: [104, 0, 145, 44] },
  { id: "north-sea", label: "North Sea & Channel", bounds: [-11, 47, 15, 61] },
  { id: "us-gulf", label: "US Gulf & Florida", bounds: [-99, 18, -74, 32] },
];
