
import { GoogleGenAI, Type } from "@google/genai";
import { TimeSlot } from "../types";

export const getGeminiAdvice = async (slots: TimeSlot[]): Promise<string> => {
  // Fix: Use process.env.API_KEY directly for initialization according to guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const filledSlots = slots.filter(s => s.activity.trim() !== "");
  if (filledSlots.length === 0) return "Начните заполнять свои активности, чтобы получить персональные советы!";

  const summary = filledSlots.map(s => `[${s.time}] ${s.category}: ${s.activity}`).join("\n");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Проанализируй мой распорядок дня (интервалы по 15 минут) и дай краткие, полезные советы по улучшению продуктивности и баланса. Ответ напиши на русском языке в формате Markdown.
      
      Вот мой список занятий:
      ${summary}`,
      config: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      }
    });

    // Fix: Access response text property directly
    return response.text || "Не удалось получить советы. Попробуйте позже.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Произошла ошибка при обращении к ИИ. Убедитесь, что ваш ключ API активен.";
  }
};
