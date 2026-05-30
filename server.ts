import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini Setup
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY environment variable is missing. You must set this in your deployment environment (e.g., Render) for the app to work.");
  }
  
  const ai = new GoogleGenAI({
    apiKey: apiKey || "MISSING_KEY", // Provide a dummy string to prevent the SDK from trying to use Google Cloud Default Credentials
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API routes
  app.post("/api/itinerary", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Server Configuration Error: GEMINI_API_KEY environment variable is not set. Please set it in your deployment environment variables on Render." });
      }

      const { days, interests, season, flightPref, prompt } = req.body;
      
      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          maxOutputTokens: 25000,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.OBJECT,
                properties: {
                  total_days: { type: Type.INTEGER },
                  route_overview: { type: Type.STRING },
                  best_for: { type: Type.ARRAY, items: { type: Type.STRING } },
                  flight_logic_summary: { type: Type.STRING }
                },
                required: ["total_days", "route_overview", "best_for", "flight_logic_summary"]
              },
              itinerary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.INTEGER },
                    from: { type: Type.STRING },
                    to: { type: Type.STRING },
                    drive_time: { type: Type.STRING },
                    departure_time: { type: Type.STRING },
                    activities: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    detailed_description: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                    expert_tip: { type: Type.STRING },
                    alternatives: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                          reasoning: { type: Type.STRING },
                          new_to: { type: Type.STRING },
                          new_from: { type: Type.STRING },
                          cascaded_next_day_description: { type: Type.STRING },
                          cascaded_next_day_reasoning: { type: Type.STRING },
                          cascaded_next_day_tip: { type: Type.STRING },
                          new_lodge: {
                            type: Type.OBJECT,
                            properties: {
                              name: { type: Type.STRING },
                              category: { type: Type.STRING },
                              price_range: { type: Type.STRING },
                              inside_park: { type: Type.BOOLEAN }
                            },
                            required: ["name", "category", "price_range", "inside_park"]
                          },
                          new_activities: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                          }
                        },
                        required: ["title", "description", "reasoning", "new_lodge", "new_activities"]
                      }
                    },
                    permit_entry: {
                      type: Type.OBJECT,
                      properties: {
                        gate: { type: Type.STRING },
                        time: { type: Type.STRING }
                      }
                    },
                    permit_exit_deadline: {
                      type: Type.OBJECT,
                      properties: {
                        gate: { type: Type.STRING },
                        time: { type: Type.STRING }
                      }
                    },
                    permit_advisory: { type: Type.STRING },
                    lodge: { 
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        category: { type: Type.STRING },
                        price_range: { type: Type.STRING },
                        inside_park: { type: Type.BOOLEAN }
                      },
                      required: ["name", "category", "price_range", "inside_park"]
                    }
                  },
                  required: ["day", "from", "to", "drive_time", "departure_time", "activities", "lodge", "detailed_description", "reasoning", "expert_tip", "alternatives"]
                }
              },
              pricing_estimate: {
                type: Type.OBJECT,
                properties: {
                  park_fees: { type: Type.NUMBER },
                  lodging: { type: Type.NUMBER },
                  transport: { type: Type.NUMBER },
                  total_estimate: { type: Type.NUMBER },
                  total_range: { type: Type.STRING },
                  lodging_avg: { type: Type.STRING }
                },
                required: ["park_fees", "lodging", "transport", "total_estimate", "total_range", "lodging_avg"]
              }
            },
            required: ["summary", "itinerary", "pricing_estimate"]
          }
        }
      });

      if (response.text) {
        let text = response.text.trim();
        // Extract JSON if it's wrapped in markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          text = jsonMatch[1].trim();
        }
        try {
          res.json(JSON.parse(text));
        } catch (parseError: any) {
          console.error("JSON Parse Error:", parseError, "Text excerpt:", text.substring(0, 100) + "...");
          if (parseError.message.includes("Unterminated string") || parseError.message.includes("Unexpected end")) {
            res.status(500).json({ error: "Itinerary Generation Error: The generated itinerary got too long and was cut off. Please try generating a shorter itinerary (fewer days or simpler rules)." });
          } else {
            res.status(500).json({ error: "Itinerary Generation Error: Failed to parse complete itinerary data from the AI." });
          }
        }
      } else {
        res.status(500).json({ error: "Failed to generate itinerary. Please try again." });
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(error.status || 500).json({ 
        error: error.message || "An error occurred while generating the itinerary.",
        status: error.status
      });
    }
  });

  app.post("/api/add-day", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Server Configuration Error: GEMINI_API_KEY environment variable is not set. Please set it in your deployment environment variables on Render." });
      }

      const { currentItinerary, interests, season, flightPref } = req.body;
      
      const lastDay = currentItinerary[currentItinerary.length - 1];
      
      const prompt = `
        You are an expert Safari Planner. The user wants to add ONE EXTRA DAY at the end of their existing ${currentItinerary.length}-day safari.
        
        Currently, on the last day (Day ${lastDay.day}), they end up at: ${lastDay.to}.
        
        CRITICAL REQUIREMENT:
        - Generate exactly ONE new day (Day ${lastDay.day + 1}).
        - The day must start from where they were (from: "${lastDay.to}").
        - DO NOT leave the guest in any park or Karatu at the end of this final day. 
        - The destination ("to") MUST be a logical final departure point: e.g., Arusha, Kilimanjaro (JRO), or Zanzibar (if flight).
        - They can fly or drive depending on their location and preference (flight_pref: ${flightPref}).
        - Provide rich alternatives for this extra day! E.g., if finishing in Arusha, provide alternatives like an "Overnight in Arusha (Relaxing)" or "Day trip to Arusha National Park", or "Direct flight to Zanzibar". Do not assume they have to fly out from JRO immediately; returning to Arusha for an overnight stay is perfectly valid.
        - Include logical activities for the transfer/flight day.
        
        IMPORTANT: Keep descriptions, reasoning, and expert_tips highly concise (1-2 sentences maximum) to prevent truncation errors.
        
        Provide the response in the exact same format as a single day in the itinerary array.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          maxOutputTokens: 25000,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.INTEGER },
              from: { type: Type.STRING },
              to: { type: Type.STRING },
              drive_time: { type: Type.STRING },
              departure_time: { type: Type.STRING },
              activities: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              detailed_description: { type: Type.STRING },
              reasoning: { type: Type.STRING },
              expert_tip: { type: Type.STRING },
              alternatives: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    reasoning: { type: Type.STRING },
                    new_to: { type: Type.STRING },
                    new_from: { type: Type.STRING },
                    cascaded_next_day_description: { type: Type.STRING },
                    cascaded_next_day_reasoning: { type: Type.STRING },
                    cascaded_next_day_tip: { type: Type.STRING },
                    new_lodge: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        category: { type: Type.STRING },
                        price_range: { type: Type.STRING },
                        inside_park: { type: Type.BOOLEAN }
                      },
                      required: ["name", "category", "price_range", "inside_park"]
                    },
                    new_activities: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["title", "description", "reasoning", "new_lodge", "new_activities"]
                }
              },
              permit_entry: {
                type: Type.OBJECT,
                properties: {
                  gate: { type: Type.STRING },
                  time: { type: Type.STRING }
                }
              },
              permit_exit_deadline: {
                type: Type.OBJECT,
                properties: {
                  gate: { type: Type.STRING },
                  time: { type: Type.STRING }
                }
              },
              permit_advisory: { type: Type.STRING },
              lodge: { 
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  category: { type: Type.STRING },
                  price_range: { type: Type.STRING },
                  inside_park: { type: Type.BOOLEAN }
                },
                required: ["name", "category", "price_range", "inside_park"]
              }
            },
            required: ["day", "from", "to", "drive_time", "departure_time", "activities", "lodge", "detailed_description", "reasoning", "expert_tip", "alternatives"]
          }
        }
      });

      if (response.text) {
        let text = response.text.trim();
        const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          text = jsonMatch[1].trim();
        }
        try {
          res.json(JSON.parse(text));
        } catch (parseError: any) {
          console.error("JSON Parse Error:", parseError);
          res.status(500).json({ error: "Failed to parse the extra day response from AI." });
        }
      } else {
        res.status(500).json({ error: "Failed to generate extra day." });
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(error.status || 500).json({ 
        error: error.message || "An error occurred while generating the extra day."
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
