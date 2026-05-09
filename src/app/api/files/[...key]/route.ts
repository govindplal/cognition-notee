// src/app/api/files/[...key]/route.ts
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    const { userId } = await auth()
    if (!userId) return new NextResponse('Unauthorized', { status: 401 })

    const resolvedParams = await params;
    const key = resolvedParams.key.join('/')

    // Security: user can only access their own files
    if (!key.startsWith(userId)) {
        return new NextResponse('Forbidden', { status: 403 })
    }

    const { env } = await getCloudflareContext({ async: true })
    const r2 = (env as any).notee_files || (env as any).FILES
    if (!r2) {
        return new NextResponse('Storage not configured', { status: 500 })
    }
    
    const object = await r2.get(key)

    if (!object) return new NextResponse('Not found', { status: 404 })

    const headers = new Headers()
    
    // Manually set headers instead of object.writeHttpMetadata(headers) 
    // to avoid DevalueError when passing Headers across the proxy boundary
    if (object.httpMetadata?.contentType) {
        headers.set('Content-Type', object.httpMetadata.contentType)
    }
    if (object.httpMetadata?.contentDisposition) {
        headers.set('Content-Disposition', object.httpMetadata.contentDisposition)
    }

    return new NextResponse(object.body, { headers })
}