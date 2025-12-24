# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start Next.js dev server
npm run build    # Build for production
npm run lint     # Run ESLint
npx convex dev   # Start Convex dev server (run alongside npm run dev)
npx convex deploy # Deploy Convex functions to production
```

## Project Overview

An AI texting bot built with Next.js 16, Convex, and the Linq messaging API. Allows you to create an AI agent that can text via iMessage/RCS.

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Convex (database + serverless functions)
- **AI Agent**: @convex-dev/agent with OpenAI
- **Messaging**: Linq API for iMessage/RCS integration
- **Auth**: Magic links via Linq messaging

### Core Data Flow
1. User texts your phone number → Linq receives message
2. Linq webhook (`/api/webhooks/linq`) verifies signature and stores message in Convex
3. Message storage triggers AI agent via `@convex-dev/agent`
4. Agent uses tools to read messages, send replies (with typing indicators), react, etc.
5. All messages stored in Convex, accessible via dashboard

### Key Directories
- `app/` - Next.js App Router pages and API routes
- `convex/` - Convex schema, queries, mutations, and agent logic
- `components/` - React components (UI + dashboard)
- `lib/` - Utility functions (Linq API helpers, etc.)

### Convex Structure
- `schema.ts` - Database tables: chats, messages, users, sessions, magicLinks, activeAgents
- `chatAgent.ts` - AI agent definition with tools (getMessages, sendMessage, react, etc.)
- `agents.ts` - Agent spawning and lifecycle management
- `messages.ts` / `chats.ts` - CRUD for messages and chat metadata
- `auth.ts` - Magic link authentication flow

### API Routes
- `/api/webhooks/linq` - Linq webhook handler (message events, reactions)
- `/api/auth/magic` - Magic link verification
- `/api/auth/logout` - Session termination
- `/api/messages` - Dashboard message fetching

### Environment Variables Required
- `LINQ_INTEGRATION_TOKEN` - Linq API authentication
- `LINQ_WEBHOOK_SECRET` - Webhook signature verification
- `NEXT_PUBLIC_CONVEX_URL` - Convex deployment URL
- `OPENAI_API_KEY` - For AI agent
- `BOT_NAME` - Name for your bot (optional, defaults to "assistant")
- `CREATOR_NAME` - Your name (optional)
- `APP_URL` - Your app's URL for dashboard links
- `CONTACT_CARD_URL` - URL to your .vcf contact card file

## Important Patterns

### SMS Blocking
The system only supports iMessage and RCS. SMS messages are blocked at the webhook level and agent tool level.

### Group Chat Blocking
Group chats (>1 non-me participant) are blocked at the webhook level.

### Agent Lifecycle
Agents auto-spawn when messages arrive, use typing indicators, and terminate after 60+ seconds of inactivity.

### Path Alias
Use `@/*` to import from project root (e.g., `@/convex/_generated/api`).
