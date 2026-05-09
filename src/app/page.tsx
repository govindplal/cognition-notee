'use client'
import { useState, useEffect, useRef } from 'react'
import { useUser, SignInButton, UserButton } from '@clerk/nextjs'

type Note = {
	id: string
	rawContent: string | null
	type: string
	filePath: string | null
	fileName: string | null
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
			overflow: 'hidden',
			breakInside: 'avoid',
			marginBottom: 12,
		}}>
			{/* Image preview */}
			{note.type === 'image' && note.filePath && (
				<img
					src={`/api/files/${note.filePath}`}
					alt={note.fileName || 'image'}
					style={{ width: '100%', display: 'block', maxHeight: 240, objectFit: 'cover' }}
				/>
			)}

			{/* PDF indicator */}
			{note.type === 'pdf' && (
				<div style={{ padding: '12px 16px', background: '#171109', display: 'flex', gap: 10, alignItems: 'center' }}>
					<span style={{ fontSize: 20 }}>📄</span>
					<span style={{ fontSize: 13, color: '#A8906F' }}>{note.fileName}</span>
				</div>
			)}

			{/* Video indicator */}
			{note.type === 'video' && (
				<div style={{ padding: '12px 16px', background: '#171109', display: 'flex', gap: 10, alignItems: 'center' }}>
					<span style={{ fontSize: 20 }}>🎬</span>
					<span style={{ fontSize: 13, color: '#A8906F' }}>{note.fileName}</span>
				</div>
			)}

			<div style={{ padding: '14px 16px' }}>
				{note.rawContent && (
					<p style={{
						fontFamily: "'Cormorant Garamond', serif",
						fontSize: 15,
						lineHeight: 1.6,
						color: '#F0DBB8',
						whiteSpace: 'pre-wrap',
						marginBottom: 10,
					}}>
						{note.rawContent}
					</p>
				)}
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
					<span style={{ fontSize: 10, color: '#332416', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
						{note.type}
					</span>
					<span style={{ fontSize: 11, color: '#332416' }}>{timeLabel}</span>
				</div>
			</div>
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
	const [pendingFiles, setPendingFiles] = useState<File[]>([])
	const fileInputRef = useRef<HTMLInputElement>(null)

	const fetchNotes = async () => {
		const res = await fetch('/api/notes')
		const data = await res.json()
		if (Array.isArray(data)) setNotes(data)
	}

	const saveNote = async () => {
		if (!content.trim() && pendingFiles.length === 0) return
		setSaving(true)

		// Save text note
		if (content.trim()) {
			await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content }),
			})
		}

		// Upload each file as its own note
		for (const file of pendingFiles) {
			const fd = new FormData()
			fd.append('file', file)
			await fetch('/api/upload', { method: 'POST', body: fd })
		}

		setContent('')
		setPendingFiles([])
		setOpen(false)
		setSaving(false)
		fetchNotes()
	}

	const handleClose = () => {
		setOpen(false)
		if (content.trim() || pendingFiles.length > 0) saveNote()
	}

	const handleFiles = (files: FileList | null) => {
		if (!files) return
		setPendingFiles(prev => [...prev, ...Array.from(files)])
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		handleFiles(e.dataTransfer.files)
	}

	useEffect(() => { if (user) fetchNotes() }, [user])

	if (!isLoaded) return null

	if (!user) return (
		<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16 }}>
			<h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, color: '#F0DBB8' }}>notee</h1>
			<p style={{ color: '#634E36', fontSize: 14 }}>Your second brain. You capture. It thinks.</p>
			<SignInButton>
				<button style={{ marginTop: 16, padding: '12px 32px', background: '#C4A882', color: '#0E0A06', border: 'none', borderRadius: 100, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
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
					<button onClick={() => setOpen(true)} style={{ padding: '8px 20px', background: '#C4A882', color: '#0E0A06', border: 'none', borderRadius: 100, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
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
					<button onClick={() => setOpen(true)} style={{ padding: '12px 32px', background: '#C4A882', color: '#0E0A06', border: 'none', borderRadius: 100, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
						Add your first note
					</button>
				</div>
			)}

			{/* Notes grid */}
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
					onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
					style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
				>
					<div
						onDrop={handleDrop}
						onDragOver={e => e.preventDefault()}
						style={{ background: '#120D08', border: '1px solid #332416', borderRadius: 12, padding: 24, width: '100%', maxWidth: 560 }}
					>
						<textarea
							autoFocus
							value={content}
							onChange={e => setContent(e.target.value)}
							onKeyDown={e => { if (e.key === 'Escape') handleClose() }}
							placeholder="What's on your mind..."
							style={{
								width: '100%', minHeight: 120, background: 'transparent',
								border: 'none', outline: 'none', resize: 'none',
								color: '#F0DBB8', fontSize: 16,
								fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.6,
							}}
						/>

						{/* Pending files preview */}
						{pendingFiles.length > 0 && (
							<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
								{pendingFiles.map((file, i) => (
									<div key={i} style={{ background: '#171109', border: '1px solid #1E140C', borderRadius: 6, padding: '6px 10px', fontSize: 11, color: '#A8906F', display: 'flex', gap: 6, alignItems: 'center' }}>
										{file.type.startsWith('image/') ? '🖼' : file.type === 'application/pdf' ? '📄' : file.type.startsWith('video/') ? '🎬' : '📎'}
										{file.name}
										<span
											onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
											style={{ cursor: 'pointer', color: '#634E36', marginLeft: 4 }}
										>×</span>
									</div>
								))}
							</div>
						)}

						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid #1E140C' }}>
							<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
								<input
									ref={fileInputRef}
									type="file"
									multiple
									accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md"
									style={{ display: 'none' }}
									onChange={e => handleFiles(e.target.files)}
								/>
								<button
									onClick={() => fileInputRef.current?.click()}
									style={{ background: 'none', border: 'none', color: '#634E36', cursor: 'pointer', fontSize: 18, padding: 0 }}
									title="Attach files"
								>
									📎
								</button>
								<span style={{ fontSize: 10, color: '#332416' }}>
									Add anything — images, PDFs, videos, files
								</span>
							</div>
							<button
								onClick={saveNote}
								disabled={saving || (!content.trim() && pendingFiles.length === 0)}
								style={{
									padding: '8px 20px',
									background: (content.trim() || pendingFiles.length > 0) ? '#C4A882' : '#1E140C',
									color: (content.trim() || pendingFiles.length > 0) ? '#0E0A06' : '#332416',
									border: 'none', borderRadius: 100, fontSize: 13, cursor: 'pointer', fontWeight: 600,
								}}
							>
								{saving ? 'Saving...' : 'Save'}
							</button>
						</div>

						<div style={{ marginTop: 8 }}>
							<span style={{ fontSize: 10, color: '#1E140C' }}>Notee is capturing context from your session</span>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}