import { PrismaClient } from './generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const url = process.env.DATABASE_URL!;
const adapter = url.includes('neon.tech')
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg(new pg.Pool({ connectionString: url }));

const prisma = new PrismaClient({ adapter });
export default prisma;
