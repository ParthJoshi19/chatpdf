import { GoogleGenerativeAI } from "@google/generative-ai";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenAI } from "@google/genai";

const pineConeAPI = process.env.PINECONE_API_KEY;
const geminiAPI = process.env.GEMINI_API_KEY;
const generateAPI = process.env.GEMINI_GOOGLE_API_KEY;

const ai = new GoogleGenAI({ apiKey: generateAPI || "" });

export const pc = new Pinecone({
  apiKey: pineConeAPI || "",
});

const genAI = new GoogleGenerativeAI(geminiAPI || "");

export async function generateGeminiEmbedding(text: string) {
  const model = genAI.getGenerativeModel({
    model: "text-embedding-004", // Latest embedding model (Feb 2025)
  });

  const result = await model.embedContent(text);

  return result.embedding.values; // returns vector array
}

export async function generateResponce(query: string, pdfId: string) {
  try {
    const queryEmbedding = await generateGeminiEmbedding(query);

    // console.log("Query Embedding:", queryEmbedding);

    const index = pc.index(process.env.PINECONE_INDEX_NAME!);

    const searchResponse = await index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
      filter: { pdf_id: pdfId },
    });

    console.log(pdfId);

    // console.log("Context for response:", searchResponse);
    const context = searchResponse.matches
      .map((match) => match.metadata?.content || "")
      .join("\n\n---\n\n");
    console.log("Compiled Context:", context);

    const prompt = `
    You are a helpful AI assistant. 
    Answer the user's question **only using the provided context**. 
    If the context does not contain the answer, say:
    "I could not find the answer in the uploaded documents."

    Context:
    ${context}

    Question:
    ${query}
    `;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const answer = response.text;
    return answer;
  } catch (err) {
    console.log("Error:", err);
  }
}
