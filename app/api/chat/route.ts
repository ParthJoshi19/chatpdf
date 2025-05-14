import { getContext } from "@/lib/context";
import { db } from "@/lib/db";
import { chats, messages as _message } from "@/lib/db/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message, streamText } from "ai";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// export const runtime = "edge";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_CHAT_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();

    const _chats = await db.select().from(chats).where(eq(chats.id, chatId));

    if (_chats.length != 1) {
      return NextResponse.json({ error: "chat not found" });
    }

    const file_key = _chats[0].fileKey;
    const userMessages = messages.filter((msg: Message) => msg.role === "user");

    const formattedMessages = userMessages.map((msg: Message) => ({
      role: "user",
      parts: [{ text: msg.content }],
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const chat = model.startChat({
      history: formattedMessages.slice(0, -1),
    });

    const lastMessage = formattedMessages[formattedMessages.length - 1];
    
    if (lastMessage) {
      await db.insert(_message).values({
        chatId,
        content: lastMessage.parts[0].text,
        role: "user",
        createdAt: new Date(),
      });
    }

    const context = await getContext(lastMessage.parts[0].text, file_key);
    const prompt = {
      role: "system",
      content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      Question is :
      ${lastMessage.parts[0].text}
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.
      `,
    };

    const result = await chat.sendMessage(prompt.content);
    const text =  result.response.text();

    await db.insert(_message).values({
      chatId,
      content:text,
      role:"system",
      createdAt:new Date(),
    })

    return new Response(
      JSON.stringify({
        messages: [
          {
            role: "assistant",
            content: text,
            id: "assistant/" + Date.now().toString(),
          },
        ],
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
