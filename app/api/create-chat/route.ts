import { db } from "@/lib/db";
import { loadFileToPineCone } from "@/lib/db/pinecone";
import { chats } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req:NextRequest,res:NextResponse){
    try {

        const {userId}=await auth()
        
        if(!userId){
            return NextResponse.json({error:"Unauthorized"},{status:401})
        }

       //console.log(userId)
        const body=await req.json();
        const {file_name,file_key}=body;
        //console.log(file_key);
        await loadFileToPineCone(file_key);
        const chat_id=await db.insert(chats).values({
            fileKey:file_key,
            pdfName:file_name,
            pdfUrl:`https://res.cloudinary.com/dngqp3rve/raw/upload/v1746964361/chatpdf-folder/${file_key}`,
            userId: userId
        }).returning({
            insertedID:chats.id
        })
        return NextResponse.json({
            chat_id: chat_id[0].insertedID
        },{status:200})

} catch (error) {
        //console.log(error);
    }
}