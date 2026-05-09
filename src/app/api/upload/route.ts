// src/app/api/upload/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { drizzle } from 'drizzle-orm/d1'
import { notes, contextEnvelopes } from '@/db/schema'
import { randomUUID } from 'crypto'


export async function POST(req: NextRequest) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { env } = await getCloudflareContext({ async: true })
    const formData = await req.formData()
    const file = formData.get('file') as File
    const sourceDomain = formData.get('sourceDomain') as string || ''

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    // Determine type
    const type = file.type.startsWith('image/') ? 'image'
        : file.type === 'application/pdf' ? 'pdf'
            : file.type.startsWith('video/') ? 'video'
                : file.type.startsWith('audio/') ? 'audio'
                    : 'file'

    // Upload to R2
    const key = `${userId}/${randomUUID()}/${file.name}`
    const r2 = (env as any).notee_files || (env as any).FILES
    if (!r2) {
        console.error("R2 binding not found in env:", Object.keys(env || {}))
        return NextResponse.json({ error: 'Storage not configured' }, { status: 500 })
    }
    
    await r2.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type }
    })

    // Save note record
    const db = drizzle((env as any).DB || (env as any).notee_db)
    const noteId = randomUUID()
    const now = Date.now()

    await db.insert(notes).values({
        id: noteId,
        userId,
        type,
        filePath: key,
        fileName: file.name,
        mimeType: file.type,
        createdAt: now,
    })

    await db.insert(contextEnvelopes).values({
        id: randomUUID(),
        noteId,
        sourceDomain,
        capturedAt: now,
    })

    return NextResponse.json({ id: noteId, key, type })
}