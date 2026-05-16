# דירה לי — Apartment Checklist App

Hebrew RTL mobile-first app for evaluating apartments during a search.

## Tech Stack

- **Client:** React 19, Vite, React Router 7, react-photo-view
- **Server:** Express, Sequelize, SQLite
- **Services:** Anthropic SDK (apartment parsing), whatsapp-web.js

## Development

```bash
npm run install-all   # install all deps
npm run dev           # client (5173) + server (3001) concurrently
```

## Key Conventions

- **RTL / Hebrew** — all UI text is Hebrew, CSS direction is RTL
- **Mobile-first** — max-width 600px, fixed viewport height
- **No icon library** — use inline SVGs in `.icon-btn` wrappers (see design language)
- **Auto-save** — forms save on change, no explicit save buttons
- **API client** — all server calls go through `client/src/api.js`

## Design Language

See [docs/design-lang.md](docs/design-lang.md) for colors, icons, spacing, and component patterns.

Key rule: **action buttons use SVG icon-btns, never emoji.** Emoji is only for decorative/empty states.

## Structure

```
client/src/
  pages/         — route-level components
  components/    — shared UI (TopBar, Map, ImageUploader, etc.)
  api.js         — centralized fetch wrapper
  index.css      — all styles + CSS variables
server/
  routes/        — Express route handlers
  models/        — Sequelize models (Apartment, Answer, Image, Broker, User)
  services/      — WhatsApp + AI parsing
  questions.json — checklist categories & questions
```
