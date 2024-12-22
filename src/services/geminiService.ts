import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export const initializeGemini = (apiKey: string) => {
  genAI = new GoogleGenerativeAI(apiKey);
};

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const analyzeImage = async (
  imageData: string,
  query: string
): Promise<string> => {
  if (!genAI) {
    throw new Error("Gemini API not initialized");
  }

  try {
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
  } catch (error: any) {
    console.error("Error analyzing image:", error);
    if (error.message?.includes("429") || error.message?.includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
    }
    throw new Error("Error analyzing image. Please try again.");
  }
};