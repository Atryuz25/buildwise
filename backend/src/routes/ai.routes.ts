import { Router } from 'express';
import multer from 'multer';
import OpenAI from 'openai';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Optional: Fallback to mock behavior if no API key is provided
const USE_MOCK = !process.env.OPENAI_API_KEY;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy',
});

router.post('/headcount', upload.single('image'), async (req, res) => {
  try {
    const { reportedCount } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const count = parseInt(reportedCount, 10);

    if (USE_MOCK) {
      // Return mock logic if the environment lacks an API key
      const detectedCount = count > 5 ? count - 2 : count;
      const divergencePct = Math.abs((detectedCount - count) / count) * 100;
      
      return res.json({
        detectedCount,
        reportedCount: count,
        divergencePct,
        confidence: 0.94,
        status: divergencePct > 5 ? 'Divergence' : 'Match',
        analysisNotes: divergencePct > 5 
          ? `[MOCK] Detected ${detectedCount} personnel. Reported was ${count}. Please verify.`
          : `[MOCK] Count matches closely with reported ${count}.`
      });
    }

    // Convert image buffer to base64
    const base64Image = file.buffer.toString('base64');
    const mimeType = file.mimetype;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `You are an AI specialized in counting construction workers on a site. The reported headcount is ${count}. Count the number of workers in the image. Return a strict JSON response in this format without markdown wrappers: {"detectedCount": number, "confidence": number, "analysisNotes": "string explanation"}` 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    });

    const aiContent = response.choices[0]?.message?.content;
    if (!aiContent) throw new Error("No response from GPT-4");

    const result = JSON.parse(aiContent);
    const detectedCount = result.detectedCount;
    const divergencePct = count > 0 ? Math.abs((detectedCount - count) / count) * 100 : 0;

    res.json({
      detectedCount,
      reportedCount: count,
      divergencePct,
      confidence: result.confidence || 0.9,
      status: divergencePct > 5 ? 'Divergence' : 'Match',
      analysisNotes: result.analysisNotes
    });

  } catch (error: any) {
    console.error('AI Headcount Error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
