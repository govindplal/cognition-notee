// src/lib/ai.ts

const LOCAL_SERVER = 'http://localhost:7429'

async function hasDesktopApp(): Promise<boolean> {
    try {
        const res = await fetch(`${LOCAL_SERVER}/ping`, { signal: AbortSignal.timeout(300) })
        return res.ok
    } catch { return false }
}

export const AI = {
    async embed(content: string | Blob): Promise<number[]> {
        if (await hasDesktopApp()) {
            // desktop handles it
            const res = await fetch(`${LOCAL_SERVER}/embed`, { method: 'POST', body: JSON.stringify({ content }) })
            return res.json()
        }
        // TODO: Transformers.js + WebGPU (Phase 2)
        // Fallback: Cloudflare Workers AI
        return []
    },

    async transcribe(audio: Blob): Promise<string> {
        if (await hasDesktopApp()) {
            const res = await fetch(`${LOCAL_SERVER}/transcribe`, { method: 'POST', body: audio })
            return res.text()
        }
        // TODO: Transformers.js Gemma 4 (Phase 2)
        return ''
    },

    async reason(prompt: string): Promise<string> {
        if (await hasDesktopApp()) {
            const res = await fetch(`${LOCAL_SERVER}/reason`, { method: 'POST', body: JSON.stringify({ prompt }) })
            return res.text()
        }
        // TODO: WebLLM (Phase 2)
        return ''
    }
}