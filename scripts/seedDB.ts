import { PrismaClient } from '@prisma/client'
import { _insertDatFileIntoDB } from '../src/data';
import { readdirSync } from 'fs';

const prisma = new PrismaClient()

// populates full DB; fails at 
async function populateDB() {
  // Only include US states. Non-state files include objects that don't have a OASNumber, which is the primary key for the DB
  let fileNames: string[] = await readdirSync("./faa-data", "utf-8").filter((fileName) => fileName.includes("-"));

  console.log('To be added to DB:');
  console.log(fileNames);

  for (let fileName of fileNames) {
    const fullName = `./faa-data/${fileName}`
    console.log(`adding ${fullName}`)
    await _insertDatFileIntoDB(fullName);
  }
}

populateDB()
  .catch((e) => {
    throw e
  })
  .finally(async () => {
    await prisma.$disconnect()
  })