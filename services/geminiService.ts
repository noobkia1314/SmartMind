
import { UserProfileStats } from "../types.ts";

export class GeminiService {
  private async callDeepSeek(prompt: string, systemInstruction: string, jsonMode = false) {
    const localStorageKey = localStorage.getItem("GEMINI_API_KEY");
    const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (process as any).env?.API_KEY;
    const apiKey = localStorageKey || envKey;

    if (!apiKey || apiKey.length < 10) {
      throw new Error("請先設定 DeepSeek API Key（原欄位）");
    }

    console.log("Calling DeepSeek API with key: " + apiKey.slice(0, 10) + "...");

    const simplifiedSystem = "你是 SmartMind AI 教練，用中文生成結構化目標藍圖、每日任務、mind map 等內容。回覆清晰、鼓勵性強、格式易讀。";
    const finalSystem = jsonMode 
      ? `${simplifiedSystem} 你必須僅回傳純 JSON 格式，不要包含 Markdown 代碼塊標籤。` 
      : simplifiedSystem;

    try {
      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: finalSystem },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("DeepSeek error:", response.status, errorBody);

        if (response.status === 401) {
          throw new Error("DeepSeek API key 無效，請重新輸入");
        }
        if (response.status === 429) {
          throw new Error("DeepSeek 額度暫時用完，請稍後再試");
        }
        throw new Error(`生成失敗，請檢查網路 (Status: ${response.status})`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      if (jsonMode) {
        const cleanJson = content.replace(/```json|```/gi, '').trim();
        try {
          return JSON.parse(cleanJson);
        } catch (e) {
          console.error("Failed to parse JSON from DeepSeek:", content);
          throw new Error("AI 回傳格式不正確，請再試一次。");
        }
      }
      return content;
    } catch (err: any) {
      if (err.message.includes("DeepSeek")) throw err;
      throw new Error("生成失敗，請檢查網路連線");
    }
  }

  async generateGoalStructure(goal: string) {
    const prompt = `為目標 "${goal}" 生成一份全面的個人發展計畫。
    回傳 JSON 格式：
    {
      "mindMap": { "id": "root", "label": "目標名稱", "children": [{"id": "1", "label": "階段一"}] },
      "tasks": [{ "title": "任務名稱", "category": "Diet|Exercise|Reading|Finance" }]
    }`;

    try {
      return await this.callDeepSeek(prompt, "", true);
    } catch (error) {
      console.error("DeepSeek Generation Error:", error);
      throw error;
    }
  }

  async calculateNutrition(food: string) {
    const prompt = `估算 "${food}" 的卡路里和蛋白質含量。回傳 JSON：{"calories": 數字, "protein": 數字}`;
    try {
      return await this.callDeepSeek(prompt, "", true);
    } catch (error) {
      console.error("Nutrition calculation failed:", error);
      return { calories: 0, protein: 0 };
    }
  }

  async calculateExercise(exercise: string, value: number, unit: string, stats: UserProfileStats) {
    const prompt = `計算運動：${exercise}, 數值：${value} ${unit}。回傳 JSON：{"caloriesBurned": 數字}。
    用戶數據：年齡 ${stats.age}, ${stats.gender}, 身高 ${stats.height}cm, 體重 ${stats.weight}kg, 活動等級 ${stats.activityLevel}。`;
    
    try {
      return await this.callDeepSeek(prompt, "", true);
    } catch (error) {
      console.error("Exercise calculation failed:", error);
      return { caloriesBurned: 0 };
    }
  }

  async getCoachAdvice(dataSummary: string) {
    const prompt = `數據摘要：${dataSummary}。請分析進度並提供 Markdown 格式的策略建議與鼓勵。`;
    return await this.callDeepSeek(prompt, "", false);
  }
}
