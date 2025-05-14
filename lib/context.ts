import { Pinecone } from "@pinecone-database/pinecone";
import { getEmbeddings } from "./embeddings";

export async function getMatchesFromEmbeddings(embeddings:number[],fileKey:string){
    const pinecone=new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

    const Index= pinecone.Index('chatpdf').namespace(fileKey );

    try {
        const queryResult = await Index.query({
          vector: embeddings,
          topK: 5,
          includeMetadata: true,
        })
        return queryResult.matches || [];
    } catch (error) {
        //console.log(error);
    }

}


export async function getContext(query:string,fileKey:string){
    const queryEmbeddings=await getEmbeddings(query);
    const matches=await getMatchesFromEmbeddings(queryEmbeddings,fileKey);

    //console.log(matches);
    const qualifyingDocs=matches?.filter((match)=>match.score && match.score>0.6);


    type Metadata={
        text:string,
        pageNumber:number
    }

    let doc=qualifyingDocs?.map(match=>(match.metadata as Metadata).text)

    return doc?.join('\n').substring(0,3000)
}