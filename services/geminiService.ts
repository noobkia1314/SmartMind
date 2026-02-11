
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfileStats } from "../types.ts";

export class GeminiService {
  private getClient() {
    // Priority: 1. User-set key in localStorage 2. Environment variable
    const localStorageKey = localStorage.getItem("GEMINI_API_KEY");
    const envKey = (process.env as any).API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
    const apiKey = localStorageKey || envKey;

    console.log("Gemini API Key source:", localStorageKey ? "localStorage" : (envKey ? "env var" : "missing"));
    console.log("Gemini API Key value:", apiKey ? `${apiKey.slice(0, 10)}...` : "missing");

    if (!apiKey) {
      console.warn("Gemini API Key is missing. Please set GEMINI_API_KEY in localStorage or provide process.env.API_KEY.");
    }

    // Creating a fresh instance to ensure the latest API key is used
    return new GoogleGenAI({ apiKey: apiKey || "" });
  }

  async generateGoalStructure(goal: string) {
    const ai = this.getClient();
    const prompt = `Generate a comprehensive personal development plan for the goal: "${goal}".
    Return a JSON structure including:
    1. A mind map (tree structure with id and label).
    2. A list of 7 initial daily tasks to get started.
    
    Response format must be valid JSON:
    {
      "mindMap": { "id": "root", "label": "Goal Name", "children": [...] },
      "tasks": [{ "title": "Task Name", "category": "Category" }]
    }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mindMap: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING },
                  children: { 
                    type: Type.ARRAY, 
                    items: { 
                      type: Type.OBJECT, 
                      properties: { id: { type: Type.STRING }, label: { type: Type.STRING } },
                      required: ['id', 'label']
                    } 
                  }
                },
                required: ['id', 'label', 'children']
              },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    category: { type: Type.STRING }
                  },
                  required: ['title', 'category']
                }
              }
            },
            required: ['mindMap', 'tasks']
          }
        }
      });
      return JSON.parse(response.text?.trim() || '{}');
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }

  async calculateNutrition(food: string) {
    const ai = this.getClient();
    const prompt = `Calculate estimated calories and protein for: "${food}".`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER }
            },
            required: ['calories', 'protein']
          }
        }
      });
      return JSON.parse(response.text?.trim() || '{"calories": 0, "protein": 0}');
    } catch (error) {
      console.error("Nutrition calculation failed:", error);
      return { calories: 0, protein: 0 };
    }
  }

  async calculateExercise(exercise: string, value: number, unit: string, stats: UserProfileStats) {
    const ai = this.getClient();
    const prompt = `Precisely calculate calories burned for: "${exercise}" volume: ${value} ${unit}.
    User Physical Stats: Age ${stats.age}, ${stats.gender}, ${stats.height}cm, ${stats.weight}kg, Activity ${stats.activityLevel}.
    Return the result as a single integer for "caloriesBurned".`;
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              caloriesBurned: { type: Type.NUMBER }
            },
            required: ['caloriesBurned']
          }
        }
      });
      const data = JSON.parse(response.text?.trim() || '{"caloriesBurned": 0}');
      return data;
    } catch (error) {
      console.error("Exercise calculation failed:", error);
      return { caloriesBurned: 0 };
    }
  }

  async getCoachAdvice(dataSummary: string) {
    const ai = this.getClient();
    const prompt = `As a professional high-performance AI coach, analyze this data summary:
    ${dataSummary}
    Provide strategic advice in Markdown format with headings, bullet points, and highlights.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text;
  }
}
