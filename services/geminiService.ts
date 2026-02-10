
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateGoalStructure(goal: string) {
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
      const response = await this.ai.models.generateContent({
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
                  children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, label: { type: Type.STRING } } } }
                }
              },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    category: { type: Type.STRING }
                  }
                }
              }
            }
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
    const prompt = `Calculate estimated calories and protein for: "${food}". 
    Return JSON: { "calories": number, "protein": number }`;
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{"calories": 0, "protein": 0}');
  }

  async calculateExercise(exercise: string, duration: number) {
    const prompt = `Calculate estimated calories burned for: "${exercise}" done for ${duration} minutes. 
    Return JSON: { "caloriesBurned": number }`;
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(response.text || '{"caloriesBurned": 0}');
  }

  async getCoachAdvice(dataSummary: string) {
    const prompt = `As a professional high-performance AI coach, analyze this data summary:
    ${dataSummary}
    
    Provide strategic advice in Markdown format. Use:
    - Clear headings
    - Bullet points for actionable items
    - **Bold** for highlights
    Keep it encouraging but firm.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    return response.text;
  }
}
