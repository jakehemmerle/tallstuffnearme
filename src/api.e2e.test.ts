import request from 'supertest';
import app from './app';

jest.setTimeout(30000);

// Helper: compute SW/NE bounds from a center point and radius in miles
const MILES_PER_DEGREE_LAT = 69.0;
const boundsFromCenter = (lat: number, lng: number, radiusMiles: number) => {
  const dLat = radiusMiles / MILES_PER_DEGREE_LAT;
  const dLng = radiusMiles / (MILES_PER_DEGREE_LAT * Math.cos(lat * Math.PI / 180));
  return {
    sw: { latitude: lat - dLat, longitude: lng - dLng },
    ne: { latitude: lat + dLat, longitude: lng + dLng },
  };
};

describe('API E2E Tests', () => {
  test('POST /objects returns valid GeoJSON', async () => {
    const center = { latitude: 39.14, longitude: -84.51 };
    const res = await request(app)
      .post('/objects')
      .send({
        bounds: boundsFromCenter(center.latitude, center.longitude, 10),
        center,
      });

    console.log('Status:', res.status);
    console.log('Feature count:', res.body.features?.length);
    if (res.body.features?.length > 0) {
      console.log('First feature properties:', JSON.stringify(res.body.features[0].properties, null, 2));
    }

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
  });

  test('Bounds size and height filters constrain results', async () => {
    const center = { latitude: 39.14, longitude: -84.51 };

    const [small, large, tall] = await Promise.all([
      request(app).post('/objects').send({
        bounds: boundsFromCenter(center.latitude, center.longitude, 1),
        center,
        minHeight: 100,
      }),
      request(app).post('/objects').send({
        bounds: boundsFromCenter(center.latitude, center.longitude, 10),
        center,
        minHeight: 100,
      }),
      request(app).post('/objects').send({
        bounds: boundsFromCenter(center.latitude, center.longitude, 10),
        center,
        minHeight: 500,
      }),
    ]);

    console.log('tight bounds, minH=100 count:', small.body.features.length);
    console.log('wide bounds, minH=100 count:', large.body.features.length);
    console.log('wide bounds, minH=500 count:', tall.body.features.length);

    expect(small.body.features.length).toBeGreaterThan(0);
    expect(large.body.features.length).toBeGreaterThan(0);
    expect(large.body.features.length).toBeGreaterThanOrEqual(tall.body.features.length);

    for (const feature of tall.body.features) {
      expect(feature.properties.AGL).toBeGreaterThanOrEqual(500);
    }
  });

  test('Input validation rejects bad requests', async () => {
    const cases = [
      { body: {}, label: 'missing bounds' },
      { body: { bounds: { sw: { latitude: 'abc', longitude: -84.51 }, ne: { latitude: 39.3, longitude: -84.4 } } }, label: 'non-numeric lat' },
      { body: { bounds: { sw: { latitude: 39.0, longitude: -84.6 }, ne: { latitude: 39.3, longitude: -84.4 } }, limit: 0 }, label: 'limit=0' },
      { body: { bounds: { sw: { latitude: 39.0, longitude: -84.6 }, ne: { latitude: 39.3, longitude: -84.4 } }, limit: 3000 }, label: 'limit=3000' },
    ];

    const results = await Promise.all(
      cases.map(async ({ body: reqBody, label }) => {
        const res = await request(app).post('/objects').send(reqBody);
        console.log(`${label}: status=${res.status}, body=${JSON.stringify(res.body)}`);
        return res;
      })
    );

    for (const res of results) {
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
    }
  });

  test('DAT file parse round-trip: known HUNTINGTON OH record', async () => {
    const center = { latitude: 38.408, longitude: -82.561 };
    const res = await request(app)
      .post('/objects')
      .send({
        bounds: boundsFromCenter(center.latitude, center.longitude, 2),
        center,
      });

    console.log('All OASNumbers:', res.body.features.map((f: any) => f.properties.OASNumber));

    const match = res.body.features.find(
      (f: any) => f.properties.OASNumber === 39021000
    );
    console.log('Matching feature:', JSON.stringify(match, null, 2));

    expect(match).toBeDefined();
    expect(match.properties.City).toBe('HUNTINGTON');
    expect(match.properties.State).toBe('OH');
    expect(match.properties.AGL).toBe(184);
    expect(match.properties.ObjectType).toBe('TOWER');
    expect(match.geometry.coordinates[0]).toBeCloseTo(-82.561, 0);
    expect(match.geometry.coordinates[1]).toBeCloseTo(38.408, 0);
  });
});
