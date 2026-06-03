import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/authenticate';
import { renderPdf } from '../reports/renderPdf';
import { fetchReportData } from '../reports/reportData';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

// GET JSON data for a specific report type
router.get('/', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({ error: 'Report type is required' });
    }

    const data = await fetchReportData(projectId as string, type as string);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET export PDF
router.get('/export-pdf', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { type } = req.query;

    if (!type) {
      return res.status(400).json({ error: 'Report type is required' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const data = await fetchReportData(projectId as string, type as string);
    
    // Map type to template name and title
    const typeMapping: Record<string, { template: string, title: string }> = {
      'CEMENT_TREND': { template: 'cement-trend', title: 'Cement Trend Analysis' },
      'STEEL_SCRAP': { template: 'steel-scrap', title: 'Steel Optimization & Scrap Report' },
      'INVENTORY': { template: 'inventory', title: 'Inventory Consumption Report' },
      'COST_BREAKDOWN': { template: 'cost-breakdown', title: 'Material Cost Breakdown' },
    };

    const mapping = typeMapping[type as string];
    if (!mapping) {
      return res.status(400).json({ error: `Unsupported report type for PDF: ${type}` });
    }

    const pdfBuffer = await renderPdf(mapping.template, data, mapping.title, project.name);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=buildwise-${mapping.template}.pdf`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err: any) {
    console.error('PDF Export Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
