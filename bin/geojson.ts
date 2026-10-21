import { writeFile } from 'node:fs/promises';
import { defaultQuery } from '../src/controller';
import prisma from '../src/prisma';

const output = process.argv[2] ?? 'geojson.json';
try {
  await writeFile(output, JSON.stringify(await defaultQuery()) + '\n');
  process.stdout.write(`Created ${output}\n`);
} finally {
  await prisma.$disconnect();
}
