import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;

export const initializeGemini = (apiKey: string) => {
  genAI = new GoogleGenerativeAI(apiKey);
};

interface ChatSession {
  send: (message: string) => Promise<string>;
}

export const analyzeVideo = async (
  videoFile: File,
  query: string
): Promise<string> => {
  if (!genAI) {
    throw new Error("Gemini API not initialized");
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro-vision",
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    // Convert video file to base64
    const videoBase64 = await fileToBase64(videoFile);
    
    const prompt = `From the video find ${query}. Give only the timestamps like this "[HH:MM:SS] to [HH:MM:SS]" for ranges or "[HH:MM:SS]" for single moments. Separate multiple instances with commas. If not found, reply exactly with "not found in the video"`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: videoFile.type,
          data: videoBase64.split(",")[1],
        },
      },
    ]);

    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error("Error analyzing video:", error);
    if (error.message?.includes("429") || error.message?.includes("rate limit")) {
      throw new Error("Rate limit exceeded. Please wait a moment before trying again.");
    }
    throw new Error("Error analyzing video. Please try again.");
  }
};

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Extract video segment based on timestamp range
export const extractVideoSegment = async (
  videoFile: File, 
  startTime: string, 
  endTime?: string
): Promise<string> => {
  const video = document.createElement('video');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Convert timestamp to seconds
      const timeToSeconds = (timestamp: string) => {
        const [hours, minutes, seconds] = timestamp.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
      };

      const startSeconds = timeToSeconds(startTime);
      
      if (endTime) {
        // For timestamp ranges, return a video segment
        const endSeconds = timeToSeconds(endTime);
        // TODO: Implement video segment extraction
        // For now, just capture the frame at start time
        video.currentTime = startSeconds;
      } else {
        // For single timestamps, return a frame
        video.currentTime = startSeconds;
      }
    };

    video.onseeked = () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg'));
      }
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      reject("Error loading video");
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(videoFile);
  });
};