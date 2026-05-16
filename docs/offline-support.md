# Offline Support Guide

This app is offline-first. All data mutations work without connectivity and sync when signal returns.

## Architecture

```
User action
  → api.js: write to IndexedDB immediately
  → api.js: try server request
  → on failure: enqueue to syncQueue
  → syncEngine: processes queue when online
  → after full drain: clear all IDB, re-fetch from server
```

## Data Flow

1. **Mutations** (create/update/delete): always write locally first, then attempt server
2. **Reads**: try server first, fall back to IDB cache on network error
3. **Sync**: triggered on `online` event and `visibilitychange` (visible)
4. **Post-sync**: entire IDB is cleared and fresh data is fetched from server

## Key Files

| File | Role |
|------|------|
| `client/src/offlineStore.js` | IndexedDB schema + CRUD for all stores |
| `client/src/syncEngine.js` | Queue processing, temp ID remapping, post-sync cleanup |
| `client/src/networkStatus.js` | Online/offline detection + subscriber pattern |
| `client/src/api.js` | All server interactions, offline-first wrapper |
| `client/src/hooks/useImageUrl.js` | Resolves blob URLs for temp images |
| `client/src/hooks/useSyncStatus.js` | React hook for sync state |

## Temp ID Conventions

- Entities (apartments, brokers): `temp_${Date.now()}_${random}`
- Image blobs: `img_temp_${Date.now()}_${random}`
- Check with `isTempId(id)` in api.js — matches both prefixes
- Never send temp IDs to the server

## Adding a New Entity Type

Follow this checklist:

### 1. IndexedDB Store (`offlineStore.js`)

- Add object store in the `upgrade` function (bump `DB_VERSION`)
- Add CRUD exports: `cache*`, `get*`, `put*`, `remove*`

### 2. API Layer (`api.js`)

Every mutation must follow this pattern:

```js
export async function createThing(data) {
  const tempId = generateTempId()
  const local = { id: tempId, ...data }
  await putThing(local)

  try {
    const result = await serverRequest('/things', { method: 'POST', body: JSON.stringify(data) })
    await removeThing(tempId)
    await cacheThing(result)
    return result
  } catch {
    await enqueue({ type: 'create_thing', tempId, entityId: tempId, payload: data })
    return local
  }
}
```

For reads:

```js
export async function fetchThings() {
  const local = await getThings()
  const temp = local.filter(t => isTempId(t.id))

  try {
    const data = await serverRequest('/things')
    await cacheThings(data)
    for (const t of temp) await putThing(t)
    return [...temp, ...data]
  } catch (err) {
    if (isNetworkError(err)) return local
    throw err
  }
}
```

### 3. Sync Engine (`syncEngine.js`)

Add a `case` in the `switch (op.type)` block:

```js
case 'create_thing': {
  const result = await serverRequest('/things', { method: 'POST', body: JSON.stringify(op.payload) })
  // Remap temp ID in remaining queue items
  await remapTempIdInQueue(pending, op.tempId, result.id, 'entityId')
  for (const p of pending) {
    if (p.entityId === op.tempId) p.entityId = result.id
  }
  emitIdRemap(op.tempId, result.id)
  break
}
case 'update_thing': {
  await serverRequest(`/things/${op.entityId}`, { method: 'PUT', body: JSON.stringify(op.payload) })
  break
}
case 'delete_thing': {
  await serverRequest(`/things/${op.entityId}`, { method: 'DELETE' })
  break
}
```

### 4. Import Updates

- Import new offlineStore functions in both `api.js` and `syncEngine.js`
- Add the new store name to `clearAll()` transaction in offlineStore.js

### 5. UI Considerations

- Use `onIdRemap` listener if the user might be viewing a temp entity when sync completes (update URL via `history.replaceState`)
- For blob data (files, images), store in IDB with a `blob` field and use a hook like `useImageUrl` to resolve display URLs

## Online-Only Endpoints

Some features don't need offline support — they require external services that only work online:

- WhatsApp integration (`/api/whatsapp/*`)
- AI parsing (`/api/whatsapp/parse`)
- User profile (`/api/users/profile`)

These should fail gracefully with a user-facing message when offline. Don't enqueue them.

## Testing Offline

- **Dev mode (`npm run dev`)** does NOT work offline — Vite serves modules via HMR
- Use `npm run preview` (builds + serves from Express) for offline testing
- Mobile testing requires HTTPS (service workers won't register over HTTP except `localhost`)
- Use `npx localtunnel --port 3001` or ngrok for phone testing
- To test: load app online once → enable airplane mode → verify full functionality
