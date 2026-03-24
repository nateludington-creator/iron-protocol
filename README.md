# Iron Protocol — 12-Week Fitness System

A complete fitness app with three modules:
- **Training** — Equipment selection, 4 split options, 12-week periodized program with weight logging
- **Nutrition** — Bulk/cut calorie & macro calculator with weekly auto-adjusting check-ins
- **Grocery** — Location-based store finder with goal-optimized weekly grocery lists & pricing

## Quick Start

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Vercel auto-detects Vite — just click Deploy

Or from the command line:
```bash
npm i -g vercel
vercel
```

## Build for Production

```bash
npm run build
```

Output goes to `dist/` folder.

## Tech Stack

- React 18
- Vite 5
- Zero external UI dependencies
- Fully client-side (no backend needed)
