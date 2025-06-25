# Best-Self App

A minimal Next.js + Supabase MVP to track Orientation, Daily, and Weekly tasks, add notes, and share progress with your mastermind.

## Quickstart

1. `npm i`
2. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and anon key.
3. `npm run dev`
4. Seed the `tasks` table in Supabase with orientation / daily / weekly tasks.

### Tables

- **tasks**: `id` (uuid, PK), `title` (text), `freq` (text: orientation|daily|weekly)
- **completions**: `id` (uuid, PK), `task_id` (uuid FK -> tasks.id), `user_id` (uuid), `date` (text YYYY-MM-DD), `note` (text)

## Deploy

Import to [Vercel](https://vercel.com/import) → set env vars → deploy.
