import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create 3 mock users for demo
  const adminUser = await prisma.user.upsert({
    where: { phone: '9876543210' },
    update: { email: 'admin@buildwise.com', password: 'password123' },
    create: {
      phone: '9876543210',
      email: 'admin@buildwise.com',
      password: 'password123',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const pmUser = await prisma.user.upsert({
    where: { phone: '9876543211' },
    update: { email: 'pm@buildwise.com', password: 'password123' },
    create: {
      phone: '9876543211',
      email: 'pm@buildwise.com',
      password: 'password123',
      name: 'Project Manager',
      role: 'PROJECT_MANAGER',
    },
  });

  const engineerUser = await prisma.user.upsert({
    where: { phone: '9876543212' },
    update: { email: 'engineer@buildwise.com', password: 'password123' },
    create: {
      phone: '9876543212',
      email: 'engineer@buildwise.com',
      password: 'password123',
      name: 'Site Engineer',
      role: 'SITE_ENGINEER',
    },
  });

  // 2. Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Project Alpha',
      location: 'Mumbai, MH',
      type: 'Residential',
      budget: 15000000,
      spent: 4500000,
      startDate: new Date(),
      status: 'Active',
      members: {
        create: {
          userId: adminUser.id,
          role: 'ADMIN',
        }
      }
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Horizon Towers',
      location: 'Pune, MH',
      type: 'Commercial',
      budget: 85000000,
      spent: 82000000,
      startDate: new Date(),
      status: 'At Risk',
      members: {
        create: {
          userId: adminUser.id,
          role: 'ADMIN',
        }
      }
    }
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Sector 5 Clinic',
      location: 'Bangalore, KA',
      type: 'Infrastructure',
      budget: 12000000,
      spent: 1200000,
      startDate: new Date(),
      status: 'Active',
    }
  });

  // 3. Create Materials for Project 1
  await prisma.material.createMany({
    data: [
      {
        projectId: project1.id,
        name: 'Cement (50kg)',
        unit: 'bags',
        currentStock: 450,
        minThreshold: 500,
        burnRate7Day: 110,
        ratePerUnit: 420,
      },
      {
        projectId: project1.id,
        name: 'Steel 12mm',
        unit: 'tons',
        currentStock: 5.2,
        minThreshold: 1.0,
        burnRate7Day: 0.8,
        ratePerUnit: 65000,
      },
      {
        projectId: project1.id,
        name: 'River Sand',
        unit: 'cft',
        currentStock: 400,
        minThreshold: 500,
        burnRate7Day: 200,
        ratePerUnit: 70,
      }
    ]
  });

  // Add an audit
  const audit = await prisma.materialAudit.create({
    data: {
      projectId: project1.id,
      engineerId: adminUser.id,
      activity: 'Slab Pour',
      weather: 'Clear',
      overallRisk: 'Healthy',
    }
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
