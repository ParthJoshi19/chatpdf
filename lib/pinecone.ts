import { Pinecone } from "@pinecone-database/pinecone";



export const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});



export async function storeChunksInPinecone(
  pdfId: string,
  chunks: {
    chunk_index: number;
    chunk: string;
    embedding: number[];
  }[]
) {
  const index = pc.index(process.env.PINECONE_INDEX_NAME!);

  const vectors = chunks.map((item) => ({
    id: `${pdfId}-${item.chunk_index}`, 
    values: item.embedding,            
    metadata: {
      pdf_id: pdfId,
      chunk_index: item.chunk_index,
      content: item.chunk,
    },
  }));

  await index.upsert(vectors);
}
