import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabase'

export async function GET(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get('documentId')
    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 })
    }
    
    // Basic UUID v4 validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(documentId)) {
      return NextResponse.json({ error: 'Invalid documentId format (uuid expected)' }, { status: 400 })
    }

    // Fetch messages for this document and user
    const { data, error } = await supabaseServer
      .from('messages')
      .select('id, role, content, created_at, document_id, user_id')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

      // console.log("Fetched messages",error,data);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: data ?? [] }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const documentId = body?.documentId as string | undefined
    const content = body?.content as string | undefined
    const role = (body?.role as 'user' | 'assistant' | undefined) ?? 'user'

    if (!documentId || !content) {
      return NextResponse.json({ error: 'Missing documentId or content' }, { status: 400 })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(documentId)) {
      return NextResponse.json({ error: 'Invalid documentId format (uuid expected)' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('messages')
      .insert({
        document_id: documentId,
        user_id: user.id,
        role,
        content,
      })
      .select()
      .single()

      // console.log("Inserted message",error,data);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: data }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 500 })
  }
}
