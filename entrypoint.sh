#!/bin/sh
set -e

# Run migrations
npx prisma migrate deploy

# Start the app
exec node dist/index.js