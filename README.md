# CampaignShare

A web app for tabletop RPG campaigns to share notes, maps, calendars, and lore with players. Built with a React frontend and an Express/Prisma/PostgreSQL backend.

## What it does

- Create campaigns and invite players.
- Build a wiki-style graph of locations, NPCs, factions, items, and custom node types.
- Write rich text blocks and link between nodes with `@` mentions.
- Track an in-game calendar with custom ages, months, and leap-year rules.
- Control visibility: public nodes, private notes, or DM-only secrets.

## Tech stack

- **Frontend:** React, TypeScript, Tailwind CSS, TanStack Query, TipTap
- **Backend:** Node.js, Express, TypeScript, Prisma, PostgreSQL
- **DevOps:** Docker Compose for local PostgreSQL

## Getting started

1. Start the database:
   ```bash
   docker compose up -d
   ```

2. Set up the server environment:
   ```bash
   cd server
   cp .env.example .env
   # Generate a strong JWT_SECRET and update DATABASE_URL if needed
   npm install
   npx prisma migrate dev
   npm run seed   # optional demo data
   npm run dev
   ```

3. Start the client:
   ```bash
   cd client
   npm install
   npm run dev
   ```

## Notes

- This repository is provided for viewing. See `LICENSE` for usage terms.
- Never commit `.env` files, `cookies.txt`, or compiled `dist/` output.
