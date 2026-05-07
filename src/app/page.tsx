'use client'
import { useState, useEffect } from 'react'
import { useUser, SignInButton, SignOutButton } from '@clerk/nextjs'

export default function Home() {
	const { user, isLoaded } = useUser()
	const [content, setContent] = useState('')
	const [notes, setNotes] = useState<any[]>([])

	const fetchNotes = async () => {
		const res = await fetch('/api/notes')
		const data = await res.json()
		setNotes(data as any[])
	}

	const saveNote = async () => {
		if (!content.trim()) return
		await fetch('/api/notes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content }),
		})
		setContent('')
		fetchNotes()
	}

	useEffect(() => { if (user) fetchNotes() }, [user])

	if (!isLoaded) return <p>Loading...</p>
	if (!user) return <SignInButton />

	return (
		<div style={{ padding: 40, maxWidth: 600, margin: '0 auto' }}>
			<h1>notee</h1>
			<SignOutButton />
			<br /><br />
			<textarea
				value={content}
				onChange={e => setContent(e.target.value)}
				placeholder="What's on your mind..."
				rows={4}
				style={{ width: '100%', padding: 12, fontSize: 16 }}
			/>
			<br />
			<button onClick={saveNote} style={{ marginTop: 8, padding: '8px 24px' }}>
				Save note
			</button>
			<br /><br />
			<h2>Your notes</h2>
			{notes.map((note: any) => (
				<div key={note.id} style={{ padding: 16, border: '1px solid #ccc', marginBottom: 8, borderRadius: 6 }}>
					<p>{note.rawContent}</p>
					<small>{new Date(note.createdAt).toLocaleTimeString()}</small>
				</div>
			))}
		</div>
	)
}