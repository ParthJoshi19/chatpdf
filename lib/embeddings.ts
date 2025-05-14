import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);


export async function getEmbeddings(text: string) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-exp-03-07" });
        const result = await model.embedContent(text.replace(/\n/g, ' '));
        const embedding = result.embedding;
        //console.log(embedding.values.slice(0,768));
        return embedding.values.slice(0,768) as number[];
    } catch (error) {
        //console.log("Error while calling Gemini API", error);
        throw error;
    }
}