import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllData() {
  console.log('Wiping all data...');
  // Delete in correct order to respect foreign key constraints
  await prisma.reportActivity.deleteMany();
  await prisma.reportMaterial.deleteMany();
  await prisma.reportIssue.deleteMany();
  await prisma.reportDelay.deleteMany();
  await prisma.reportPhoto.deleteMany();
  await prisma.auditItem.deleteMany();
  await prisma.inventoryLog.deleteMany();
  
  await prisma.attendance.deleteMany();
  await prisma.outputRecord.deleteMany();
  await prisma.delay.deleteMany();
  await prisma.dailySiteReport.deleteMany();
  await prisma.materialAudit.deleteMany();
  await prisma.paymentMilestone.deleteMany();
  await prisma.estimate.deleteMany();
  
  await prisma.crew.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.material.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();
  // Don't wipe MaterialRate as it's static reference data unless requested, but let's wipe it to be fully clean
  await prisma.materialRate.deleteMany();
}

async function seedData() {
  console.log('Seeding foundational data...');

  // Base Cities Rates
  const citiesData = [
    { city: 'Hyderabad', cement: 380, steel: 58, sand: 45, aggregate: 38 },
    { city: 'Mumbai', cement: 410, steel: 60, sand: 55, aggregate: 42 },
    { city: 'Pune', cement: 400, steel: 59, sand: 50, aggregate: 40 },
    { city: 'Bangalore', cement: 420, steel: 62, sand: 58, aggregate: 45 }
  ];
  for (const data of citiesData) {
    await prisma.materialRate.create({ data });
  }

  // Users
  const pmUser = await prisma.user.create({
    data: {
      id: 'admin-1',
      name: 'Priya Sharma (PM)',
      phone: '+919876543210',
      role: 'PROJECT_MANAGER'
    }
  });

  const engUser = await prisma.user.create({
    data: {
      id: 'eng-1',
      name: 'Rahul Verma',
      phone: '+919876543211',
      role: 'SITE_ENGINEER'
    }
  });

  // Project
  const project = await prisma.project.create({
    data: {
      id: '294b2977-35cb-491f-9244-e9d983523101', // seeded id referenced in UI
      name: 'Skyline Towers (Phase 1)',
      location: 'Hyderabad, India',
      type: 'Commercial',
      budget: 5000000,
      spent: 1200000,
      startDate: new Date('2023-01-01'),
      status: 'Active'
    }
  });

  await prisma.projectMember.create({ data: { projectId: project.id, userId: pmUser.id, role: 'MANAGER' } });
  await prisma.projectMember.create({ data: { projectId: project.id, userId: engUser.id, role: 'ENGINEER' } });

  // Materials
  const cement = await prisma.material.create({
    data: { projectId: project.id, name: 'Cement', unit: 'bags', currentStock: 1200, minThreshold: 300, burnRate7Day: 150 }
  });
  const steel = await prisma.material.create({
    data: { projectId: project.id, name: 'Steel', unit: 'kg', currentStock: 4500, minThreshold: 1000, burnRate7Day: 400 }
  });
  const sand = await prisma.material.create({
    data: { projectId: project.id, name: 'Sand', unit: 'cft', currentStock: 2500, minThreshold: 500, burnRate7Day: 200 }
  });
  const aggregate = await prisma.material.create({
    data: { projectId: project.id, name: 'Aggregate', unit: 'cft', currentStock: 3000, minThreshold: 800, burnRate7Day: 300 }
  });

  // Contractors & Crews
  const contractor = await prisma.contractor.create({
    data: { name: 'Ramesh Const', trade: 'Masonry', phone: '1234567890', bankDetails: 'encrypted_val' }
  });

  const crew = await prisma.crew.create({
    data: { projectId: project.id, contractorId: contractor.id, tradeType: 'Masonry', size: 15, targetQty: 150, targetUnit: 'sqft/day' }
  });

  // Milestones
  await prisma.paymentMilestone.create({
    data: { projectId: project.id, title: 'Foundation Complete', amount: 500000, dueDate: new Date(Date.now() - 86400000 * 2), status: 'OVERDUE' }
  });

  console.log('Seeding 14 days of history...');
  const today = new Date();
  
  for (let i = 14; i > 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    
    // Attendance
    await prisma.attendance.create({
      data: {
        crewId: crew.id,
        date: d,
        presentCount: 12 + Math.floor(Math.random() * 4), // 12-15
      }
    });

    // Output
    const actualQty = 130 + Math.floor(Math.random() * 30);
    await prisma.outputRecord.create({
      data: {
        crewId: crew.id,
        projectId: project.id,
        date: d,
        actualQty,
        targetQty: 150,
        variancePct: ((150 - actualQty) / 150) * 100,
        unit: 'sqft'
      }
    });

    // Material Audit
    const audit = await prisma.materialAudit.create({
      data: {
        projectId: project.id,
        engineerId: engUser.id,
        date: d,
        activity: 'Daily usage log',
        weather: 'Clear',
        overallRisk: 'Healthy',
      }
    });

    await prisma.auditItem.create({
      data: {
        auditId: audit.id,
        materialId: cement.id,
        estimatedQty: 100,
        actualUsed: 100 + Math.floor(Math.random() * 10),
        variancePercent: Math.random() * 10,
        riskFlag: 'Healthy'
      }
    });

    await prisma.auditItem.create({
      data: {
        auditId: audit.id,
        materialId: steel.id,
        estimatedQty: 250,
        actualUsed: 250 + Math.floor(Math.random() * 20),
        variancePercent: Math.random() * 8,
        riskFlag: 'Healthy'
      }
    });
  }

  // Seed Payment Milestones
  await prisma.paymentMilestone.create({
    data: {
      title: 'Slab 4 Completion',
      amount: 450000,
      dueDate: new Date(new Date().getTime() + 6 * 24 * 60 * 60 * 1000), // +6 days
      status: 'UPCOMING',
      projectId: project.id
    }
  });
  await prisma.paymentMilestone.create({
    data: {
      title: 'Tower B Level 2 Steel',
      amount: 280000,
      dueDate: new Date(new Date().getTime() + 22 * 24 * 60 * 60 * 1000), // +22 days
      status: 'UPCOMING',
      projectId: project.id
    }
  });
  await prisma.paymentMilestone.create({
    data: {
      title: 'Slab 3 Completion',
      amount: 320000,
      dueDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000), // -2 days (overdue)
      status: 'OVERDUE',
      projectId: project.id
    }
  });
  await prisma.paymentMilestone.create({
    data: {
      title: 'Basement Conduit Layout',
      amount: 150000,
      dueDate: new Date(new Date().getTime() - 10 * 24 * 60 * 60 * 1000), // -10 days
      status: 'PAID',
      paidDate: new Date(new Date().getTime() - 9 * 24 * 60 * 60 * 1000), // paid 9 days ago
      projectId: project.id
    }
  });

  // Seed Pile Measurements
  await prisma.pileMeasurement.create({
    data: {
      projectId: project.id,
      materialType: 'Sand',
      estimatedVolume: 2450,
      inventoryVolume: 2500,
      divergencePct: 2,
      flagged: false,
      photoUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
      gps: '17.3850, 78.4867',
      createdBy: engUser.id,
      createdAt: new Date(Date.now() - 86400000 * 2)
    }
  });

  await prisma.pileMeasurement.create({
    data: {
      projectId: project.id,
      materialType: 'Aggregate',
      estimatedVolume: 1800,
      inventoryVolume: 3000,
      divergencePct: 40, // 1800 vs 3000 -> 40% divergence
      flagged: true,
      photoUrl: 'https://images.unsplash.com/photo-1542621334-a254cf47733d',
      gps: '17.3850, 78.4867',
      createdBy: engUser.id,
      createdAt: new Date(Date.now() - 86400000 * 1)
    }
  });

  console.log('Demo reset complete!');
}

async function run() {
  await clearAllData();
  await seedData();
}

run()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
