// src/app/api/notes/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { notes, contextEnvelopes } from '@/db/schema'


export const runtime = 'edge'

export async function POST(req: NextRequest) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { content } = (await req.json()) as { content: string }
    const { env } = await getCloudflareContext({ async: true })
    const db = drizzle((env as any).DB || (env as any).notee_db)

    const noteId = crypto.randomUUID()
    const now = Date.now()

    await db.insert(notes).values({
        id: noteId,
        userId,
        type: 'text',
        rawContent: content,
        createdAt: now,
    })

    await db.insert(contextEnvelopes).values({
        id: crypto.randomUUID(),
        noteId,
        capturedAt: now,
    })

    return NextResponse.json({ id: noteId })
}

export async function GET() {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { env } = await getCloudflareContext({ async: true })
    const db = drizzle((env as any).DB || (env as any).notee_db)

    const allNotes = await db.select().from(notes).where(
        eq(notes.userId, userId)
    )

    return NextResponse.json(allNotes)
}