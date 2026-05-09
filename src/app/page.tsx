'use client'
import { useState, useEffect } from 'react'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'

type Note = {
	id: string
	rawContent: string
	type: string
	createdAt: number
}

function NoteCard({ note }: { note: Note }) {
	const createdAt = new Date(note.createdAt)
	const now = new Date()
	const diffHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
	const timeLabel = diffHours < 2
		? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		: diffHours < 24 ? 'Today'
			: diffHours < 48 ? 'Yesterday'
				: createdAt.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })

	return (
		<div style={{
			background: '#120D08',
			border: '1px solid #1E140C',
			borderRadius: 8,
			padding: '16px',
			breakInside: 'avoid',
			marginBottom: 12,
		}}>
			<p style={{
				fontFamily: "'Cormorant Garamond', serif",
				fontSize: 15,
				lineHeight: 1.6,
				color: '#F0DBB8',
				whiteSpace: 'pre-wrap',
				marginBottom: 12,
			}}>
				{note.rawContent}
			</p>
			<span style={{ fontSize: 11, color: '#634E36' }}>{timeLabel}</span>
		</div>
	)
}

function groupByDay(notes: Note[]) {
	const groups: Record<string, Note[]> = {}
	for (const note of notes) {
		const date = new Date(note.createdAt)
		const now = new Date()
		const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
		const label = diffDays === 0 ? 'Today'
			: diffDays === 1 ? 'Yesterday'
				: date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
		if (!groups[label]) groups[label] = []
		groups[label].push(note)
	}
	return groups
}

export default function Home() {
	const { user, isLoaded } = useUser()
	const [content, setContent] = useState('')
	const [notes, setNotes] = useState<Note[]>([])
	const [open, setOpen] = useState(false)
	const [saving, setSaving] = useState(false)

	const fetchNotes = async () => {
		const res = await fetch('/api/notes')
		const data = await res.json()
		if (Array.isArray(data)) setNotes(data)
	}

	const saveNote = async () => {
		if (!content.trim()) return
		setSaving(true)
		await fetch('/api/notes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content }),
		})
		setContent('')
		setOpen(false)
		setSaving(false)
		fetchNotes()
	}

	useEffect(() => { if (user) fetchNotes() }, [user])

	if (!isLoaded) return null

	if (!user) return (
		<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
			<h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: '#F0DBB8' }}>notee</h1>
			<p style={{ color: '#634E36', fontSize: 14 }}>Your second brain. You capture. It thinks.</p>
			<SignInButton>
				<button style={{ marginTop: 16, padding: '12px 32px', background: '#C4A882', color: '#0E0A06', border: 'none', borderRadius: 100, fontSize: 14, cursor: 'pointer', fontFamily: "'Instrument Sans', sans-serif", fontWeight: 600 }}>
					Get started
				</button>
			</SignInButton>
		</div>
	)

	const groups = groupByDay(notes)

	return (
		<div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px 80px' }}>

			{/* Top bar */}
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', borderBottom: '1px solid #1E140C', marginBottom: 32 }}>
				<h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: '#F0DBB8', letterSpacing: '0.08em' }}>notee</h1>
				<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
					<button
						onClick={() => setOpen(true)}
						style={{ padding: '8px 20px', background: '#C4A882', color: '#0E0A06', border: 'none', borderRadius: 100, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
					>
						+ Capture
					</button>
					<UserButton />
				</div>
			</div>

			{/* Empty state */}
			{notes.length === 0 && (
				<div style={{ textAlign: 'center', paddingTop: 80 }}>
					<p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: '#332416', fontStyle: 'italic', marginBottom: 12 }}>No thoughts here yet.</p>
					<p style={{ color: '#332416', fontSize: 13, marginBottom: 32 }}>Capture your first one.</p>
					<button
						onClick={() => setOpen(true)}
						style={{ padding: '12px 32px', background: '#C4A882', color: '#0E0A06', border: 'none', borderRadius: 100, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}
					>
						Add your first note
					</button>
				</div>
			)}

			{/* Notes grouped by day */}
			{Object.entries(groups).map(([day, dayNotes]) => (
				<div key={day} style={{ marginBottom: 40 }}>
					<p style={{ fontSize: 10, letterSpacing: '0.2em', color: '#332416', textTransform: 'uppercase', marginBottom: 16, fontWeight: 600 }}>
						{day}
					</p>
					<div style={{ columns: '2 300px', columnGap: 12 }}>
						{dayNotes.map(note => <NoteCard key={note.id} note={note} />)}
					</div>
				</div>
			))}

			{/* Quick capture overlay */}
			{open && (
				<div
					onClick={(e) => { if (e.target === e.currentTarget) { setOpen(false); if (content.trim()) saveNote() } }}
					style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
				>
					<div style={{ background: '#120D08', border: '1px solid #332416', borderRadius: 12, padding: 24, width: '100%', maxWidth: 560, position: 'relative' }}>
						<textarea
							autoFocus
							value={content}
							onChange={e => setContent(e.target.value)}
							onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); if (content.trim()) saveNote() } }}
							placeholder="What's on your mind..."
							style={{
								width: '100%',
								minHeight: 120,
								background: 'transparent',
								border: 'none',
								outline: 'none',
								resize: 'none',
								color: '#F0DBB8',
								fontSize: 16,
								fontFamily: "'Cormorant Garamond', serif",
								lineHeight: 1.6,
							}}
						/>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid #1E140C' }}>
							<span style={{ fontSize: 10, color: '#332416' }}>Notee is capturing context from your session</span>
							<button
								onClick={saveNote}
								disabled={saving || !content.trim()}
								style={{ padding: '8px 20px', background: content.trim() ? '#C4A882' : '#1E140C', color: content.trim() ? '#0E0A06' : '#332416', border: 'none', borderRadius: 100, fontSize: 13, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
							>
								{saving ? 'Saving...' : 'Save'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}