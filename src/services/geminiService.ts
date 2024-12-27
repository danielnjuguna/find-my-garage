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

    // Ensure the image data is properly formatted
    const imageDataFormatted = imageData.startsWith('data:') 
      ? imageData 
      : `data:image/jpeg;base64,${imageData}`;

    const prompt = `Analyze this image and tell me if you can see ${query} in it. If you do:
    1. Describe its location in the image
    2. Provide the bounding box coordinates in this exact format: "BBOX: <left>,<top>,<width>,<height>" where each value is a percentage (0-100) of the image dimensions.
    If you don't see it, just say "Not found".`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: imageDataFormatted.split(",")[1],
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Only return the description if the item was found
    return text.toLowerCase().includes("not found") ? "Not found" : text;
  } catch (error: any) {
    console.error("Error analyzing image:", error);
    if (error.message?.includes("429") || error.message?.includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
    }
    throw new Error("Error analyzing image. Please try again.");
  }
};