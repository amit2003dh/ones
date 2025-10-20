import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import ENV from "./env";
import { QdrantClient } from "@qdrant/js-client-rest";
import type { KnowledgeBase, Email } from "@shared/schema";
import { generateEmbedding } from "./gemini";

// Initialize Qdrant client if URL is provided and valid
function isValidQdrantUrl(url: string | undefined): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://');
}

const QDRANT_ENABLED = isValidQdrantUrl(ENV.QDRANT_URL);
const COLLECTION_NAME = "knowledge_base";

let qdrantClient: QdrantClient | null = null;

function getQdrantClient(): QdrantClient | null {
  if (!QDRANT_ENABLED || !ENV.QDRANT_URL) return null;
  
  if (!qdrantClient) {
    try {
      const opts: any = { url: ENV.QDRANT_URL };
      if (ENV.QDRANT_API_KEY) {
        opts.headers = { Authorization: `Bearer ${ENV.QDRANT_API_KEY}` };
      }
      qdrantClient = new QdrantClient(opts);
    } catch (error) {
      console.error("Failed to initialize Qdrant client:", error);
      return null;
    }
  }
  return qdrantClient;
}

// Initialize Qdrant collection if available
export async function initializeQdrant() {
  const client = getQdrantClient();
  if (!client) {
    console.log("Qdrant is not configured. Using in-memory vector search fallback.");
    return;
  }

  try {
    const collections = await client.getCollections();
    const exists = collections.collections.some(c => c.name === COLLECTION_NAME);
    
    if (!exists) {
      await client.createCollection(COLLECTION_NAME, {
        vectors: {
          size: 768, // Gemini text-embedding-004 dimension
          distance: "Cosine"
        }
      });
      console.log(`Qdrant collection "${COLLECTION_NAME}" created successfully`);
    } else {
      console.log(`Qdrant collection "${COLLECTION_NAME}" already exists`);
    }
  } catch (error) {
    console.log("Qdrant connection failed. Using in-memory vector search fallback.");
  }
}

// Store knowledge entry in Qdrant
export async function storeInQdrant(id: string, embedding: number[], content: string, category: string) {
  const client = getQdrantClient();
  if (!client) return;

  try {
    await client.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: id,
          vector: embedding,
          payload: { content, category }
        }
      ]
    });
  } catch (error) {
    console.error("Error storing in Qdrant:", error);
  }
}

// Search Qdrant for relevant knowledge
export async function searchQdrant(queryEmbedding: number[], topK: number = 3) {
  const client = getQdrantClient();
  if (!client) return [];

  try {
    const result = await client.search(COLLECTION_NAME, {
      vector: queryEmbedding,
      limit: topK,
      with_payload: true
    });
    return result;
  } catch (error) {
    console.error("Error searching Qdrant:", error);
    return [];
  }
}

// Delete from Qdrant
export async function deleteFromQdrant(id: string) {
  const client = getQdrantClient();
  if (!client) return;

  try {
    await client.delete(COLLECTION_NAME, {
      wait: true,
      points: [id]
    });
  } catch (error) {
    console.error("Error deleting from Qdrant:", error);
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same length");
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function findRelevantKnowledge(
  query: string,
  knowledgeEntries: KnowledgeBase[],
  topK: number = 3
): Promise<KnowledgeBase[]> {
  if (knowledgeEntries.length === 0) {
    return [];
  }

  const queryEmbedding = await generateEmbedding(query);
  
  // Try Qdrant first
  if (QDRANT_ENABLED) {
    try {
      const qdrantResults = await searchQdrant(queryEmbedding, topK);
      if (qdrantResults.length > 0) {
        // Map Qdrant results back to KnowledgeBase entries
        return qdrantResults
          .map(result => {
            return knowledgeEntries.find(entry => entry.id === String(result.id));
          })
          .filter((entry): entry is KnowledgeBase => entry !== undefined);
      }
    } catch (error) {
      console.log("Qdrant search failed, falling back to in-memory search");
    }
  }
  
  // Fallback to in-memory cosine similarity
  const scoredEntries = knowledgeEntries
    .filter(entry => entry.embedding)
    .map(entry => {
      const embedding = JSON.parse(entry.embedding as string);
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      return { entry, similarity };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return scoredEntries.map(item => item.entry);
}

export interface SuggestedReply {
  reply: string;
  confidence: number;
  relevantKnowledge: string[];
}

const replySuggestionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    reply: {
      type: SchemaType.STRING,
      description: "The suggested email reply text"
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: "Confidence score from 0.0 to 1.0"
    }
  },
  required: ["reply", "confidence"]
};

export async function generateReply(
  email: Email,
  knowledgeEntries: KnowledgeBase[]
): Promise<SuggestedReply> {
  try {
    if (!ENV.GEMINI_API_KEY) {
      throw new Error("Gemini API key is not configured");
    }

    const genAI = new GoogleGenerativeAI(ENV.GEMINI_API_KEY);
    
    const emailContext = `
Subject: ${email.subject}
From: ${email.from}
Body: ${email.bodyText?.substring(0, 1000) || "No body"}
    `.trim();

    const relevantKnowledge = await findRelevantKnowledge(emailContext, knowledgeEntries, 3);
    
    const knowledgeContext = relevantKnowledge.length > 0
      ? relevantKnowledge.map(k => k.content).join("\n\n")
      : "No specific knowledge base available.";

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: replySuggestionSchema as any,
      },
      systemInstruction: `You are a professional email assistant that generates contextually appropriate replies based on knowledge base information. Always be polite, professional, and use the knowledge base information when relevant.`
    });

    const prompt = `Based on the following knowledge base and the received email, generate a professional and contextually appropriate reply.

KNOWLEDGE BASE:
${knowledgeContext}

RECEIVED EMAIL:
${emailContext}

Generate a professional email reply that:
1. Acknowledges the email appropriately
2. Uses information from the knowledge base when relevant (e.g., meeting links, product info)
3. Is polite and professional
4. Stays on topic

Provide the reply text and confidence score.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const parsed = JSON.parse(text);
    
    return {
      reply: parsed.reply || "Thank you for your email. I will get back to you shortly.",
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
      relevantKnowledge: relevantKnowledge.map(k => k.content),
    };
  } catch (error) {
    console.error("Error generating reply with Gemini:", error);
    throw new Error("Failed to generate reply suggestion");
  }
}
