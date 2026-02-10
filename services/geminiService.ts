
import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  // Check localStorage first as it's the primary way users configure it in this app
  const storedKey = localStorage.getItem('GEMINI_API_KEY');
  // Fallback to environment variable if injected
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

  async calculateExercise(exercise: string, value: number, unit: string) {
    const ai = this.getClient();
    const prompt = `Calculate estimated calories burned for: "${exercise}" with a volume of ${value} ${unit}. Use MET values for time-based exercise and standard metabolic equivalents for strength training/reps. Return only the caloriesBurned as an integer.`;
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
      return JSON.parse(response.text || '{"caloriesBurned": 0}');
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
