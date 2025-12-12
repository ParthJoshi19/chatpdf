import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type { WebhookEvent } from '@clerk/nextjs/server'
import { supabaseServer } from '@/lib/supabase'

// Clerk recommends verifying via Svix signature headers
// https://clerk.com/docs/webhooks/svix#verify-an-incoming-webhook
import { Webhook } from 'svix'

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

export async function POST(req: Request) {
  try {
    if (!CLERK_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing CLERK_WEBHOOK_SECRET' }, { status: 500 })
    }

    const payload = await req.text()
    const headerList = await headers()
    const svixId = headerList.get('svix-id') ?? ''
    const svixTimestamp = headerList.get('svix-timestamp') ?? ''
    const svixSignature = headerList.get('svix-signature') ?? ''

    const wh = new Webhook(CLERK_WEBHOOK_SECRET)
    let evt: WebhookEvent
    try {
      evt = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as WebhookEvent
    } catch (e) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    // Handle user.created to insert into Supabase profiles
    if (evt.type === 'user.created') {
      const user = evt.data
      const profile = {
        id: user.id, // Clerk user id
        email: user.email_addresses?.[0]?.email_address ?? null,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        image_url: user.image_url ?? null,
        created_at: new Date().toISOString(),
      }

      const { error } = await supabaseServer.from('profiles').upsert(profile, { onConflict: 'id' })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    // Optionally handle updates
    if (evt.type === 'user.updated') {
      const user = evt.data
      const update = {
        id: user.id,
        email: user.email_addresses?.[0]?.email_address ?? null,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        image_url: user.image_url ?? null,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabaseServer.from('profiles').upsert(update, { onConflict: 'id' })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ skipped: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Unexpected error' }, { status: 500 })
  }
}
