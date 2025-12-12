import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { getCloudinary } from '@/lib/cloudinary'
import { supabaseServer } from '@/lib/supabase'
import { Readable } from 'stream'
import { prepareChunks } from '@/lib/chunks-clean'
import { chunksToGeminiEmbeddings } from '@/lib/embedding'
import { storeChunksInPinecone } from '@/lib/pinecone'

export async function POST(req: Request) {
  try {
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await req.formData()
    const file = form.get('pdf') as File | null
    const text = form.get("text") as string | "";

    // Basic input validations
    if (!file) {
      return NextResponse.json({ error: 'Missing pdf file' }, { status: 400 })
    }
    if (typeof file.name !== 'string' || !file.name.trim()) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 })
    }
    // Accept common PDF mime types
    const validPdfTypes = new Set(['application/pdf', 'application/x-pdf', 'application/acrobat', 'applications/vnd.pdf']);
    if (!validPdfTypes.has(file.type)) {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }
    const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20MB
    if (typeof file.size === 'number' && file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'PDF exceeds 20MB limit' }, { status: 413 })
    }
    if (typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid text content' }, { status: 400 })
    }
    const MAX_TEXT_CHARS = 500_000; // safety guard
    if (text.length > MAX_TEXT_CHARS) {
      return NextResponse.json({ error: 'Text content is too large' }, { status: 413 })
    }

    // console.log("Received text :", text);

    const chunks = prepareChunks(text);
    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json({ error: 'No text chunks produced' }, { status: 400 })
    }

    const embeddings=await chunksToGeminiEmbeddings(chunks);

    // file presence/type already validated above

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    
    const cloudinary = getCloudinary()
    const folder = process.env.CLOUDINARY_PDF_FOLDER || 'pdfs'
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || undefined
    const publicIdBase = `${user?.id ?? 'anonymous'}-${Date.now()}`
    if (!uploadPreset) {
      // Not fatal, but warn the client to configure preset for consistent behavior
      console.warn('CLOUDINARY_UPLOAD_PRESET not set; proceeding without preset')
    }

    const result = await new Promise<any>((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          {
            resource_type: 'raw',
            type: 'upload',
            folder,
            public_id: publicIdBase,
            use_filename: true,
            filename_override: file.name,
            access_mode: "public",
          },
            (error, res) => {
                if (error) return reject(error)
                if (!res) return reject(new Error('Cloudinary upload returned empty response'))
                resolve(res)
            }
        )
        Readable.from(buffer).pipe(upload)
    })

    // Insert metadata into Supabase
    const { data: doc, error: dbError } = await supabaseServer
      .from('pdf_documents')
      .insert({
        user_id: user?.id,
        cloudinary_url: result.secure_url,
        cloudinary_public_id: result.public_id,
        original_filename: file.name,
        file_size: result.bytes,
      })
      .select()
      .single()

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }
    if (!doc || !doc.id) {
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
    }

    await storeChunksInPinecone(doc.id, embeddings);

    return NextResponse.json({
      uploaded: true,
      name: file.name,
      size: file.size,
      type: file.type,
      user_id: user?.id,
      // document: doc,
      // cloudinary: {
      //   public_id: result.public_id,
      //   version: result.version,
      //   bytes: result.bytes,
      //   secure_url: result.secure_url,
      //   resource_type: result.resource_type,
      //   folder: result.folder,
      // },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 500 })
  }
}
