import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { whatsappQueue } from '../queues/whatsapp.queue';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
  try {
    const { 
      date, 
      projectId, 
      engineerId, 
      materials, 
      crews, 
      issues, 
      isDelayed, 
      delayCause, 
      delayHours 
    } = req.body;

    const reportDate = date ? new Date(date) : new Date();

    // The atomic transaction to sync daily report into the Phase 1 audit store + Phase 3 labour
    const result = await prisma.$transaction(async (tx) => {
      // 1. Sync Materials to Phase 1 MaterialAudit
      if (materials && materials.length > 0) {
        let maxVariance = 0;
        const processedItems = materials.map((m: any) => {
          let variancePercent = 0;
          if (m.expected > 0) {
            variancePercent = ((m.actual - m.expected) / m.expected) * 100;
          }
          let riskFlag = 'Healthy';
          if (variancePercent > 15) riskFlag = 'High risk';
          else if (variancePercent > 5) riskFlag = 'Warning';

          if (variancePercent > maxVariance) maxVariance = variancePercent;

          return {
            materialId: m.materialId,
            estimatedQty: m.expected,
            actualUsed: m.actual,
            variancePercent,
            riskFlag
          };
        });

        let overallRisk = 'Healthy';
        if (maxVariance > 15) overallRisk = 'High risk';
        else if (maxVariance > 5) overallRisk = 'Warning';

        await tx.materialAudit.create({
          data: {
            projectId,
            engineerId,
            date: reportDate,
            activity: 'Daily Site Report Sync',
            weather: 'Not Specified', // Default for now
            overallRisk,
            items: {
              create: processedItems
            }
          }
        });

        // Auto-deduct inventory
        for (const item of processedItems) {
          await tx.material.update({
            where: { id: item.materialId },
            data: { currentStock: { decrement: item.actualUsed } }
          });
        }
      }

      // 2. Sync Labour to Phase 3 Attendance & Outputs
      if (crews && crews.length > 0) {
        for (const c of crews) {
          // Attendance record
          await tx.attendance.create({
            data: {
              crewId: c.crewId,
              date: reportDate,
              presentCount: c.actual,
              notes: 'From Daily Report'
            }
          });

          // Assume actualOutput string is parsable as float (e.g. "180 sqft" -> 180)
          const outputVal = parseFloat(c.actualOutput) || 0;
          
          await tx.outputRecord.create({
            data: {
              crewId: c.crewId,
              projectId,
              date: reportDate,
              actualQty: outputVal,
              targetQty: outputVal, // Not passed in this payload, mock it
              variancePct: 0,
              unit: c.actualOutput.replace(/[0-9.]/g, '').trim() || 'units'
            }
          });
        }
      }

      // 3. Sync Delays to Phase 3
      if (isDelayed && delayCause) {
        await tx.delay.create({
          data: {
            projectId,
            date: reportDate,
            cause: delayCause,
            severity: delayHours > 4 ? 'High' : 'Medium',
            impactDays: delayHours > 8 ? Math.ceil(delayHours / 8) : 0,
            impactCost: 0, // Requires cost logic later
            notes: `Auto-generated from Daily Report. Hours lost: ${delayHours}`
          }
        });

        // Queue WhatsApp Alert for PM
        await whatsappQueue.add('delay-alert', {
          phone: '+919876543210',
          message: `🚨 Delay Alert: Project ${projectId} has reported a ${delayCause} delay of ${delayHours} hours.`
        });
      }

      // Also queue if overall risk is high
      if (materials && materials.length > 0) {
        // Find if maxVariance > 15
        const maxVar = Math.max(...materials.map((m: any) => m.expected > 0 ? ((m.actual - m.expected) / m.expected) * 100 : 0));
        if (maxVar > 15) {
          await whatsappQueue.add('material-risk-alert', {
            phone: '+919876543210',
            message: `⚠️ Material Risk: Project ${projectId} has reported >15% variance in expected materials.`
          });
        }
      }

      return true;
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
