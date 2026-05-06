# Dira-Li Build Plan

## Step 1: Project scaffolding ✅
- [x] Create root package.json with scripts to run both client & server
- [x] Create server/ directory with package.json, install express, sequelize, sqlite3, multer, cors, uuid
- [x] Create client/ with Vite + React, install react-router-dom

## Step 2: Database & Models ✅
- [x] Sequelize setup with SQLite
- [x] Apartment model
- [x] Answer model (unique constraint on apartment_id + question_id)
- [x] Image model
- [x] Associations & sync

## Step 3: Server API routes ✅
- [x] GET/POST /api/apartments (list & create)
- [x] GET/PUT/DELETE /api/apartments/:id (detail, update, delete)
- [x] PUT /api/apartments/:id/answers (bulk upsert)
- [x] POST /api/apartments/:id/images (upload with multer)
- [x] GET /api/images/:id/file (serve image)
- [x] DELETE /api/images/:id
- [x] GET /api/questions (serve questions.json)
- [x] Server entry point (index.js)

## Step 4: Client - routing & layout ✅
- [x] Vite config (proxy /api to server)
- [x] App shell with RTL Hebrew layout
- [x] React Router setup (/, /apartments/new, /apartments/:id, /apartments/:id/edit)
- [x] Base CSS (mobile-first, clean, RTL)

## Step 5: Client - Home page ✅
- [x] Fetch apartments list
- [x] ApartmentCard component (address, neighborhood, date, price, rating)
- [x] "Add new apartment" button

## Step 6: Client - Apartment form ✅
- [x] Fetch questions.json from server
- [x] Metadata section (address, neighborhood, price, agent, etc.)
- [x] QuestionField component (renders by answer_type)
- [x] CategorySection component
- [x] Auto-save with debounce
- [x] ImageUploader (camera + gallery)
- [x] Works for both "new" and "edit" modes

## Step 7: Client - Apartment detail (read-only) ✅
- [x] Display all metadata
- [x] Display answers grouped by category
- [x] Image gallery
- [x] Edit button → navigate to form

## Step 8: Polish ✅
- [x] Loading states
- [x] Empty states
- [x] Error handling
- [ ] Mobile testing / responsive tweaks (needs manual testing)
