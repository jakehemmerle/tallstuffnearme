import { PrismaClient, Prisma } from '@prisma/client'
import { insertDatFileIntoDB } from '../src/data';

const prisma = new PrismaClient()

// A `main` function so that you can use async/await
async function populateDB() {
  await insertDatFileIntoDB("./faa-data/39-OH.Dat");
  console.log("complete oh!");
  await insertDatFileIntoDB("./faa-data/21-KY.Dat");
  console.log("complete ky!");
  await insertDatFileIntoDB("./faa-data/18-IN.Dat");
  console.log("complete in!");
}

populateDB()
  .catch((e) => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })