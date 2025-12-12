import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { supabaseServer } from "@/lib/supabase"

// Fetch chats/documents for the current user
export async function GET() {
	try {
		const user = await currentUser()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { data, error } = await supabaseServer
			.from("pdf_documents")
			.select("id, original_filename, cloudinary_url, created_at")
			.eq("user_id", user.id)
			.order("created_at", { ascending: false })

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		return NextResponse.json({ documents: data ?? [] }, { status: 200 })
	} catch (err: any) {
		return NextResponse.json({ error: err?.message ?? "Unexpected error" }, { status: 500 })
	}
}