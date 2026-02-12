
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfileStats } from "../types.ts";

export class GeminiService {
  // Always use process.env.API_KEY for initialization
  private ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  async generateGoalStructure(goal: string) {
    // Use gemini-3-pro-preview for complex tasks like goal planning
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `為目標 "${goal}" 生成一份全面的個人發展計畫。回傳包含 1. 心智圖結構 2. 7 個初始每日任務。`,
      config: {
        systemInstruction: `你是 SmartMind AI 教練，幫助用戶達成 2026 目標。請根據用戶目標生成一個 JSON 結構。`,
        responseMimeType: "application/json",
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
        }
      }
    });

    if (!response.text) throw new Error("AI 生成失敗");
    return JSON.parse(response.text);
  }

  async calculateNutrition(food: string) {
    // Use gemini-3-flash-preview for simple text tasks
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `估算 "${food}" 的卡路里和蛋白質含量。`,
      config: {
        systemInstruction: `你是一個營養分析助手。`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER }
          },
          required: ["calories", "protein"]
        }
      }
    });
    return response.text ? JSON.parse(response.text) : { calories: 0, protein: 0 };
  }

  async calculateExercise(exercise: string, value: number, unit: string, stats: UserProfileStats) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `計算運動：${exercise}, 數值：${value} ${unit}。用戶數據：年齡 ${stats.age}, ${stats.gender}, 身高 ${stats.height}cm, 體重 ${stats.weight}kg, 活動等級 ${stats.activityLevel}。`,
      config: {
        systemInstruction: `你是一個健身數據分析師。`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caloriesBurned: { type: Type.NUMBER }
          },
          required: ["caloriesBurned"]
        }
      }
    });
    return response.text ? JSON.parse(response.text) : { caloriesBurned: 0 };
  }

  async getCoachAdvice(dataSummary: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `數據摘要：${dataSummary}。請提供鼓勵且具備行動力的建議。`,
      config: {
        systemInstruction: `你是一位專業的高績效 AI 教練。請分析數據並提供 Markdown 格式的策略建議。`
      }
    });
    return response.text;
  }
}
