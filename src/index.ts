import { PrismaClient, Prisma } from '@prisma/client'
import { insertDatFileIntoDB } from './parseDAT';

const prisma = new PrismaClient()

// A `main` function so that you can use async/await
async function main() {
  const objects = await insertDatFileIntoDB("./faa-data/39-OH.Dat");
  console.log("complete ohio!");

}

main()
  .catch((e) => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })