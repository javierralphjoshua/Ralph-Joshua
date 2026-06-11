import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Increase body payload size to support base64 image uploads from user food photo analysis
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Initialize the Google Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. Real-time food analysis will be disabled.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", apiKeyAvailable: !!apiKey });
});

// Helper function to query Gemini with retry exponential backoff and model fallbacks (e.g. gemini-1.5-flash-002, gemini-flash-latest)
async function generateCaloriesWithRetry(ai: GoogleGenAI, contentsParts: any[]): Promise<string> {
  const modelsToTry = ["gemini-1.5-flash-002", "gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  const maxRetriesPerModel = 2;
  const initialDelayMs = 1200;
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetriesPerModel; attempt++) {
      try {
        console.log(`[Gemini API] Requesting model: ${modelName} (Attempt ${attempt}/${maxRetriesPerModel})`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: { parts: contentsParts },
          config: {
            systemInstruction: "You are an expert, highly precise nutrition-tracking AI. Your task is to analyze the provided food image and the user's text description to estimate calories and macronutrients accurately.\n\nCore Rules:\n 1. Strict Portion Sizing: Base your estimate strictly on the portion size mentioned in the user's text input.\n 2. Standard Reference: If the user provides a count without a weight (e.g., \"1 egg\", \"1 apple\"), you MUST use standard USDA reference sizes (e.g., 1 Large Egg = ~50g, ~70-72 kcal). NEVER default to 100g unless the user explicitly types \"100g\".\n 3. Text-Primary Verification: Prioritize the user's text description for the actual portion size consumed. Use the image to identify the food items and preparation method, but strictly rely on the text for the quantity. If the image shows 3 eggs but the text says \"1 egg\", you must calculate macros for exactly 1 egg.\n 4. Output: Provide realistic, research-backed estimates for Calories, Protein (g), Carbohydrates (g), and Fat (g).\n\nSTRICT JSON OUTPUT REQUIREMENT:\nAlways respond with ONLY a clean, raw, valid JSON object matching the requested schema. Do NOT wrap the JSON in markdown code blocks, HTML tags, or any other conversational wrapper text. Start directly with '{' and end with '}'.",
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                itemName: {
                  type: Type.STRING,
                  description: "A short, clean, descriptive name of the food item or combined dish analyzed."
                },
                calories: {
                  type: Type.INTEGER,
                  description: "Estimated total calories in kcal."
                },
                protein: {
                  type: Type.INTEGER,
                  description: "Estimated protein content in grams."
                },
                carbs: {
                  type: Type.INTEGER,
                  description: "Estimated carbohydrates in grams."
                },
                fat: {
                  type: Type.INTEGER,
                  description: "Estimated total fat in grams."
                },
                confidence: {
                  type: Type.NUMBER,
                  description: "Nutritionist confidence score from 0.0 to 1.0 based on description specificity or image quality."
                },
                description: {
                  type: Type.STRING,
                  description: "A brief 2-sentence explanation of how the estimate was generated, highlighting the main ingredients detected."
                }
              },
              required: ["itemName", "calories", "protein", "carbs", "fat", "confidence", "description"]
            }
          }
        });

        const textOutput = response.text;
        if (textOutput) {
          console.log(`[Gemini API] Success using model ${modelName} on attempt ${attempt}`);
          return textOutput;
        }
        throw new Error("Empty response text received from Gemini.");
      } catch (err: any) {
        lastError = err;
        const status = err.status || err.code || (err.error && err.error.code);
        const errMsg = err.message || JSON.stringify(err);
        console.warn(`[Gemini API WARNING] Failed model: ${modelName} (Attempt ${attempt}/${maxRetriesPerModel}): Status ${status}, Error: ${errMsg}`);
        
        // If it is a client error (like 400 Bad Request, 403 Forbidden etc.) and NOT a rate limit (429), avoid useless retries of this model
        if (status === 400 || status === 403 || status === 404) {
          console.log(`[Gemini API] Client configuration error (${status}), skipping remaining attempts for ${modelName}.`);
          break;
        }

        // Apply backoff delay for temporary issues
        if (attempt < maxRetriesPerModel) {
          const backoffDelay = initialDelayMs * Math.pow(2, attempt - 1);
          console.log(`[Gemini API] Waiting ${backoffDelay}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate response after all retry attempts with all models failed.");
}

// Simple heuristic nutrient estimator fallback when Gemini API limit is exceeded (e.g., 429 Quota Exhausted)
function estimateHeuristically(input: string): {
  itemName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: number;
  description: string;
} {
  const text = (input || "").toLowerCase().trim();
  
  // Local food dictionary for common bodybuilding/fitness foods (standard portion rules)
  const database = [
    { keys: ["chicken breast", "chicken breast", "chicken", "manok", "chicken breast fillet"], kcal: 165, p: 31, c: 0, f: 3.6, name: "Chicken Breast", defaultG: 150 },
    { keys: ["jasmine rice", "white rice", "brown rice", "rice", "kanin"], kcal: 130, p: 2.7, c: 28, f: 0.3, name: "White Rice", defaultG: 200 },
    { keys: ["egg", "eggs", "itlog", "boiled egg", "fried egg"], kcal: 140, p: 12, c: 1, f: 10, name: "Egg", defaultG: 100 }, // ~2 medium eggs
    { keys: ["whey", "protein powder", "whey protein", "shake", "scoop"], kcal: 380, p: 80, c: 8, f: 5, name: "Whey Protein", defaultG: 30 }, // ~1 scoop (30g)
    { keys: ["beef", "baka", "steak", "ground beef", "lean beef"], kcal: 250, p: 26, c: 0, f: 15, name: "Beef", defaultG: 150 },
    { keys: ["pork", "baboy", "porkchop", "liempo", "pork loin"], kcal: 240, p: 27, c: 0, f: 14, name: "Pork", defaultG: 150 },
    { keys: ["fish", "isda", "salmon", "tilapia", "tuna", "tuna flakes"], kcal: 185, p: 21, c: 0, f: 9, name: "Fish/Salmon", defaultG: 150 },
    { keys: ["banana", "saging", "bananas"], kcal: 89, p: 1.1, c: 23, f: 0.3, name: "Banana", defaultG: 120 },
    { keys: ["apple", "mansanas", "apples"], kcal: 52, p: 0.3, c: 14, f: 0.2, name: "Apple", defaultG: 150 },
    { keys: ["oats", "oatmeal", "quaker oats", "rolled oats"], kcal: 389, p: 16.9, c: 66, f: 6.9, name: "Oats", defaultG: 50 },
    { keys: ["bread", "tinapay", "whole wheat bread", "slice", "slices"], kcal: 265, p: 9, c: 49, f: 3.2, name: "Bread/Slices", defaultG: 60 },
    { keys: ["potato", "patatas", "potatoes", "sweet potato", "kamote"], kcal: 77, p: 2, c: 17, f: 0.1, name: "Potato", defaultG: 150 },
    { keys: ["milk", "gatas", "fresh milk", "cow milk"], kcal: 50, p: 3.3, c: 4.8, f: 2, name: "Milk", defaultG: 200 },
    { keys: ["avocado", "abocado"], kcal: 160, p: 2, c: 9, f: 15, name: "Avocado", defaultG: 100 },
    { keys: ["peanut butter", "peanut butter", "butter"], kcal: 588, p: 25, c: 20, f: 50, name: "Peanut Butter", defaultG: 32 }
  ];

  let matchedFoods: string[] = [];
  let totalKcal = 0;
  let totalP = 0;
  let totalC = 0;
  let totalF = 0;
  let foundAny = false;

  const weightRegex = /(\d+)\s*(?:g|grams?|ml)\b/i;

  // Scan text to identify matches and compute weights
  database.forEach(item => {
    let matchedKey: string | null = null;
    for (const key of item.keys) {
      if (text.includes(key)) {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey) {
      foundAny = true;
      let weight = item.defaultG;

      // Extract surrounding portion weight (e.g. "150g" or "100 grams")
      const keywordIdx = text.indexOf(matchedKey);
      const surroundingText = text.slice(
        Math.max(0, keywordIdx - 20),
        Math.min(text.length, keywordIdx + matchedKey.length + 20)
      );
      
      const match = surroundingText.match(weightRegex);
      if (match) {
        weight = parseInt(match[1]) || item.defaultG;
      } else {
        const globalMatch = text.match(weightRegex);
        if (globalMatch) {
          weight = parseInt(globalMatch[1]) || item.defaultG;
        }
      }

      const factor = weight / 100;
      totalKcal += Math.round(item.kcal * factor);
      totalP += Math.round(item.p * factor);
      totalC += Math.round(item.c * factor);
      totalF += Math.round(item.f * factor);
      
      matchedFoods.push(`${weight}g ${item.name}`);
    }
  });

  if (!foundAny) {
    // Elegant generic default backup if no database key matches
    return {
      itemName: input ? `Custom Entry: ${input}` : "Standard Exercise Meal",
      calories: 380,
      protein: 20,
      carbs: 45,
      fat: 12,
      confidence: 0.45,
      description: "⚠️ Local estimate (Google Gemini API daily free quota limit reached). Assumed standard macronutrient-balanced nutrition profile."
    };
  }

  return {
    itemName: matchedFoods.join(" & "),
    calories: totalKcal,
    protein: totalP,
    carbs: totalC,
    fat: totalF,
    confidence: 0.8,
    description: "⚠️ Local fallback estimate (Google Gemini API free tier limit or rate limit exceeded). Extrapolated: " + matchedFoods.join(", ") + "."
  };
}

// Gemini Food Estimation API endpoint
app.post("/api/estimate-calories", async (req, res) => {
  try {
    const { textDescription, imageData, imageMimeType } = req.body;

    if (!textDescription && !imageData) {
      return res.status(400).json({ error: "Please provide either a food description text or an image." });
    }

    if (!apiKey) {
      // Graceful fallback for missing API Key to prevent server crash during startup,
      // as specified in Dependency Management guidelines.
      return res.json({
        itemName: textDescription || "Custom Meal",
        calories: 320,
        protein: 14,
        carbs: 42,
        fat: 10,
        confidence: 0.5,
        description: "⚠️ GEMINI_API_KEY is not configured in Secrets. This is a simulated fallback nutrient estimate."
      });
    }

    const ai = getAiClient();
    const contentsParts: any[] = [];

    // Add image portion if available
    if (imageData) {
      // Remove data URL prefix if present
      const base64Clean = imageData.replace(/^data:image\/\w+;base64,/, "");
      contentsParts.push({
        inlineData: {
          mimeType: imageMimeType || "image/jpeg",
          data: base64Clean,
        },
      });
    }

    // Add text instructions / user description
    const userPrompt = textDescription 
      ? `Estimate calories and macros for this food: "${textDescription}"`
      : "Estimate calories and macros for the food depicted in this image.";
    
    contentsParts.push({ text: userPrompt });

    let parsedEstimate: any = null;

    try {
      // Request structured JSON object using our new robust retry with model-fallback helper
      const bodyText = await generateCaloriesWithRetry(ai, contentsParts);

      if (!bodyText) {
        throw new Error("Empty response received from Gemini AI model.");
      }

      // Robust parsing logic to extract clean JSON
      const rawText = bodyText.trim();
      
      try {
        parsedEstimate = JSON.parse(rawText);
      } catch (directError) {
        console.warn("Direct JSON parsing failed, attempting cleanup extraction:", directError);
        
        // Try stripping markdown blocks if they were wrapped
        let cleanedText = rawText;
        if (cleanedText.startsWith("```")) {
          cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        }
        cleanedText = cleanedText.trim();

        try {
          parsedEstimate = JSON.parse(cleanedText);
        } catch (stripError) {
          // Find the first '{' and matched '{ }' range if there is surrounding chatter
          const startIdx = cleanedText.indexOf("{");
          const endIdx = cleanedText.lastIndexOf("}");
          
          if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            const jsonSubstring = cleanedText.slice(startIdx, endIdx + 1);
            try {
              parsedEstimate = JSON.parse(jsonSubstring);
            } catch (substringError) {
              throw new Error(`Failed to parse response substring: ${substringError.message}`);
            }
          } else {
            throw new Error(`No JSON structured block found in response text: ${cleanedText}`);
          }
        }
      }

      // Standardize object keys to integers for safe calculations
      if (parsedEstimate) {
        parsedEstimate.calories = Math.round(Number(parsedEstimate.calories) || 0);
        parsedEstimate.protein = Math.round(Number(parsedEstimate.protein) || 0);
        parsedEstimate.carbs = Math.round(Number(parsedEstimate.carbs) || 0);
        parsedEstimate.fat = Math.round(Number(parsedEstimate.fat) || 0);
      }
    } catch (geminiError: any) {
      console.warn("[Gemini API Quota Fallback Triggered] Error calling Gemini: ", geminiError);
      
      // Safe heuristic fallback for quota errors, internet connection dropouts, or timeouts
      parsedEstimate = estimateHeuristically(textDescription || "");
    }

    return res.json(parsedEstimate);

  } catch (error: any) {
    console.error("Error in /api/estimate-calories:", error);
    return res.status(500).json({ 
      error: "Failed to estimate calories. Please try again with a simpler food description or clear picture.",
      details: error.message 
    });
  }
});

// Setup development server middleware or production files serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite middleware for development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Setting up Express static files for production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[30-Day CHALLENGE SERVER] Running cleanly on http://localhost:${PORT}`);
  });
}

startServer();
