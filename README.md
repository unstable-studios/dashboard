# Dashboard

A personal dashboard for organizing links, documents, and reminders in one place.

## Features

- **Links Management** - Organize bookmarks with categories and pinning
- **Documents** - Markdown-based knowledge base with version history
- **Reminders** - Calendar with recurring reminders and email notifications
- **iCal Feed** - Subscribe to reminders in your favorite calendar app

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **Backend**: Hono on Cloudflare Workers
- **Auth**: Auth0 (OIDC)
- **Storage**: Cloudflare D1 (SQLite), KV (cache), R2 (attachments)
- **Email**: Postmark (for reminder notifications)

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Cloudflare account
- Auth0 account

### Local Development

```bash
# Install dependencies
pnpm install

# Copy environment files
cp .env.example .env
cp .dev.vars.example .dev.vars

# Edit .env and .dev.vars with your Auth0 credentials

# Run locally
pnpm dev
```

The app runs at `http://localhost:5173`.

### Environment Variables

#### Frontend (.env)

| Variable | Description |
|----------|-------------|
| `VITE_AUTH0_DOMAIN` | Auth0 tenant URL |
| `VITE_AUTH0_CLIENT_ID` | Auth0 application client ID |
| `VITE_AUTH0_AUDIENCE` | Auth0 API audience |

#### Worker (.dev.vars)

| Variable | Description |
|----------|-------------|
| `AUTH0_DOMAIN` | Auth0 tenant URL |
| `AUTH0_CLIENT_ID` | Auth0 application client ID |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret |
| `AUTH0_AUDIENCE` | Auth0 API audience |
| `POSTMARK_API_KEY` | Postmark API key (for email reminders) |

### Database Migrations

```bash
# Run migrations locally
pnpm db:migrate:local --file=migrations/0001_initial_schema.sql

# Run all migrations
for f in migrations/*.sql; do pnpm db:migrate:local --file=$f; done
```

## Deployment

### Cloudflare Resources

You'll need to create:

1. **D1 Database** - `dashboard`
2. **KV Namespace** - for caching
3. **R2 Bucket** - `dashboard-attachments` (for file uploads)

Update the IDs in `wrangler.jsonc` after creating these resources.

### Deploy

```bash
pnpm build
pnpm deploy
```

## License

AGPL-3.0 - See [LICENSE](LICENSE) for details.
