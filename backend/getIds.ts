import { PrismaClient } from '@prisma/client'; 
const prisma = new PrismaClient(); 
async function main() { 
  const p = await prisma.project.findFirst(); 
  const u = await prisma.user.findFirst(); 
  const m = await prisma.material.findFirst(); 
  
  if (!p || !u || !m) {
    console.log("Missing seed data!");
    return;
  }
  
  const c = await prisma.crew.create({
    data: {
      projectId: p.id, 
      contractorName: 'Bob', 
      tradeType: 'Civil', 
      size: 20
    }
  }); 
  console.log("PROJECT:", p.id);
  console.log("USER:", u.id);
  console.log("MATERIAL:", m.id);
  console.log("CREW:", c.id);
} 
main();
