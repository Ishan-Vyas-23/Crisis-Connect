require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../generated/prisma/client');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is missing.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const skills = [
  'FIRST_AID',
  'SWIMMING',
  'DRIVING',
  'SEARCH_AND_RESCUE',
  'MEDICAL_ASSISTANCE',
  'FIRE_SAFETY',
  'CROWD_MANAGEMENT'
];

async function main() {
  console.log("Seeding initial skills...");
  for (const skillName of skills) {
    const skill = await prisma.skill.upsert({
      where: { name: skillName },
      update: {},
      create: { name: skillName }
    });
    console.log(`Skill verified/seeded: ${skill.name} (${skill.id})`);
  }
  console.log("Seeding completed successfully.");
}

main()
  .catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
