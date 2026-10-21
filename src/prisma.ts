import { PrismaClient } from './generated/prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaPg } from '@prisma/adapter-pg';

const url = process.env.DATABASE_URL!;
const adapter = url.includes('neon.tech')
  ? new PrismaNeon({ connectionString: url })
  : new PrismaPg({ connectionString: url });

const prisma = new PrismaClient({ adapter });
export default prisma;
