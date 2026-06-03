import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { queues } from '../queues';
import { authenticate } from '../middleware/authenticate';

// mergeParams is required to access :projectId from the parent router
const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

// 1. Upsert Draft Report
router.post('/', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { 
      date, 
      activities, 
      materials, 
      crews, 
      issues, 
      isDelayed, 
      delayCause, 
      delayHours 
    } = req.body;

    const engineerId = req.user.id;
    const reportDate = date ? new Date(date) : new Date();

    // Serialize crews arrays into JSON for the draft, as it doesn't have a sub-model
    const crewsData = crews ? JSON.stringify(crews) : null;

    // Check if draft exists for today
    // For simplicity of this demo, we'll just create a new one every time if no ID is passed,
    // or upsert if we passed an ID. Let's just create a new DRAFT.
    const report = await prisma.dailySiteReport.create({
      data: {
        projectId,
        engineerId,
        date: reportDate,
        status: 'DRAFT',
        crewsData,
        activities: {
          create: activities?.map((a: any) => ({
            activityName: a.name,
            zone: a.location,
            status: a.status,
            expectedProgress: String(a.expectedPct),
            actualProgress: String(a.actualPct)
          })) || []
        },
        materials: {
          create: materials?.map((m: any) => ({
            materialId: m.materialId,
            expected: m.expected,
            actual: m.actual,
            unit: m.unit || 'units'
          })) || []
        },
        issues: {
          create: issues?.map((i: any) => ({
            type: i.type,
            severity: i.severity,
            description: i.desc
          })) || []
        },
        delays: {
          create: isDelayed && delayCause ? [{
            cause: delayCause,
            hours: Number(delayHours) || 0
          }] : []
        }
      }
    });

    res.json({ success: true, reportId: report.id });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Submit Report (Atomic Transaction)
router.post('/:rid/submit', authenticate, async (req, res) => {
  try {
    const { projectId, rid } = req.params;
    const { 
      date, 
      activities, 
      materials, 
      crews, 
      issues, 
      isDelayed, 
      delayCause, 
      delayHours 
    } = req.body;

    const engineerId = req.user.id;
    const reportDate = date ? new Date(date) : new Date();
    const crewsData = crews ? JSON.stringify(crews) : null;

    // The atomic transaction to sync daily report into the Phase 1 audit store + Phase 3 labour
    const result = await prisma.$transaction(async (tx) => {
      
      // Upsert the main DailySiteReport record
      let reportId = rid;
      
      if (rid === 'new') {
        const report = await tx.dailySiteReport.create({
          data: {
            projectId,
            engineerId,
            date: reportDate,
            status: 'SUBMITTED',
            crewsData,
            activities: {
              create: activities?.map((a: any) => ({
                activityName: a.name,
                zone: a.location,
                status: a.status,
                expectedProgress: String(a.expectedPct),
                actualProgress: String(a.actualPct)
              })) || []
            },
            materials: {
              create: materials?.map((m: any) => ({
                materialId: m.materialId,
                expected: m.expected,
                actual: m.actual,
                unit: m.unit || 'units'
              })) || []
            },
            issues: {
              create: issues?.map((i: any) => ({
                type: i.type,
                severity: i.severity,
                description: i.desc
              })) || []
            },
            delays: {
              create: isDelayed && delayCause ? [{
                cause: delayCause,
                hours: Number(delayHours) || 0
              }] : []
            }
          }
        });
        reportId = report.id;
      } else {
        await tx.dailySiteReport.update({
          where: { id: rid },
          data: { status: 'SUBMITTED', crewsData }
        });
      }

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

        const createdAudit = await tx.materialAudit.create({
          data: {
            projectId,
            engineerId,
            date: reportDate,
            activity: 'Daily Site Report Sync',
            weather: 'Not Specified',
            overallRisk,
            source: 'DAILY_REPORT',
            items: {
              create: processedItems
            }
          }
        });

        // Auto-deduct inventory and create consumption logs
        for (const item of processedItems) {
          await tx.material.update({
            where: { id: item.materialId },
            data: { currentStock: { decrement: item.actualUsed } }
          });

          await tx.inventoryLog.create({
            data: {
              materialId: item.materialId,
              type: 'CONSUMPTION',
              quantity: item.actualUsed,
              referenceId: createdAudit.id,
              notes: `Consumed via Daily Site Report (${reportId})`
            }
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
              targetQty: outputVal,
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
            impactCost: 0,
            notes: `Auto-generated from Daily Report. Hours lost: ${delayHours}`
          }
        });

        // Queue WhatsApp Alert for PM
        await queues.whatsappDigest.add('delay-alert', {
          phone: '+919876543210',
          message: `🚨 Delay Alert: Project ${projectId} has reported a ${delayCause} delay of ${delayHours} hours.`
        });
      }

      // Also queue if overall risk is high
      if (materials && materials.length > 0) {
        const maxVar = Math.max(...materials.map((m: any) => m.expected > 0 ? ((m.actual - m.expected) / m.expected) * 100 : 0));
        if (maxVar > 15) {
          await queues.whatsappDigest.add('material-risk-alert', {
            phone: '+919876543210',
            message: `⚠️ Material Risk: Project ${projectId} has reported >15% variance in expected materials.`
          });
        }
      }

      return reportId;
    });

    res.json({ success: true, reportId: result });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
