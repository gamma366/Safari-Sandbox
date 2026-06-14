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
                          triggers_regeneration: { type: Type.BOOLEAN },
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
                    permit_extension: {
                      type: Type.OBJECT,
                      properties: {
                        park: { type: Type.STRING },
                        days: { type: Type.INTEGER },
                        reasoning: { type: Type.STRING }
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
            res.status(500).json({ error: "Itinerary Generation Error: Failed to parse complete itinerary data from the system." });
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
                    triggers_regeneration: { type: Type.BOOLEAN },
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
              permit_extension: {
                type: Type.OBJECT,
                properties: {
                  park: { type: Type.STRING },
                  days: { type: Type.INTEGER },
                  reasoning: { type: Type.STRING }
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
          res.status(500).json({ error: "Failed to parse the extra day response from the system." });
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

  app.post("/api/regenerate-forward", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Server Configuration Error: GEMINI_API_KEY environment variable is not set." });
      }

      const { lockedDays, originalTotalDays, remainingOriginalDays, interests, season, flightPref } = req.body;
      
      const lastLockedDay = lockedDays[lockedDays.length - 1];
      const newTotalDays = originalTotalDays + 1; // Assuming we add one day for the delay
      
      const prompt = `
        You are an expert Safari Planner. The user changed their itinerary on Day ${lastLockedDay.day}.
        They now end Day ${lastLockedDay.day} at "${lastLockedDay.to}".
        
        The new total length of the safari is ${newTotalDays} days (we added one extra day to accommodate this change).
        You must generate the REMAINING days (from Day ${lastLockedDay.day + 1} to Day ${newTotalDays}).
        
        CRITICAL REQUIREMENTS:
        - Generate exactly ${newTotalDays - lastLockedDay.day} remaining days.
        - Start Day ${lastLockedDay.day + 1} from "${lastLockedDay.to}".
        - Follow the standard logic for reaching Ngorongoro and Serengeti. If they are in Tarangire, they likely need to go to Ngorongoro Conservation Area or Karatu next.
        - End the final day at Arusha, Kilimanjaro, or Zanzibar.
        - IMPORTANT: Provide the response as a JSON array containing ONLY the remaining days objects (no summary object, just the array of days).
        - ALTERNATIVES: You MUST provide at least 3 distinct and rich alternative route options or experiences for EACH DAY. 
        - EXTRA NIGHT RULE (STRICT MANDATE): For EVERY SINGLE DAY in the itinerary where the destination (or main park) is NOT Karatu AND it is not the final day of the safari, you ABSOLUTELY MUST include one alternative option to "Spend an extra night in [Location]". The title MUST include "(Adds 1 Day)". The reasoning MUST explicitly mention: "Warning: This will automatically add an extra day to your itinerary to accommodate the change." You MUST set \`triggers_regeneration: true\` on this specific alternative object. This applies to Serengeti, Ngorongoro, Tarangire, etc. Do not skip this!
        
        PRESERVE THE ORIGINAL PLAN AS MUCH AS POSSIBLE:
        The customer had an original plan for the remaining days. You must keep the original lodges, activities, and routing as much as possible. Since we added a day, you will likely just need to shift the original plan forward by 1 day, while smoothing out the connection from the new "${lastLockedDay.to}".
        Here is the original rest of the itinerary they had:
        ${JSON.stringify(remainingOriginalDays, null, 2)}
        
        - Match this schema for each day: 
        { "day": number, "from": string, "to": string, "drive_time": string, "departure_time": string, "activities": string[], "detailed_description": string, "reasoning": string, "expert_tip": string, "lodge": { "name": string, "category": string, "price_range": string, "inside_park": boolean }, "alternatives": [...] }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
        config: {
          maxOutputTokens: 25000,
          responseMimeType: "application/json",
          responseSchema: {
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
                      triggers_regeneration: { type: Type.BOOLEAN },
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
                permit_extension: {
                  type: Type.OBJECT,
                  properties: {
                    park: { type: Type.STRING },
                    days: { type: Type.INTEGER },
                    reasoning: { type: Type.STRING }
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
        }
      });

      if (response.text) {
        let text = response.text.trim();
        const jsonMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          text = jsonMatch[1].trim();
        }
        res.json(JSON.parse(text));
      } else {
        res.status(500).json({ error: "Failed to generate remaining days." });
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(error.status || 500).json({ 
        error: error.message || "An error occurred while generating remaining days."
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
