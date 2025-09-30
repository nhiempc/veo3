import { GoogleGenAI } from "@google/genai";
import { type Job } from '../types';
import { fileToBase64 } from "../utils/fileUtils";

// Store clients to avoid re-creating them for the same key
const clients = new Map<string, GoogleGenAI>();

const getAiClient = (apiKey?: string): GoogleGenAI => {
  const effectiveApiKey = apiKey || process.env.API_KEY;

  if (!effectiveApiKey) {
    throw new Error("API key is not configured. Please provide one in the UI or set the API_KEY environment variable.");
  }
  
  if (clients.has(effectiveApiKey)) {
    return clients.get(effectiveApiKey)!;
  }

  const newClient = new GoogleGenAI({ apiKey: effectiveApiKey });
  clients.set(effectiveApiKey, newClient);
  return newClient;
};


export const generateVideo = async (job: Job): Promise<string> => {
  const ai = getAiClient(job.apiKey);
  const apiKey = job.apiKey || process.env.API_KEY;
    
  if (!apiKey) {
    throw new Error("API key is not configured.");
  }

  let operation;
  if (job.inputType === 'Image to Video' && job.imageFile) {
    const base64Image = await fileToBase64(job.imageFile);
    operation = await ai.models.generateVideos({
      model: job.model,
      prompt: job.prompt,
      image: {
        imageBytes: base64Image,
        mimeType: job.imageFile.type,
      },
      config: {
        numberOfVideos: job.outputCount,
      }
    });
  } else {
    operation = await ai.models.generateVideos({
      model: job.model,
      prompt: job.prompt,
      config: {
        numberOfVideos: job.outputCount,
      }
    });
  }
  
  while (!operation.done) {
    // Poll every 10 seconds
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  if (operation.error) {
    throw new Error(`Video generation failed: ${operation.error.message}`);
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!downloadLink) {
    throw new Error("Video generation succeeded, but no download link was found.");
  }

  // Fetch the video data with optional cookie
  const fetchOptions: RequestInit = {};
  if (job.veoCookie) {
    fetchOptions.headers = {
      'Cookie': job.veoCookie,
    };
  }
  
  const videoResponse = await fetch(`${downloadLink}&key=${apiKey}`, fetchOptions);
  
  if (!videoResponse.ok) {
     const errorBody = await videoResponse.text();
    throw new Error(`Failed to download video (${videoResponse.status} ${videoResponse.statusText}): ${errorBody}`);
  }

  const videoBlob = await videoResponse.blob();
  return URL.createObjectURL(videoBlob);
};