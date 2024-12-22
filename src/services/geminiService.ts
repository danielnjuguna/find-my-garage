import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export const initializeGemini = (apiKey: string) => {
  genAI = new GoogleGenerativeAI(apiKey);
};

export const analyzeImage = async (
  imageData: string,
  query: string
): Promise<string> => {
  if (!genAI) {
    throw new Error("Gemini API not initialized");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

  const prompt = `Analyze this image and tell me if you can see ${query} in it. If you do, describe its location in the image. If you don't see it, just say "Not found".`;

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageData.split(",")[1],
      },
    },
  ]);

  const response = await result.response;
  return response.text();
};