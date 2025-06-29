# Zoho Integration Project

A Next.js application with tRPC, Tailwind CSS, Prisma, and NextAuth for integrating with Zoho APIs.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **API**: tRPC for type-safe API calls
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Discord OAuth app (for authentication)

### Environment Setup

1. **Copy the environment example file:**

   ```bash
   cp env.example .env.local
   ```

2. **Configure your environment variables in `.env.local`:**

   ```bash
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/zoho_db"

   # NextAuth Configuration
   AUTH_SECRET="your-auth-secret-here"
   AUTH_DISCORD_ID="your-discord-client-id"
   AUTH_DISCORD_SECRET="your-discord-client-secret"

   # Node Environment
   NODE_ENV="development"
   ```

3. **For different environments, create:**
   - `.env.development` - Development environment
   - `.env.production` - Production environment
   - `.env.test` - Testing environment

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up the database:**

   ```bash
   # Generate Prisma client
   npm run db:generate

   # Push schema to database
   npm run db:push
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run db:studio` - Open Prisma Studio
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Prisma client

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── _components/    # Shared components
│   └── layout.tsx      # Root layout
├── server/             # Server-side code
│   ├── api/           # tRPC routers
│   ├── auth/          # NextAuth configuration
│   └── db.ts          # Database connection
├── trpc/              # tRPC client configuration
└── styles/            # Global styles
```

## Environment Variables

| Variable              | Description                  | Required                     |
| --------------------- | ---------------------------- | ---------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string | Yes                          |
| `AUTH_SECRET`         | NextAuth secret key          | Yes (prod)                   |
| `AUTH_DISCORD_ID`     | Discord OAuth client ID      | Yes                          |
| `AUTH_DISCORD_SECRET` | Discord OAuth client secret  | Yes                          |
| `NODE_ENV`            | Environment mode             | No (defaults to development) |
| `ZOHO_CLIENT_ID`      | Zoho API client ID           | No                           |
| `ZOHO_CLIENT_SECRET`  | Zoho API client secret       | No                           |
| `ZOHO_REFRESH_TOKEN`  | Zoho API refresh token       | No                           |
| `ZOHO_ORG_ID`         | Zoho organization ID         | No                           |

## Next Steps

- [ ] Implement Zoho API integration
- [ ] Set up data models for Zoho entities
- [ ] Create API endpoints for Zoho operations
- [ ] Build UI components for data display
- [ ] Add error handling and validation
