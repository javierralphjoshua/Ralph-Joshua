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

// Helper function to query Gemini with retry exponential backoff and model fallbacks (e.g. gemini-3.5-flash, gemini-flash-latest)
async function generateCaloriesWithRetry(ai: GoogleGenAI, contentsParts: any[]): Promise<string> {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-2.5-flash"];
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
            systemInstruction: "You are an expert, highly precise nutrition-tracking AI. Your task is to analyze the provided food image and the user's text description to estimate calories and macronutrients accurately.\n\nCore Rules:\n 1. Strict Portion Sizing: Base your estimate strictly on the portion size mentioned in the user's text input.\n 2. Detailed Itemized Breakdown in Description: In the 'description' field, you MUST provide a clear, itemized line-by-line bullet-point breakdown of each identified food item, its estimated portion size, estimated calories, and estimated protein content (e.g.,\n - 2 Scrambled Eggs: 140 kcal | 12g Protein\n - 1 slice Whole Wheat Toast: 80 kcal | 3g Protein\n\nAssumptions: Calculated based on standard portion weights with 30g toast. Adjust values below if needed!).\n 3. Standard Reference: If the user provides a count without a weight (e.g., \"1 egg\", \"1 apple\"), you MUST use standard USDA reference sizes (e.g., 1 Large Egg = ~50g, ~70-72 kcal). NEVER default to 100g unless the user explicitly types \"100g\".\n 4. Text-Primary Verification: Prioritize the user's text description for the actual portion size consumed. Use the image to identify the food items and preparation method, but rely on the text for the quantity.\n 5. Output: Provide realistic, research-backed estimates for Calories, Protein (g), Carbohydrates (g), and Fat (g) representing the sum of all identified items.\n\nSTRICT JSON OUTPUT REQUIREMENT:\nAlways respond with ONLY a clean, raw, valid JSON object matching the requested schema. Do NOT wrap the JSON in markdown code blocks, HTML tags, or any other conversational wrapper text. Start directly with '{' and end with '}'..",
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
                  description: "Estimated sum of total calories in kcal of all food items identified."
                },
                protein: {
                  type: Type.INTEGER,
                  description: "Estimated sum of total protein content in grams."
                },
                carbs: {
                  type: Type.INTEGER,
                  description: "Estimated sum of total carbohydrates in grams."
                },
                fat: {
                  type: Type.INTEGER,
                  description: "Estimated sum of total fat in grams."
                },
                confidence: {
                  type: Type.NUMBER,
                  description: "Nutritionist confidence score from 0.0 to 1.0 based on description specificity or image quality."
                },
                description: {
                  type: Type.STRING,
                  description: "A clear, itemized line-by-line bullet-point breakdown of each identified food item, portion size, calories, and protein content, followed by assumption explanation."
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

  // Basic flags for preparation modifiers
  const isFried = text.includes("fried") || text.includes("prito") || text.includes("pangat") || text.includes("crispy") || text.includes("batter");
  const isGrilled = text.includes("grilled") || text.includes("inihaw") || text.includes("sinugba") || text.includes("inasal");
  const isBoiled = text.includes("boiled") || text.includes("nilaga") || text.includes("steamed") || text.includes("pinakuluan") || text.includes("sabaw") || text.includes("lomi");

  // Local fallback nutrition DB mapping
  const fallbackNutritionDB = [
    {
      keys: ["pork lomi", "lomi bowl", "lomi"],
      name: "Pork Lomi",
      servingUnit: "bowl",
      servingSize: 1,
      defaultGramWeight: 400,
      macros: {
        default: { kcal: 420, p: 24, c: 48, f: 14 }
      }
    },
    {
      keys: ["pancit palabok", "palabok"],
      name: "Pancit Palabok",
      servingUnit: "serving",
      servingSize: 1,
      defaultGramWeight: 250,
      macros: {
        default: { kcal: 350, p: 12, c: 55, f: 10 }
      }
    },
    {
      keys: ["chicken inasal", "inasal"],
      name: "Chicken Inasal",
      servingUnit: "serving",
      servingSize: 1,
      defaultGramWeight: 150,
      macros: {
        default: { kcal: 290, p: 30, c: 1, f: 18 }
      }
    },
    {
      keys: ["pork sisig", "sisig"],
      name: "Pork Sisig",
      servingUnit: "serving",
      servingSize: 1,
      defaultGramWeight: 150,
      macros: {
        default: { kcal: 450, p: 22, c: 4, f: 39 }
      }
    },
    {
      keys: ["fried chicken", "crispy chicken"],
      name: "Fried Chicken",
      servingUnit: "piece",
      servingSize: 1,
      defaultGramWeight: 120,
      macros: {
        default: { kcal: 250, p: 19, c: 10, f: 15 }
      }
    },
    {
      keys: ["milk tea", "milktea", "boba"],
      name: "Medium Milk Tea (Customized/Low Sugar)",
      servingUnit: "serving",
      servingSize: 1,
      defaultGramWeight: 470,
      macros: {
        default: { kcal: 180, p: 2, c: 28, f: 6 }
      }
    },
    {
      keys: ["chicken breast", "chicken breast fillet"],
      name: "Chicken Breast",
      servingUnit: "g",
      servingSize: 100,
      defaultGramWeight: 100,
      macros: {
        default: { kcal: 165, p: 31, c: 0, f: 3.6 },
        fried: { kcal: 220, p: 29, c: 4, f: 10 },
        grilled: { kcal: 170, p: 31, c: 0, f: 5 },
        boiled: { kcal: 150, p: 31, c: 0, f: 2.5 }
      }
    },
    {
      keys: ["chicken", "manok"],
      name: "Chicken",
      servingUnit: "g",
      servingSize: 100,
      defaultGramWeight: 100,
      macros: {
        default: { kcal: 190, p: 27, c: 0, f: 8 },
        fried: { kcal: 250, p: 24, c: 8, f: 15 },
        grilled: { kcal: 180, p: 27, c: 0, f: 7 },
        boiled: { kcal: 160, p: 28, c: 0, f: 4 }
      }
    },
    {
      keys: ["egg", "eggs", "itlog"],
      name: "Large Egg",
      servingUnit: "piece",
      servingSize: 1,
      defaultGramWeight: 50,
      macros: {
        default: { kcal: 72, p: 6.3, c: 0.4, f: 5 },
        boiled: { kcal: 72, p: 6.3, c: 0.4, f: 5 },
        fried: { kcal: 90, p: 6.3, c: 0.4, f: 7 }
      }
    },
    {
      keys: ["beef", "baka", "steak", "ground beef", "lean beef"],
      name: "Lean Beef",
      servingUnit: "g",
      servingSize: 100,
      defaultGramWeight: 100,
      macros: {
        default: { kcal: 250, p: 26, c: 0, f: 15 },
        boiled: { kcal: 200, p: 28, c: 0, f: 9 },
        steamed: { kcal: 200, p: 28, c: 0, f: 9 },
        fried: { kcal: 280, p: 25, c: 0, f: 20 },
        grilled: { kcal: 240, p: 27, c: 0, f: 14 }
      }
    },
    {
      keys: ["white rice", "jasmine rice", "rice", "kanin"],
      name: "White Rice",
      servingUnit: "cup",
      servingSize: 1,
      defaultGramWeight: 150,
      macros: {
        default: { kcal: 205, p: 4.2, c: 44.5, f: 0.4 },
        boiled: { kcal: 205, p: 4.2, c: 44.5, f: 0.4 },
        fried: { kcal: 280, p: 6, c: 46, f: 8 } // Sinangag / Fried Rice
      }
    },
    {
      keys: ["whey protein", "whey", "protein powder", "scoop", "whey scoop"],
      name: "Whey Protein",
      servingUnit: "scoop",
      servingSize: 1,
      defaultGramWeight: 30,
      macros: {
        default: { kcal: 120, p: 24, c: 3, f: 1.5 }
      }
    },
    {
      keys: ["watermelon", "pakwan"],
      name: "Watermelon",
      servingUnit: "cup",
      servingSize: 1,
      defaultGramWeight: 150,
      macros: {
        default: { kcal: 46, p: 0.9, c: 11, f: 0.2 }
      }
    },
    {
      keys: ["black coffee", "espresso", "americano", "coffee", "kape"],
      name: "Black Coffee",
      servingUnit: "cup",
      servingSize: 1,
      defaultGramWeight: 240,
      macros: {
        default: { kcal: 2, p: 0.3, c: 0, f: 0 }
      }
    },
    {
      keys: ["pork", "baboy", "porkchop", "liempo", "pork loin"],
      name: "Pork",
      servingUnit: "g",
      servingSize: 100,
      defaultGramWeight: 100,
      macros: {
        default: { kcal: 240, p: 27, c: 0, f: 14 },
        fried: { kcal: 290, p: 25, c: 0, f: 21 },
        grilled: { kcal: 250, p: 26, c: 0, f: 16 }
      }
    },
    {
      keys: ["fish", "isda", "salmon", "tilapia", "tuna", "tuna flakes"],
      name: "Fish/Salmon",
      servingUnit: "g",
      servingSize: 100,
      defaultGramWeight: 100,
      macros: {
        default: { kcal: 185, p: 21, c: 0, f: 9 },
        fried: { kcal: 230, p: 20, c: 2, f: 15 },
        steamed: { kcal: 140, p: 21, c: 0, f: 5 },
        boiled: { kcal: 140, p: 21, c: 0, f: 5 }
      }
    },
    {
      keys: ["banana", "saging", "bananas"],
      name: "Banana",
      servingUnit: "piece",
      servingSize: 1,
      defaultGramWeight: 120,
      macros: {
        default: { kcal: 105, p: 1.3, c: 27, f: 0.4 }
      }
    },
    {
      keys: ["apple", "mansanas", "apples"],
      name: "Apple",
      servingUnit: "piece",
      servingSize: 1,
      defaultGramWeight: 150,
      macros: {
        default: { kcal: 78, p: 0.5, c: 21, f: 0.3 }
      }
    },
    {
      keys: ["oats", "oatmeal", "quaker oats", "rolled oats"],
      name: "Oats",
      servingUnit: "g",
      servingSize: 50,
      defaultGramWeight: 50,
      macros: {
        default: { kcal: 195, p: 8.5, c: 33, f: 3.5 }
      }
    },
    {
      keys: ["bread", "tinapay", "whole wheat bread", "slice", "slices"],
      name: "Slice of Bread",
      servingUnit: "slice",
      servingSize: 1,
      defaultGramWeight: 30,
      macros: {
        default: { kcal: 80, p: 2.7, c: 15, f: 1 }
      }
    },
    {
      keys: ["potato", "patatas", "potatoes", "sweet potato", "kamote"],
      name: "Potato",
      servingUnit: "g",
      servingSize: 150,
      defaultGramWeight: 150,
      macros: {
        default: { kcal: 115, p: 3, c: 26, f: 0.1 }
      }
    },
    {
      keys: ["milk", "gatas", "fresh milk", "cow milk"],
      name: "Milk",
      servingUnit: "cup",
      servingSize: 1,
      defaultGramWeight: 240,
      macros: {
        default: { kcal: 120, p: 8, c: 11, f: 5 }
      }
    },
    {
      keys: ["avocado", "abocado"],
      name: "Avocado",
      servingUnit: "piece",
      servingSize: 1,
      defaultGramWeight: 150,
      macros: {
        default: { kcal: 240, p: 3, c: 13, f: 22 }
      }
    },
    {
      keys: ["peanut butter", "peanut butter", "butter"],
      name: "Peanut Butter",
      servingUnit: "serving",
      servingSize: 1,
      defaultGramWeight: 32,
      macros: {
        default: { kcal: 190, p: 8, c: 6, f: 16 }
      }
    }
  ];

  let matchedFoods: string[] = [];
  let totalKcal = 0;
  let totalP = 0;
  let totalC = 0;
  let totalF = 0;
  let foundAny = false;

  let textToSearch = text;

  fallbackNutritionDB.forEach(item => {
    let matchedKey: string | null = null;
    for (const key of item.keys) {
      if (textToSearch.includes(key)) {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey) {
      foundAny = true;
      let chosenMacros = item.macros.default;
      let modifierName = "";

      if (isFried && item.macros.fried) {
        chosenMacros = item.macros.fried;
        modifierName = "Fried";
      } else if (isGrilled && item.macros.grilled) {
        chosenMacros = item.macros.grilled;
        modifierName = "Grilled";
      } else if (isBoiled && item.macros.boiled) {
        chosenMacros = item.macros.boiled;
        modifierName = "Boiled";
      } else if (isBoiled && item.macros.steamed) {
        chosenMacros = item.macros.steamed;
        modifierName = "Steamed";
      }

      let quantity = 1;
      let hasCustomQuantity = false;

      // 1. Weight or Volumetric match (e.g. 150g, 200 grams, 250ml)
      const weightMatch = textToSearch.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?|ml)\b/i);
      if (weightMatch) {
        const value = parseFloat(weightMatch[1]);
        if (!isNaN(value) && value > 0) {
          if (item.servingUnit === "g" || item.servingUnit === "ml") {
            quantity = value / item.servingSize;
          } else {
            const defaultWeight = item.defaultGramWeight || 100;
            quantity = value / defaultWeight;
          }
          hasCustomQuantity = true;
        }
      }

      // 2. Continuous unit match (e.g. 2 cups, 1.5 scoops, 3 slices)
      if (!hasCustomQuantity) {
        const unitMatch = textToSearch.match(/(\d+(?:\.\d+)?)\s*(?:cups?|scoops?|slices?|bowls?|portions?|servings?|plates?|pieces?|pcs?)\b/i);
        if (unitMatch) {
          const value = parseFloat(unitMatch[1]);
          if (!isNaN(value) && value > 0) {
            quantity = value;
            hasCustomQuantity = true;
          }
        }
      }

      // 3. Preceding digit count check (e.g. "2 eggs", "1 chicken inasal")
      if (!hasCustomQuantity) {
        const adjectivePattern = "(?:fried|boiled|grilled|steamed|raw|cooked|baked|large|medium|small|scoop\\s+of|cup\\s+of|slice\\s+of)?\\s*(?:pieces?|pcs?|of)?\\s*";
        const precedingNumRegex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${adjectivePattern}${matchedKey}`, 'i');
        const numMatch = textToSearch.match(precedingNumRegex);
        if (numMatch) {
          const value = parseFloat(numMatch[1]);
          if (!isNaN(value) && value > 0) {
            quantity = value;
            hasCustomQuantity = true;
          }
        }
      }

      // 4. Preceding literal text check (e.g. "one slice egg", "two inasal")
      if (!hasCustomQuantity) {
        const wordNumberMap: Record<string, number> = { "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "a": 1, "an": 1 };
        const wordPattern = "(one|two|three|four|five|a|an)";
        const adjectivePattern = "(?:fried|boiled|grilled|steamed|raw|cooked|baked|large|medium|small|scoop\\s+of|cup\\s+of|slice\\s+of)?\\s*(?:pieces?|pcs?|of)?\\s*";
        const precedingWordRegex = new RegExp(`\\b${wordPattern}\\s*${adjectivePattern}${matchedKey}`, 'i');
        const wordMatch = textToSearch.match(precedingWordRegex);
        if (wordMatch) {
          const word = wordMatch[1].toLowerCase();
          if (wordNumberMap[word]) {
            quantity = wordNumberMap[word];
            hasCustomQuantity = true;
          }
        }
      }

      totalKcal += Math.round(chosenMacros.kcal * quantity);
      totalP += Math.round(chosenMacros.p * quantity);
      totalC += Math.round(chosenMacros.c * quantity);
      totalF += Math.round(chosenMacros.f * quantity);

      let portionLabel = "";
      if (hasCustomQuantity) {
        if (item.servingUnit === "g" || item.servingUnit === "ml") {
          portionLabel = `${Math.round(quantity * item.servingSize)}${item.servingUnit}`;
        } else {
          portionLabel = `${quantity}x`;
        }
      } else {
        portionLabel = `1 Standard ${item.servingUnit === "g" ? "100g" : item.servingUnit}`;
      }

      let displayItemName = item.name;
      if (modifierName) {
        displayItemName += ` (${modifierName})`;
      }

      matchedFoods.push(`${portionLabel} ${displayItemName}`);
      textToSearch = textToSearch.replace(matchedKey, "MATCHED_TOKEN");
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

  const finalName = matchedFoods.join(" & ");
  return {
    itemName: finalName,
    calories: totalKcal,
    protein: totalP,
    carbs: totalC,
    fat: totalF,
    confidence: 0.8,
    description: "⚠️ Local fallback estimate (Google Gemini API free tier limit or rate limit exceeded). Extrapolated: " + finalName + "."
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
