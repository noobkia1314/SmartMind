
import { UserProfileStats } from "../types.ts";
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private async callGemini(params: {
    prompt: string;
    model?: string;
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
  }) {
    // Priority: Local Storage (Manual Input) > Environment Variable
    const savedKey = localStorage.getItem("GEMINI_API_KEY");
    const apiKey = savedKey || process.env.API_KEY;

    if (!apiKey) {
      throw new Error("請先在右下角設定您的 Gemini API Key。");
    }

    console.log("Calling Gemini with key: " + apiKey.slice(0, 10) + "...");

    const ai = new GoogleGenAI({ apiKey });
    
    const baseSystemInstruction = "你是 SmartMind AI 教練，用中文生成結構化目標藍圖、每日任務、mind map 等內容。回覆清晰、鼓勵性強、格式易讀。";
    const systemInstruction = params.systemInstruction 
      ? `${baseSystemInstruction} ${params.systemInstruction}`
      : baseSystemInstruction;

    try {
      const response = await ai.models.generateContent({
        model: params.model || "gemini-3-flash-preview",
        contents: params.prompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          responseMimeType: params.responseMimeType || "text/plain",
          responseSchema: params.responseSchema,
        },
      });

      const content = response.text;
      if (!content) {
        throw new Error("AI 回傳了空的內容，請重試。");
      }

      if (params.responseMimeType === "application/json") {
        try {
          return JSON.parse(content.trim());
        } catch (e) {
          console.error("Failed to parse JSON from Gemini:", content);
          throw new Error("AI 回傳格式錯誤，請再試一次。");
        }
      }
      return content;
    } catch (err: any) {
      console.error("Gemini Error:", err);
      if (err.message?.includes("429") || err.message?.includes("quota")) {
        throw new Error("Gemini 額度用完，請稍後再試或更換 API Key。");
      }
      if (err.message?.includes("400") || err.message?.includes("401") || err.message?.includes("API_KEY_INVALID")) {
        throw new Error("API Key 無效或已過期，請重新輸入。");
      }
      throw new Error("生成計畫失敗，請檢查網路及 API Key 設定。");
    }
  }

  async generateGoalStructure(goal: string) {
    const prompt = `為目標 "${goal}" 生成一份全面的個人發展計畫。回傳包含 mindMap 和 tasks 的 JSON。`;
    
    const schema = {
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
                properties: {
                  id: { type: Type.STRING },
                  label: { type: Type.STRING }
                },
                required: ["id", "label"]
              }
            }
          },
          required: ["id", "label"]
        },
        tasks: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING }
            },
            required: ["title", "category"]
          }
        }
      },
      required: ["mindMap", "tasks"]
    };

    return await this.callGemini({
      prompt,
      model: "gemini-3-pro-preview",
      responseMimeType: "application/json",
      responseSchema: schema
    });
  }

  async calculateNutrition(food: string) {
    const prompt = `估算 "${food}" 的卡路里和蛋白質含量。`;
    const schema = {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER }
      },
      required: ["calories", "protein"]
    };

    try {
      return await this.callGemini({
        prompt,
        model: "gemini-3-flash-preview",
        responseMimeType: "application/json",
        responseSchema: schema
      });
    } catch (error) {
      console.error("Nutrition calculation failed:", error);
      return { calories: 0, protein: 0 };
    }
  }

  async calculateExercise(exercise: string, value: number, unit: string, stats: UserProfileStats) {
    const prompt = `計算運動：${exercise}, 數值：${value} ${unit}。
    用戶數據：年齡 ${stats.age}, ${stats.gender}, 身高 ${stats.height}cm, 體重 ${stats.weight}kg, 活動等級 ${stats.activityLevel}。`;
    
    const schema = {
      type: Type.OBJECT,
      properties: {
        caloriesBurned: { type: Type.NUMBER }
      },
      required: ["caloriesBurned"]
    };

    try {
      return await this.callGemini({
        prompt,
        model: "gemini-3-flash-preview",
        responseMimeType: "application/json",
        responseSchema: schema
      });
    } catch (error) {
      console.error("Exercise calculation failed:", error);
      return { caloriesBurned: 0 };
    }
  }

  async getCoachAdvice(dataSummary: string) {
    const prompt = `數據摘要：${dataSummary}。請分析進度並提供 Markdown 格式的策略建議與鼓勵。`;
    return await this.callGemini({
      prompt,
      model: "gemini-3-pro-preview",
      responseMimeType: "text/plain"
    });
  }
}
