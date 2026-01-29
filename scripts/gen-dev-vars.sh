#!/bin/bash
# Generate .dev.vars and .env from Doppler for local development
# These files are gitignored and contain secrets

# Worker secrets (.dev.vars for wrangler)
echo "# Auto-generated from Doppler - do not commit" > .dev.vars
echo "AUTH0_DOMAIN=$AUTH0_DOMAIN" >> .dev.vars
echo "AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID" >> .dev.vars
echo "AUTH0_CLIENT_SECRET=$AUTH0_CLIENT_SECRET" >> .dev.vars
echo "AUTH0_AUDIENCE=$AUTH0_AUDIENCE" >> .dev.vars
echo "Generated .dev.vars from Doppler"

# Frontend env vars (.env for Vite - needs VITE_ prefix)
echo "# Auto-generated from Doppler - do not commit" > .env
echo "VITE_AUTH0_DOMAIN=$AUTH0_DOMAIN" >> .env
echo "VITE_AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID" >> .env
echo "VITE_AUTH0_AUDIENCE=$AUTH0_AUDIENCE" >> .env
echo "VITE_AUTH0_ORGANIZATION=$AUTH0_ORGANIZATION" >> .env
echo "Generated .env from Doppler"
