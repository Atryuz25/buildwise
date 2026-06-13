require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  // Try directly calling the REST endpoint to list models to see if the key works
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Key starts with:", apiKey.substring(0, 5));
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log("Available models:", JSON.stringify(data).substring(0, 500));
  } catch (e) {
    console.error("Fetch models failed:", e);
  }
}

run();
