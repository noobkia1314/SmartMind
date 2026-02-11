
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfileStats } from "../types.ts";

export class GeminiService {
  // Always create a new GoogleGenAI instance inside method calls as per guidelines
  private getClient() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("Gemini API Key is missing from process.env.API_KEY.");
    }
    return new GoogleGenAI({ apiKey: apiKey || "" });
  }

  // Use gemini-3-pro-preview for complex structure generation and reasoning
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
      // Correctly access .text property directly
      const text = response.text;
      return JSON.parse(text?.trim() || '{}');
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }

  // Basic information retrieval, gemini-3-flash-preview is suitable
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
      // Correctly access .text property directly
      const text = response.text;
      return JSON.parse(text?.trim() || '{"calories": 0, "protein": 0}');
    } catch (error) {
      console.error("Nutrition calculation failed:", error);
      return { calories: 0, protein: 0 };
    }
  }

  // Use gemini-3-pro-preview for complex multi-rule mathematical calculations
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
      // Correctly access .text property directly
      const text = response.text;
      const data = JSON.parse(text?.trim() || '{"caloriesBurned": 0}');
      return data;
    } catch (error) {
      console.error("Exercise calculation failed:", error);
      return { caloriesBurned: 0 };
    }
  }

  // Strategic coaching advice requires advanced reasoning, use gemini-3-pro-preview
  async getCoachAdvice(dataSummary: string) {
    const ai = this.getClient();
    const prompt = `As a professional high-performance AI coach, analyze this data summary:
    ${dataSummary}
    Provide strategic advice in Markdown format with headings, bullet points, and highlights.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    // Correctly access .text property directly
    return response.text;
  }
}
