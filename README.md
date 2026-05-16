# דירה לי (Dira Li)

Apartment checklist app for evaluating and comparing apartments during a search. Built with a React frontend (Hebrew RTL) and Express + SQLite backend.

## Features

- Add apartments with metadata (address, neighborhood, price, broker, etc.)
- Answer checklist questions grouped by category
- Upload and manage photos per apartment
- View apartments in list and map views
- Manage brokers and link them to apartments
- WhatsApp integration — parse broker messages into apartment data using AI
- Google Maps with autocomplete for addresses
- Auto-save while editing
- Mobile-first RTL (Hebrew) design

## Quick Start

```bash
npm run install-all
npm run dev
```

The app runs at `http://localhost:5173` with the API on port 3001.

## Docker

```bash
npm run docker:build
npm run docker:run
```

## Tech Stack

- **Client:** React 19, Vite, React Router 7, Google Maps API
- **Server:** Express, Sequelize, SQLite, Anthropic SDK, whatsapp-web.js
- **Storage:** Local filesystem (uploads), SQLite (data)

## Docs

- [Design Language](docs/design-lang.md) — colors, icons, components, layout patterns
