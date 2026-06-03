import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { redis } from '../server';
import { authenticate } from '../middleware/authenticate';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

const getMockForecast = (location: string) => {
  const dates = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  return [
    { date: dates[0], temp: 32, condition: 'Clear', wind: 12 },
    { date: dates[1], temp: 34, condition: 'Clouds', wind: 15 },
    { date: dates[2], temp: 31, condition: 'Rain', wind: 22 },
    { date: dates[3], temp: 29, condition: 'Rain', wind: 18 },
    { date: dates[4], temp: 33, condition: 'Clear', wind: 10 }
  ];
};

router.get('/', authenticate, async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const cacheKey = `weather:${projectId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    if (!process.env.OPENWEATHER_API_KEY) {
      const mockResponse = {
        isMock: true,
        forecast: getMockForecast(project.location)
      };
      await redis.set(cacheKey, JSON.stringify(mockResponse), 'EX', 3600);
      return res.json(mockResponse);
    }

    // In a real scenario, make axios call to OpenWeatherMap here.
    // Assuming we have fetch available
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(project.location)}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch from OpenWeatherMap');
    }

    const data = await response.json();
    
    // Transform OWM data into 5-day format
    // OWM gives 3-hour chunks (40 items). We'll grab one per day.
    const forecast = data.list.filter((item: any, index: number) => index % 8 === 0).map((item: any) => ({
      date: item.dt_txt.split(' ')[0],
      temp: Math.round(item.main.temp),
      condition: item.weather[0].main,
      wind: item.wind.speed
    }));

    const result = {
      isMock: false,
      forecast
    };

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);
    res.json(result);

  } catch (err: any) {
    console.error('Weather error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
