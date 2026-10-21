import prisma from '../src/prisma';

try {
  const [identity, rows] = await Promise.all([
    prisma.$queryRaw`SELECT current_database() AS database, version() AS version`,
    prisma.fAAObject.count(),
  ]);
  process.stdout.write(`${JSON.stringify({ identity, faaObjects: rows })}\n`);
} finally {
  await prisma.$disconnect();
}
