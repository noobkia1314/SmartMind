
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfileStats } from "../types";

const getApiKey = () => {
  const storedKey = localStorage.getItem('GEMINI_API_KEY');
  const envKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  return storedKey || envKey || '';
};

export class GeminiService {
  private getClient() {
    const key = getApiKey();
    if (!key) {
      throw new Error("Gemini API Key is missing.");
    }
    return new GoogleGenAI({ apiKey: key });
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
        model: 'gemini-3-flash-preview',
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
      return JSON.parse(response.text || '{}');
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
          responseMimeType: 'application/json',
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
      return JSON.parse(response.text || '{"calories": 0, "protein": 0}');
    } catch (error) {
      console.error("Nutrition calculation failed:", error);
      return { calories: 0, protein: 0 };
    }
  }

  async calculateExercise(exercise: string, value: number, unit: string, stats: UserProfileStats) {
    const ai = this.getClient();
    const prompt = `Calculate calories burned for exercise: "${exercise}" volume: ${value} ${unit}.
    User Profile:
    - Age: ${stats.age}
    - Gender: ${stats.gender}
    - Height: ${stats.height}cm
    - Weight: ${stats.weight}kg
    - Activity Level: ${stats.activityLevel}
    
    Use Harris-Benedict BMR and MET values to calculate precisely. Return as an integer.`;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              caloriesBurned: { type: Type.NUMBER }
            },
            required: ['caloriesBurned']
          }
        }
      });
      const data = JSON.parse(response.text || '{"caloriesBurned": 0}');
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
    
    Provide strategic advice in Markdown format. Use:
    - Clear headings
    - Bullet points for actionable items
    - **Bold** for highlights
    Keep it encouraging but firm.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text;
  }
}
