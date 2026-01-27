# The Hub (echo-hub)

Internal dashboard and documentation hub for Unstable Studios.

## Tech Stack

- **Frontend**: React 19 + Vite 7 + Tailwind CSS 4
- **Backend**: Hono on Cloudflare Workers
- **Auth**: Auth0 (OIDC)
- **Storage**: Cloudflare D1 (SQLite), KV (cache), R2 (attachments)
- **Package Manager**: pnpm

## Local Development

### Prerequisites

- Node.js 24+
- pnpm
- Doppler CLI (for secrets)
- Access to the `echo-core` Doppler project

### Setup

```bash
cd apps/echo-hub
pnpm install
```

### Running Locally

```bash
# With Doppler (recommended - auto-generates .env and .dev.vars)
pnpm dev

# Without Doppler (requires manual .env and .dev.vars files)
pnpm dev:local
```

The app runs at `http://localhost:5173`.

### Environment Variables

#### Frontend (Vite) - `.env`

| Variable | Description |
|----------|-------------|
| `VITE_AUTH0_DOMAIN` | Auth0 tenant URL (e.g., `https://tenant.auth0.com/`) |
| `VITE_AUTH0_CLIENT_ID` | Auth0 application client ID |
| `VITE_AUTH0_AUDIENCE` | Auth0 API audience |

#### Worker (Wrangler) - `.dev.vars`

| Variable | Description |
|----------|-------------|
| `AUTH0_DOMAIN` | Auth0 tenant URL |
| `AUTH0_CLIENT_ID` | Auth0 application client ID |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret |
| `AUTH0_AUDIENCE` | Auth0 API audience |

See `.env.example` and `.dev.vars.example` for templates.

## Build & Deploy

### Build

```bash
pnpm build           # Standard build
pnpm build:prod      # Production build (uses Doppler for env vars)
```

### Deploy

```bash
pnpm deploy          # Build and deploy to Cloudflare Workers
```

Deploys to: `https://hub.unstablestudios.com`

### Database Migrations

```bash
pnpm db:migrate        # Run migrations on remote D1
pnpm db:migrate:local  # Run migrations on local D1
```

## Cloudflare Resources

| Resource | Name | Binding |
|----------|------|---------|
| D1 Database | `echo-hub` | `DB` |
| KV Namespace | (see wrangler.jsonc) | `CACHE` |
| R2 Bucket | `echo-hub-attachments` | `ATTACHMENTS` |

**Note**: Resource IDs in `wrangler.jsonc` need to be updated after creating the Cloudflare resources.

## Migration Notes

This app was imported from `~/src/intranet` on 2026-01-27.

- Source commit: `85a7d950fb669d9a15100e137a5932ff71549f8a`
- Import method: git subtree
- Original name: "Unstable Studios Intranet" → renamed to "The Hub"
