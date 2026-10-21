import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { requireDevelopmentDatabase } from './development-database';

requireDevelopmentDatabase();
const { default: prisma } = await import('../src/prisma');
const { _insertDatFileIntoDB } = await import('../src/data');
const directory = path.resolve(process.argv[2] ?? 'faa-data');

try {
  const files = (await readdir(directory)).filter((name) => name.includes('-') && /\.dat$/i.test(name)).sort();
  if (files.length === 0) throw new Error('No state DAT files found in the supplied directory.');
  for (const file of files) await _insertDatFileIntoDB(path.join(directory, file));
} finally {
  await prisma.$disconnect();
}
