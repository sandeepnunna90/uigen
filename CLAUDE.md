# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language; Claude AI generates code using tool calls to manipulate a virtual file system, which is then transformed and rendered live in an iframe.

## Commands

```bash
npm install                  # Install dependencies
npm run dev                  # Start dev server (Turbopack)
npm run build                # Production build
npm run lint                 # ESLint
npm run test                 # Run all tests (Vitest)
npx vitest run <file>        # Run a single test file
npm run setup                # Install + init DB (first-time setup)
npm run db:reset             # Reset SQLite database
```

Dev server requires `NODE_OPTIONS='--require ./node-compat.cjs'` (already in scripts) to polyfill Node APIs used by Prisma in the Next.js runtime.

## Architecture

### Request Flow

1. User types in **ChatInterface** → POST to `/api/chat`
2. Server streams a response from Claude (`claude-haiku-4-5`) with tool calls
3. AI uses two tools: `str_replace_editor` (create/edit files) and `file_manager` (rename/delete)
4. Tool call results are processed by **FileSystemContext**, updating the in-memory **VirtualFileSystem**
5. **PreviewFrame** picks up file changes, transforms JSX via `@babel/standalone`, generates an import map (esm.sh CDN), and injects into a sandboxed iframe

### Key Contexts

- `FileSystemProvider` (`lib/contexts/file-system-context.tsx`) — owns the `VirtualFileSystem` instance; all file operations go through here
- `ChatProvider` (`lib/contexts/chat-context.tsx`) — wraps `useChat` from `@ai-sdk/react`; bridges AI tool call results into the file system context

### Virtual File System

`lib/file-system.ts` — in-memory tree of `FileNode` objects. No disk writes. Serializes to JSON for database storage. The AI always targets `/App.jsx` as the entry point.

### Authentication

JWT stored in HTTP-only cookies (`lib/auth.ts`). Passwords hashed with bcrypt. Anonymous users can work without auth; their work is tracked in `localStorage` (`anon-work-tracker`). Authenticated projects persist to SQLite via Prisma.

### Code Transformation

`lib/transform/jsx-transformer.ts` — Babel standalone transforms JSX/TSX in-browser, builds an `importmap` pointing React 19 and other deps to esm.sh CDN, then injects into an iframe template for sandboxed rendering.

### AI Provider

`lib/provider.ts` — uses `@ai-sdk/anthropic` with `claude-haiku-4-5`. Falls back to a `MockLanguageModel` that returns a static component when `ANTHROPIC_API_KEY` is not set. System prompt lives in `lib/prompts/generation.tsx`; it uses Anthropic prompt caching (`ephemeral`).

## Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Falls back to mock model |
| `JWT_SECRET` | No | Falls back to a dev key |

## Database

SQLite via Prisma (`prisma/dev.db`). Schema: `User` → `Project[]`. Messages and VFS data are stored as JSON strings. Run `npm run setup` on first clone or `npm run db:reset` to wipe and re-migrate.

## Path Aliases

`@/*` maps to `src/*` (configured in `tsconfig.json`).
