import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import app from './app';
import type { Server } from 'http';

const MILES_PER_DEGREE_LAT = 69.0;
const boundsFromCenter = (lat: number, lng: number, radiusMiles: number) => {
  const dLat = radiusMiles / MILES_PER_DEGREE_LAT;
  const dLng = radiusMiles / (MILES_PER_DEGREE_LAT * Math.cos(lat * Math.PI / 180));
  return {
    sw: { latitude: lat - dLat, longitude: lng - dLng },
    ne: { latitude: lat + dLat, longitude: lng + dLng },
  };
};

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as { port: number };
      baseUrl = `http://localhost:${addr.port}`;
      resolve();
    });
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

const post = async (path: string, body: unknown) => {
  const res = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: (await res.json()) as any };
};

describe('API E2E Tests', () => {
  test('POST /objects returns valid GeoJSON', async () => {
    const center = { latitude: 39.14, longitude: -84.51 };
    const res = await post('/objects', {
      bounds: boundsFromCenter(center.latitude, center.longitude, 10),
      center,
    });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('FeatureCollection');
    expect(res.body.features.length).toBeGreaterThan(0);

    for (const feature of res.body.features) {
      expect(feature.geometry.type).toBe('Point');
      expect(feature.geometry.coordinates).toHaveLength(2);
      expect(feature.properties).toHaveProperty('OASNumber');
      expect(feature.properties).toHaveProperty('City');
      expect(feature.properties).toHaveProperty('State');
      expect(feature.properties).toHaveProperty('AGL');
      expect(feature.properties).toHaveProperty('AMSL');
      expect(feature.properties).toHaveProperty('ObjectType');
      expect(feature.properties).toHaveProperty('distanceFromLocation');
    }
  }, 30000);

  test('Bounds size and height filters constrain results', async () => {
    const center = { latitude: 39.14, longitude: -84.51 };
    const [small, large, tall] = await Promise.all([
      post('/objects', { bounds: boundsFromCenter(center.latitude, center.longitude, 1), center, minHeight: 100 }),
      post('/objects', { bounds: boundsFromCenter(center.latitude, center.longitude, 10), center, minHeight: 100 }),
      post('/objects', { bounds: boundsFromCenter(center.latitude, center.longitude, 10), center, minHeight: 500 }),
    ]);
    expect(small.body.features.length).toBeGreaterThan(0);
    expect(large.body.features.length).toBeGreaterThan(0);
    expect(large.body.features.length).toBeGreaterThanOrEqual(tall.body.features.length);
    for (const feature of tall.body.features) {
      expect(feature.properties.AGL).toBeGreaterThanOrEqual(500);
    }
  }, 30000);

  test('Input validation rejects bad requests', async () => {
    const cases = [
      { body: {} },
      { body: { bounds: { sw: { latitude: 'abc', longitude: -84.51 }, ne: { latitude: 39.3, longitude: -84.4 } } } },
      { body: { bounds: { sw: { latitude: 39.0, longitude: -84.6 }, ne: { latitude: 39.3, longitude: -84.4 } }, limit: 0 } },
      { body: { bounds: { sw: { latitude: 39.0, longitude: -84.6 }, ne: { latitude: 39.3, longitude: -84.4 } }, limit: 3000 } },
    ];
    const results = await Promise.all(cases.map(({ body: reqBody }) => post('/objects', reqBody)));
    for (const res of results) {
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
    }
  }, 30000);

  test('DAT file parse round-trip: known BURLINGTON OH record', async () => {
    const center = { latitude: 38.408, longitude: -82.561 };
    const res = await post('/objects', {
      bounds: boundsFromCenter(center.latitude, center.longitude, 2),
      center,
    });
    const match = res.body.features.find((f: any) => f.properties.OASNumber === 39021000);
    expect(match).toBeDefined();
    expect(match.properties.City).toBe('BURLINGTON');
    expect(match.properties.State).toBe('OH');
    expect(match.properties.AGL).toBe(199);
    expect(match.properties.ObjectType).toBe('TOWER');
    expect(match.geometry.coordinates[0]).toBeCloseTo(-82.561, 0);
    expect(match.geometry.coordinates[1]).toBeCloseTo(38.408, 0);
  }, 30000);
});
