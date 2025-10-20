import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import ENV from "./env";

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!ENV.GEMINI_API_KEY) {
    throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY environment variable.");
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
  }
  return genAI;
}

export interface EmailCategorizationResult {
  category: "Interested" | "Meeting Booked" | "Not Interested" | "Spam" | "Out of Office";
  confidence: number;
}

const emailCategorySchema = {
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.STRING,
      description: "The email category based on content analysis",
      enum: ["Interested", "Meeting Booked", "Not Interested", "Spam", "Out of Office"]
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: "Confidence score from 0.0 to 1.0"
    }
  },
  required: ["category", "confidence"]
};

export async function categorizeEmail(
  subject: string,
  body: string,
  from: string
): Promise<EmailCategorizationResult> {
  try {
    const client = getGeminiClient();
    
    const model = client.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        // responseSchema typing from the SDK is strict; cast to any to satisfy TS here
        responseSchema: emailCategorySchema as any,
      },
      systemInstruction: `You are an expert email classifier. Your task is to analyze the provided email text and categorize it into one of the following labels based on the content and intent:

- "Interested": The sender shows interest in your product/service/proposal or wants to learn more
- "Meeting Booked": The email is about scheduling, confirming, or discussing a meeting time
- "Not Interested": The sender declines, shows no interest, or asks to be removed from communications
- "Spam": The email is promotional, unsolicited, irrelevant, or appears to be automated marketing
- "Out of Office": Auto-reply indicating the person is away or unavailable

Analyze the email carefully and provide your categorization with a confidence score.`
    });

    const prompt = `Analyze and categorize this email:

From: ${from}
Subject: ${subject}
Body: ${body.substring(0, 2000)}

Provide the category and confidence score based on the content.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    const parsed = JSON.parse(text);
    
    return {
      category: parsed.category,
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.8)),
    };
  } catch (error) {
    console.error("Error categorizing email with Gemini:", error);
    throw new Error("Failed to categorize email");
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: "text-embedding-004" });
    
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding with Gemini:", error);
    throw new Error("Failed to generate embedding");
  }
}
