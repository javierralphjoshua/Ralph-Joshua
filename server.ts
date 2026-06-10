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

// Helper function to query Gemini with retry exponential backoff and model fallbacks (e.g. gemini-3.1-flash-lite)
async function generateCaloriesWithRetry(ai: GoogleGenAI, contentsParts: any[]): Promise<string> {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
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
            systemInstruction: "You are an expert athletic nutritionist and dietitian. Based on the food text description and/or the uploaded image, deliver a realistic estimation of the food name, total calorie count, and macronutrients (calories, protein, carbs, fat). Be precise.\n\nCRITICAL DIRECTIVE ON USER'S TEXTUAL SPECIFICATIONS:\nYou must HEAVILY PRIORITIZE and strictly respect any written weights, grams, ounces, or exact portion quantities specified in the user's text description (e.g. '100g chicken breast', '250g white jasmine rice'). Use the uploaded image simply as a visual reference/verification aid. Do NOT override the written portion sizes or specifications with generic values based on the image.\n\nSTRICT JSON OUTPUT REQUIREMENT:\nAlways respond with ONLY a clean, raw, valid JSON object matching the requested schema. Do NOT wrap the JSON in markdown code blocks, HTML tags, or any other conversational wrapper text. Start directly with '{' and end with '}'.",
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

    // Request structured JSON object using our new robust retry with model-fallback helper
    const bodyText = await generateCaloriesWithRetry(ai, contentsParts);

    if (!bodyText) {
      throw new Error("Empty response received from Gemini AI model.");
    }

    // Robust parsing logic to extract clean JSON
    let parsedEstimate: any = null;
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
