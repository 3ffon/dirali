# דירה לי (Dira Li)

Apartment checklist app for evaluating and comparing apartments during a search. Built with a React frontend (Hebrew RTL) and Express + SQLite backend.

## Features

- Add apartments with metadata (address, neighborhood, price, agent, etc.)
- Answer checklist questions grouped by category
- Upload photos per apartment
- View and compare apartments from a list
- Auto-save while editing
- Mobile-first design

## Quick Start

```bash
npm run install-all
npm run dev
```

The app runs at `http://localhost:5173` with the API on port 3002.

## Docker

```bash
npm run docker:build
npm run docker:run
```

## Tech Stack

- **Client:** React, Vite, React Router
- **Server:** Express, Sequelize, SQLite
- **Storage:** Local filesystem (uploads), SQLite (data)
