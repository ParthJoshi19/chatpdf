import { Pinecone, PineconeRecord, RecordMetadata } from "@pinecone-database/pinecone";
import axios from "axios";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "../embeddings";
import md5 from "md5";
import { convertToAscii } from "../utils";

let pinecone: Pinecone | null = null;
const INDEX_NAME = "chatpdf";

export const getPineconeCilent = async () => {
  if (!pinecone) {
    pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY as string });

    const indexes = await pinecone.listIndexes();
    const exists = indexes?.indexes?.some(i => i.name === INDEX_NAME) ?? false;

    if (!exists) {
      await pinecone.createIndexForModel({
        name: INDEX_NAME,
        cloud: "aws",
        region: "us-east-1",
        embed: {
          model: "llama-text-embed-v2", 
          fieldMap: { text: "text" },
        },
        waitUntilReady: true,
      });
    }
  }

  return pinecone;
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadFileToPineCone(file_key: string) {
  const res = await axios.get("http://localhost:3000/api/download", {
    params: { file_key },
  });

  const loader = new PDFLoader(res.data.fileName);
  const pages = (await loader.load()) as PDFPage[];

  const documents = await Promise.all(pages.map(prepareDocument));
  const allDocs = documents.flat();

  const vectors = (await Promise.all(allDocs.map(embedDocument))).filter(
    (v): v is PineconeRecord<RecordMetadata> => v !== undefined
  );

  const client = await getPineconeCilent();
  const namespace = convertToAscii(file_key);
  const pineConeIndex = client.Index(INDEX_NAME).namespace(namespace);
  await pineConeIndex.upsert(vectors);

  return allDocs[0]; 
}

async function embedDocument(doc: Document): Promise<PineconeRecord<RecordMetadata>> {
  const embedding = await getEmbeddings(doc.pageContent);
  const hash = md5(doc.pageContent);

  return {
    id: hash,
    values: embedding,
    metadata: {
      text: doc.metadata.text as string,
      pageNumber: doc.metadata.pageNumber as number,
    },
  };
}

export const truncateStringByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

export async function prepareDocument(page: PDFPage) {
  const { pageContent, metadata } = page;
  const cleanedContent = pageContent.replace(/\n/g, " ");
  const splitter = new RecursiveCharacterTextSplitter();

  const docs = await splitter.splitDocuments([
    new Document({
      pageContent: cleanedContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(cleanedContent, 36000),
      },
    }),
  ]);

  return docs;
}
