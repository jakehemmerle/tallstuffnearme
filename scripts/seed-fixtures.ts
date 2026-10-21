import { requireDevelopmentDatabase } from './development-database';

requireDevelopmentDatabase(true);
const { default: prisma } = await import('../src/prisma');

const common = {
  Verified: 'V', Country: 'US', ObjectType: 'TOWER', AMSL: 900,
  LT: 'R', H: '1', AccV: '1', MarInd: 'N', FAAStudyNumber: '', Action: '', JDate: '2026001',
} as const;
const fixtures = [
  { ...common, OASNumber: 39021000, City: 'BURLINGTON', State: 'OH', Latitude: 38.408, Longitude: -82.561, AGL: 199 },
  { ...common, OASNumber: 99000001, City: 'CINCINNATI', State: 'OH', Latitude: 39.14, Longitude: -84.51, AGL: 600 },
  { ...common, OASNumber: 99000002, City: 'CINCINNATI', State: 'OH', Latitude: 39.145, Longitude: -84.515, AGL: 150 },
  { ...common, OASNumber: 99000003, City: 'LAS VEGAS', State: 'NV', Latitude: 36.147, Longitude: -115.157, AGL: 400 },
];

try {
  for (const record of fixtures) {
    await prisma.fAAObject.upsert({ where: { OASNumber: record.OASNumber }, create: record, update: record });
  }
  process.stdout.write(`Seeded ${fixtures.length} test records.\n`);
} finally {
  await prisma.$disconnect();
}
