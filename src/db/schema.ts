// src/db/schema.ts
import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core'

export const notes = sqliteTable('notes', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    type: text('type').notNull().default('text'), // text | image | pdf | video | audio | web
    rawContent: text('raw_content'),
    filePath: text('file_path'), // R2 key if file
    fileName: text('file_name'),
    mimeType: text('mime_type'),
    createdAt: integer('created_at').notNull(),
})

export const contextEnvelopes = sqliteTable('context_envelopes', {
    id: text('id').primaryKey(),
    noteId: text('note_id').notNull(),
    sessionId: text('session_id'),
    sourceDomain: text('source_domain'),
    focusedApp: text('focused_app'),
    openTabs: text('open_tabs'), // JSON string
    capturedAt: integer('captured_at').notNull(),
})

export const connections = sqliteTable('connections', {
    id: text('id').primaryKey(),
    noteA: text('note_a').notNull(),
    noteB: text('note_b').notNull(),
    strength: real('strength').notNull().default(0),
    signals: text('signals'), // JSON: which signals contributed
    updatedAt: integer('updated_at').notNull(),
})