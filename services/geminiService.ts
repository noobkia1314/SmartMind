
import { UserProfileStats } from "../types.ts";
import { GoogleGenAI, Type } from "@google/genai";

// Helper to detect Tauri environment
const isTauriEnv = () => !!(window as any).__TAURI_METADATA__ || !!(window as any).__TAURI__;

export class GeminiService {
  private async callGemini(params: {
    prompt: string;
    model?: string;
    systemInstruction?: string;
    responseMimeType?: string;
    responseSchema?: any;
  }) {
    if (isTauriEnv()) {
      console.log("Running in Tauri desktop mode, using offline example simulation.");
      // For general text requests (like coach advice) in Tauri, return a dummy response
      return "### 桌面版預覽模式\n目前偵測到您正在使用桌面版。由於本地模型整合中，目前顯示的是範例建議：\n- 持續保持每日 30 分鐘的學習習慣。\n- 確保記錄每項財務支出以維持準確性。\n- 您的進度非常理想，請繼續加油！";
    }

    // Obtain API key exclusively from environment variable
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
        throw new Error("Gemini 額度用完，請稍後再試。");
      }
      if (err.message?.includes("400") || err.message?.includes("401") || err.message?.includes("API_KEY_INVALID")) {
        throw new Error("系統配置錯誤，請聯絡開發者或檢查 API Key。");
      }
      throw new Error("生成計畫失敗，請檢查網路連線。");
    }
  }

  async generateGoalStructure(goal: string) {
    if (isTauriEnv()) {
      console.log("Tauri mode: Generating mock goal structure for:", goal);
      return {
        mindMap: {
          id: "root",
          label: `範例目標藍圖：${goal} (預計總收入/進度 RM10,000+)`,
          children: [
            { id: "stage1", label: "階段一：核心基礎與學習 AI 技能" },
            { id: "stage2", label: "階段二：實戰應用與資產配置" },
            { id: "stage3", label: "階段三：規模化與目標達成" }
          ]
        },
        tasks: [
          { title: "學習 AI 30 分鐘", category: "Learning" },
          { title: "今日財務支出整理", category: "Finance" },
          { title: "目標進度回顧", category: "Reflection" }
        ]
      };
    }

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
      responseMimeType: "application/json",
      responseSchema: schema
    });
  }

  async calculateNutrition(food: string) {
    if (isTauriEnv()) {
      return { calories: 250, protein: 15 }; // Default mock data for Tauri
    }
    const prompt = `分析食物 "${food}" 的營養成分。請回傳包含 calories (number) 和 protein (number) 的 JSON。`;
    const schema = {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER },
        protein: { type: Type.NUMBER }
      },
      required: ["calories", "protein"]
    };
    return await this.callGemini({
      prompt,
      responseMimeType: "application/json",
      responseSchema: schema
    });
  }

  async calculateExercise(name: string, value: number, unit: string, stats: UserProfileStats) {
    if (isTauriEnv()) {
      return { caloriesBurned: 150 }; // Default mock data for Tauri
    }
    const prompt = `計算運動 "${name}" (${value} ${unit}) 消耗的熱量。使用者資料：年齡${stats.age}，體重${stats.weight}kg。請回傳包含 caloriesBurned (number) 的 JSON。`;
    const schema = {
      type: Type.OBJECT,
      properties: {
        caloriesBurned: { type: Type.NUMBER }
      },
      required: ["caloriesBurned"]
    };
    return await this.callGemini({
      prompt,
      responseMimeType: "application/json",
      responseSchema: schema
    });
  }

  async getCoachAdvice(summary: string) {
    const prompt = `根據以下進度摘要提供教練建議：${summary}。回覆請使用 Markdown 格式。`;
    return await this.callGemini({ prompt });
  }
}
