# iMessage Bot

An AI texting bot that uses the [Linq API](https://linqapp.com) to send and receive iMessages/RCS messages, powered by [Convex](https://convex.dev) for the backend and OpenAI for the AI agent.

## Features

- **AI Agent**: Conversational AI that texts like a real person
- **Memory System**: Remembers facts about users (name, birthday, preferences, etc.)
- **Tasks & Reminders**: Create todos, homework, events with scheduled reminders
- **Reactions**: Send and receive iMessage tapbacks
- **Typing Indicators**: Shows realistic typing before sending
- **User Dashboard**: Web interface for users to view their message history
- **Onboarding Flow**: Introduces new users and collects basic info

## Tech Stack

- **Next.js 16** (App Router)
- **Convex** (database + serverless functions)
- **@convex-dev/agent** (AI agent framework)
- **OpenAI** (GPT for conversation)
- **Linq API** (iMessage/RCS integration)
- **Tailwind CSS 4**

## Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Set up Convex: `npx convex dev`
4. Set up environment variables (see below)
5. Configure Linq webhook to point to `/api/webhooks/linq`
6. Run dev server: `npm run dev`

## Environment Variables

```env
# Linq API
LINQ_INTEGRATION_TOKEN=your_linq_token
LINQ_WEBHOOK_SECRET=your_webhook_secret

# Convex
NEXT_PUBLIC_CONVEX_URL=your_convex_url

# OpenAI
OPENAI_API_KEY=your_openai_key

# Bot Configuration (optional)
BOT_NAME=your_bot_name
CREATOR_NAME=your_name
APP_URL=yourapp.com
CONTACT_CARD_URL=https://yoursite.com/contact.vcf
```

## How It Works

1. User texts your Linq phone number
2. Linq sends a webhook to `/api/webhooks/linq`
3. Message is stored in Convex and triggers the AI agent
4. Agent reads conversation, thinks, and responds
5. Responses sent back through Linq API with typing indicators

## License

MIT
