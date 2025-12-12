import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateGeminiEmbedding(text: string) {
  const model = genAI.getGenerativeModel({
    model: "text-embedding-004", // Latest embedding model (Feb 2025)
  });

  const result = await model.embedContent(text);

  return result.embedding.values; // returns vector array
}


export async function chunksToGeminiEmbeddings(chunks: string[]) {
  const output = [];

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateGeminiEmbedding(chunks[i]);

    output.push({
      chunk_index: i,
      chunk: chunks[i],
      embedding,
    });
  }

  return output;
}
