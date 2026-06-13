import { Router } from 'express';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import { supabase } from '../lib/supabase';
import { queues } from '../queues';

const prisma = new PrismaClient();

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const USE_MOCK = !process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy');

router.post('/headcount', upload.single('image'), async (req, res) => {
  try {
    const { reportedCount } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const count = parseInt(reportedCount, 10);

    if (USE_MOCK) {
      const detectedCount = count > 15 ? count - 6 : count;
      const divergencePct = count > 0 ? Math.abs((detectedCount - count) / count) * 100 : 0;
      
      return res.json({
        detectedCount,
        reportedCount: count,
        divergencePct,
        confidence: 0.94,
        status: divergencePct >= 30 ? 'Divergence' : 'Match',
        analysisNotes: divergencePct >= 30 
          ? `[MOCK] Detected ${detectedCount} personnel. Reported was ${count}. Please verify.`
          : `[MOCK] Count matches closely with reported ${count}.`
      });
    }

    const base64Image = file.buffer.toString('base64');
    const mimeType = file.mimetype;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `You are an AI specialized in counting construction workers on a site. The reported headcount is ${count}. Count the exact number of workers visible in the image. Return a strict JSON response in exactly this format without any markdown wrappers: {"detectedCount": number, "confidence": number, "analysisNotes": "string explanation"}`;

    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType
        }
      }
    ];

    const resultAI = await model.generateContent([prompt, ...imageParts]);
    const responseText = resultAI.response.text().trim();
    
    // Clean up potential markdown formatting from Gemini
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const result = JSON.parse(cleanedText);
    const detectedCount = result.detectedCount;
    const divergencePct = count > 0 ? Math.abs((detectedCount - count) / count) * 100 : 0;

    res.json({
      detectedCount,
      reportedCount: count,
      divergencePct,
      confidence: result.confidence || 0.9,
      status: divergencePct >= 30 ? 'Divergence' : 'Match',
      analysisNotes: result.analysisNotes
    });

  } catch (error: any) {
    console.error('AI Headcount Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET Pile Measurements History
router.get('/pile-measurement/:projectId', async (req, res) => {
  try {
    const history = await prisma.pileMeasurement.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Pile Measurement
router.post('/pile-measurement', upload.single('image'), async (req, res) => {
  try {
    const { projectId, materialType, gps } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No image uploaded' });
    if (!projectId || !materialType) return res.status(400).json({ error: 'Missing projectId or materialType' });

    // 1. Fetch current inventory stock for that material
    const material = await prisma.material.findFirst({
      where: { projectId, name: materialType }
    });
    
    // If material doesn't exist, we might just default to 0 to not block the demo
    const inventoryVolume = material ? material.currentStock : 0;

    // 2. Upload photo to Supabase Storage
    const ext = file.originalname.split('.').pop();
    const fileName = `pile_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('buildwise-photos')
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    let photoUrl = null;
    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      // Fallback or ignore for demo? Let's just log it.
    } else {
      const { data } = supabase.storage.from('buildwise-photos').getPublicUrl(fileName);
      photoUrl = data.publicUrl;
    }

    let estimatedVolume = 0;
    let rawAiResponse = null;

    // 3. Fetch reference photo if available
    const reference = await prisma.aiReferencePhoto.findFirst({
      where: { projectId, feature: 'PILE_MEASUREMENT', category: materialType }
    });

    // 4. Call Gemini
    if (USE_MOCK) {
      // Mock logic: return a hardcoded estimate or slightly diverged value
      estimatedVolume = materialType === 'Sand' ? inventoryVolume * 0.98 : inventoryVolume * 0.6; // Aggregate has large divergence in mock
    } else {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      const contentParts: any[] = [];

      if (reference) {
        let refBuffer: ArrayBuffer | null = null;
        let refMime = 'image/jpeg';
        
        // Fetch reference image buffer from URL
        try {
          const refRes = await fetch(reference.photoUrl);
          refBuffer = await refRes.arrayBuffer();
          refMime = refRes.headers.get('content-type') || 'image/jpeg';
        } catch (e) {
          console.error("Failed to load reference photo for AI:", e);
        }

        if (refBuffer) {
          contentParts.push(`IMAGE 1 (Reference Photo):\nThis is a calibrated baseline reference photo of a ${materialType} stockpile. Its EXACT known volume is ${reference.metadata} cubic feet.`);
          contentParts.push({
            inlineData: { data: Buffer.from(refBuffer).toString('base64'), mimeType: refMime }
          });
          
          contentParts.push(`IMAGE 2 (Target Photo):\nThis is a new photo of a ${materialType} stockpile. Estimate its volume in cubic feet by visually comparing it to IMAGE 1.`);
          contentParts.push({
            inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype }
          });
          
          contentParts.push(`CRITICAL INSTRUCTION: If IMAGE 2 appears to be the exact same photo or shows a pile of the exact identical size as IMAGE 1, you MUST return exactly ${reference.metadata}. Otherwise, scale your estimate proportionally.\n\nReturn a strict JSON response in exactly this format without any markdown wrappers: {"estimatedVolume": number}`);
        } else {
          // Fallback to no-reference prompt
          contentParts.push(`This is a photo of a construction material stockpile (${materialType}). Estimate the volume of the pile in cubic feet. Consider the perspective and scale of surrounding objects. Return a strict JSON response in exactly this format without any markdown wrappers: {"estimatedVolume": number}`);
          contentParts.push({
            inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype }
          });
        }
      } else {
        contentParts.push(`This is a photo of a construction material stockpile (${materialType}). Estimate the volume of the pile in cubic feet. Consider the perspective and scale of surrounding objects. Return a strict JSON response in exactly this format without any markdown wrappers: {"estimatedVolume": number}`);
        contentParts.push({
          inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype }
        });
      }
      
      // 60s timeout via Promise.race
      const aiPromise = model.generateContent(contentParts);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 60000));
      
      try {
        const resultAI: any = await Promise.race([aiPromise, timeoutPromise]);
        const responseText = resultAI.response.text().trim();
        rawAiResponse = responseText;
        
        // Clean up markdown
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonResult = JSON.parse(cleanedText);
        estimatedVolume = Number(jsonResult.estimatedVolume);
        
        if (isNaN(estimatedVolume)) throw new Error('Could not parse number from AI');
      } catch (e: any) {
        if (e.message === 'TIMEOUT') {
          return res.status(504).json({ error: 'Unable to estimate — timeout' });
        }
        return res.status(500).json({ error: 'Unable to estimate: ' + e.message });
      }
    }

    // 4. Calculate divergence
    const divergencePct = inventoryVolume > 0 
      ? Math.abs((inventoryVolume - estimatedVolume) / inventoryVolume) * 100 
      : 0;
    
    const flagged = divergencePct >= 20;

    // 5. Save to DB
    const measurement = await prisma.pileMeasurement.create({
      data: {
        projectId,
        materialType,
        estimatedVolume,
        inventoryVolume,
        divergencePct,
        flagged,
        photoUrl,
        gps,
        rawAiResponse,
        createdBy: 'eng-1' // In a real app, from req.user
      }
    });

    // 6. Enqueue WhatsApp if flagged
    if (flagged) {
      await queues.whatsappDigest.add('pile-divergence', {
        type: 'pile-divergence',
        projectId,
        material: materialType,
        estimated: estimatedVolume,
        inventory: inventoryVolume,
        divergence: divergencePct
      });
    }

    res.json({
      estimatedVolume,
      inventoryVolume,
      divergencePct,
      flagged,
      photoUrl
    });

  } catch (error: any) {
    console.error('Pile Measurement Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET Reference Photos
router.get('/reference-photos/:projectId', async (req, res) => {
  try {
    const photos = await prisma.aiReferencePhoto.findMany({
      where: { projectId: req.params.projectId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(photos);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Reference Photo
router.post('/reference-photos', upload.single('image'), async (req, res) => {
  try {
    const { projectId, feature, category, metadata } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No image uploaded' });
    if (!projectId || !feature || !category) return res.status(400).json({ error: 'Missing required fields' });

    const ext = file.originalname.split('.').pop();
    const fileName = `ref_${feature}_${category}_${Date.now()}.${ext}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('buildwise-photos')
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (uploadError) throw new Error(uploadError.message);

    const { data } = supabase.storage.from('buildwise-photos').getPublicUrl(fileName);
    
    // Check if one already exists for this category and delete/overwrite or just keep latest (we fetch latest)
    
    const photo = await prisma.aiReferencePhoto.create({
      data: {
        projectId,
        feature,
        category,
        metadata,
        photoUrl: data.publicUrl,
        uploadedBy: 'eng-1' // In real app from req.user
      }
    });

    res.json(photo);
  } catch (error: any) {
    console.error('Reference Photo Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
