import { performance } from 'perf_hooks';
import request from 'supertest';
import app from './app';
import prisma from './prisma';

// --- CLI args ---
const iterationsArg = process.argv.find(a => a.startsWith('--iterations='));
const ITERATIONS = iterationsArg ? parseInt(iterationsArg.split('=')[1], 10) : 20;
const WARMUP = 3;

// --- Bounds helper (same as e2e tests) ---
const MILES_PER_DEGREE_LAT = 69.0;
const boundsFromCenter = (lat: number, lng: number, radiusMiles: number) => {
  const dLat = radiusMiles / MILES_PER_DEGREE_LAT;
  const dLng = radiusMiles / (MILES_PER_DEGREE_LAT * Math.cos(lat * Math.PI / 180));
  return {
    sw: { latitude: lat - dLat, longitude: lng - dLng },
    ne: { latitude: lat + dLat, longitude: lng + dLng },
  };
};

// --- Scenario definitions ---
interface Scenario {
  name: string;
  lat: number;
  lng: number;
  radiusMiles: number;
  limit: number;
  includeCenter: boolean;
  excludeTypes?: string[];
}

const scenarios: Scenario[] = [
  { name: 'cincinnati-1mi',            lat: 39.14,  lng: -84.51,   radiusMiles: 1,    limit: 500,  includeCenter: true },
  { name: 'cincinnati-10mi',           lat: 39.14,  lng: -84.51,   radiusMiles: 10,   limit: 500,  includeCenter: true },
  { name: 'cincinnati-50mi',           lat: 39.14,  lng: -84.51,   radiusMiles: 50,   limit: 2000, includeCenter: true },
  { name: 'cincinnati-10mi-no-center', lat: 39.14,  lng: -84.51,   radiusMiles: 10,   limit: 500,  includeCenter: false },
  { name: 'cincinnati-10mi-filtered',  lat: 39.14,  lng: -84.51,   radiusMiles: 10,   limit: 500,  includeCenter: true, excludeTypes: ['POLE', 'TOWER', 'ANTENNA'] },
  { name: 'huntington-1mi',            lat: 38.408, lng: -82.561,  radiusMiles: 1,    limit: 500,  includeCenter: true },
  { name: 'huntington-10mi',           lat: 38.408, lng: -82.561,  radiusMiles: 10,   limit: 500,  includeCenter: true },
  { name: 'las-vegas-default',         lat: 36.147, lng: -115.157, radiusMiles: 0.7,  limit: 500,  includeCenter: true },
];

// --- DB timing via monkey-patch ---
let dbTimeAccumulator = 0;
const originalFindMany = prisma.fAAObject.findMany.bind(prisma.fAAObject);
(prisma.fAAObject as any).findMany = async (...args: any[]) => {
  const start = performance.now();
  const result = await originalFindMany(...args);
  dbTimeAccumulator += performance.now() - start;
  return result;
};

// --- Stats helpers ---
function percentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function computeStats(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((s, v) => s + v, 0);
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: sum / sorted.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
  };
}

function fmt(ms: number): string {
  return ms.toFixed(1).padStart(8);
}

// --- Build request body ---
function buildBody(s: Scenario) {
  const body: any = {
    bounds: boundsFromCenter(s.lat, s.lng, s.radiusMiles),
    limit: s.limit,
  };
  if (s.includeCenter) body.center = { latitude: s.lat, longitude: s.lng };
  if (s.excludeTypes) body.excludeObjectTypes = s.excludeTypes;
  return body;
}

// --- Run one iteration ---
async function runOnce(s: Scenario): Promise<{ totalMs: number; dbMs: number; features: number }> {
  dbTimeAccumulator = 0;
  const start = performance.now();
  const res = await request(app).post('/objects').send(buildBody(s));
  const totalMs = performance.now() - start;
  if (res.status !== 200) throw new Error(`${s.name}: HTTP ${res.status}`);
  return { totalMs, dbMs: dbTimeAccumulator, features: res.body.features?.length ?? 0 };
}

// --- Main ---
async function main() {
  console.log(`Benchmark: ${WARMUP} warmup + ${ITERATIONS} timed iterations per scenario\n`);

  // Table header
  const header = [
    'Scenario'.padEnd(30),
    'Features'.padStart(8),
    '  Total(ms)'.padEnd(45).slice(0, 45),
    '  DB(ms)'.padEnd(45).slice(0, 45),
    '  App(ms)'.padEnd(45).slice(0, 45),
  ];

  const subHeader = [
    ''.padEnd(30),
    ''.padStart(8),
    ...[' Total', ' DB', ' App'].map(() =>
      `${' p50'.padStart(8)} ${' p95'.padStart(8)} ${'mean'.padStart(8)} ${' min'.padStart(8)} ${' max'.padStart(8)}`
    ),
  ];

  const sep = '-'.repeat(30 + 8 + 3 * (8 * 5 + 4) + 6);
  console.log(sep);
  console.log(
    'Scenario'.padEnd(30) +
    'Feat'.padStart(6) +
    '  |' +
    '  p50'.padStart(8) + '  p95'.padStart(8) + ' mean'.padStart(8) + '  min'.padStart(8) + '  max'.padStart(8) +
    '  |' +
    '  p50'.padStart(8) + '  p95'.padStart(8) + ' mean'.padStart(8) + '  min'.padStart(8) + '  max'.padStart(8) +
    '  |' +
    '  p50'.padStart(8) + '  p95'.padStart(8) + ' mean'.padStart(8) + '  min'.padStart(8) + '  max'.padStart(8)
  );
  console.log(
    ''.padEnd(30) +
    ''.padStart(6) +
    '  |' + '          Total (ms)'.padEnd(40).slice(0, 40) +
    '  |' + '           DB (ms)'.padEnd(40).slice(0, 40) +
    '  |' + '          App (ms)'.padEnd(40).slice(0, 40)
  );
  console.log(sep);

  for (const scenario of scenarios) {
    // Warmup
    for (let i = 0; i < WARMUP; i++) await runOnce(scenario);

    // Timed runs
    const totals: number[] = [];
    const dbs: number[] = [];
    const apps: number[] = [];
    let featureCount = 0;

    for (let i = 0; i < ITERATIONS; i++) {
      const result = await runOnce(scenario);
      totals.push(result.totalMs);
      dbs.push(result.dbMs);
      apps.push(result.totalMs - result.dbMs);
      featureCount = result.features;
    }

    const totalStats = computeStats(totals);
    const dbStats = computeStats(dbs);
    const appStats = computeStats(apps);

    const warn = featureCount === 0 ? ' ⚠ 0 features' : '';

    console.log(
      scenario.name.padEnd(30) +
      String(featureCount).padStart(6) +
      '  |' +
      fmt(totalStats.p50) + fmt(totalStats.p95) + fmt(totalStats.mean) + fmt(totalStats.min) + fmt(totalStats.max) +
      '  |' +
      fmt(dbStats.p50) + fmt(dbStats.p95) + fmt(dbStats.mean) + fmt(dbStats.min) + fmt(dbStats.max) +
      '  |' +
      fmt(appStats.p50) + fmt(appStats.p95) + fmt(appStats.mean) + fmt(appStats.min) + fmt(appStats.max) +
      warn
    );
  }

  console.log(sep);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
