import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding MaterialRates...');

  const masterRates = [
    { city: 'Hyderabad', material: 'cement', ratePerUnit: 380, unit: 'bag' },
    { city: 'Hyderabad', material: 'steel', ratePerUnit: 58, unit: 'kg' },
    { city: 'Hyderabad', material: 'sand', ratePerUnit: 45, unit: 'cft' },
    { city: 'Hyderabad', material: 'aggregate', ratePerUnit: 38, unit: 'cft' },

    { city: 'Mumbai', material: 'cement', ratePerUnit: 410, unit: 'bag' },
    { city: 'Mumbai', material: 'steel', ratePerUnit: 60, unit: 'kg' },
    { city: 'Mumbai', material: 'sand', ratePerUnit: 55, unit: 'cft' },
    { city: 'Mumbai', material: 'aggregate', ratePerUnit: 42, unit: 'cft' },

    { city: 'Pune', material: 'cement', ratePerUnit: 400, unit: 'bag' },
    { city: 'Pune', material: 'steel', ratePerUnit: 59, unit: 'kg' },
    { city: 'Pune', material: 'sand', ratePerUnit: 50, unit: 'cft' },
    { city: 'Pune', material: 'aggregate', ratePerUnit: 40, unit: 'cft' },

    { city: 'Bangalore', material: 'cement', ratePerUnit: 420, unit: 'bag' },
    { city: 'Bangalore', material: 'steel', ratePerUnit: 62, unit: 'kg' },
    { city: 'Bangalore', material: 'sand', ratePerUnit: 58, unit: 'cft' },
    { city: 'Bangalore', material: 'aggregate', ratePerUnit: 45, unit: 'cft' },

    { city: 'Chennai', material: 'cement', ratePerUnit: 390, unit: 'bag' },
    { city: 'Chennai', material: 'steel', ratePerUnit: 57, unit: 'kg' },
    { city: 'Chennai', material: 'sand', ratePerUnit: 48, unit: 'cft' },
    { city: 'Chennai', material: 'aggregate', ratePerUnit: 41, unit: 'cft' },

    { city: 'Delhi', material: 'cement', ratePerUnit: 375, unit: 'bag' },
    { city: 'Delhi', material: 'steel', ratePerUnit: 56, unit: 'kg' },
    { city: 'Delhi', material: 'sand', ratePerUnit: 40, unit: 'cft' },
    { city: 'Delhi', material: 'aggregate', ratePerUnit: 36, unit: 'cft' },
  ];

  for (const rate of masterRates) {
    // We group by city in MaterialRate table (schema: city @unique, cement, steel, sand, aggregate)
    // Wait, the schema for MaterialRate is:
    // id, city @unique, cement Float, steel Float, sand Float, aggregate Float, updatedAt
    // We shouldn't use an array of objects per material, we should just upsert by city!
  }
}

async function runSeeder() {
  const citiesData = [
    { city: 'Hyderabad', cement: 380, steel: 58, sand: 45, aggregate: 38 },
    { city: 'Mumbai', cement: 410, steel: 60, sand: 55, aggregate: 42 },
    { city: 'Pune', cement: 400, steel: 59, sand: 50, aggregate: 40 },
    { city: 'Bangalore', cement: 420, steel: 62, sand: 58, aggregate: 45 },
    { city: 'Chennai', cement: 390, steel: 57, sand: 48, aggregate: 41 },
    { city: 'Delhi', cement: 375, steel: 56, sand: 40, aggregate: 36 }
  ];

  console.log('Seeding MaterialRates...');

  for (const data of citiesData) {
    await prisma.materialRate.upsert({
      where: { city: data.city },
      update: {
        cement: data.cement,
        steel: data.steel,
        sand: data.sand,
        aggregate: data.aggregate
      },
      create: data
    });
  }

  console.log('Seeding complete.');
}

runSeeder()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
