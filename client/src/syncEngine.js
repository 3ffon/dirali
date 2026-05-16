import { isOnline, subscribe } from './networkStatus'
import {
  getAllPending, dequeue, clearAll, updateQueueItem,
  putApartment, getApartment, removeApartmentOnly,
  removeImageRecord, getImageRecord,
  putBroker, removeBroker, getBrokers,
  cacheApartments, cacheBrokers, cacheQuestions,
} from './offlineStore'

const BASE = '/api'
const listeners = new Set()
let syncing = false

export function onSyncChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function notify() { listeners.forEach(fn => fn()) }

export function isSyncing() { return syncing }

async function serverRequest(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function remapTempIdInQueue(pending, tempId, realId) {
  for (const item of pending) {
    if (item.entityId === tempId) {
      await updateQueueItem(item.id, { entityId: realId })
    }
    if (item.payload?.apartment_id === tempId) {
      await updateQueueItem(item.id, { payload: { ...item.payload, apartment_id: realId } })
    }
  }
}

export async function syncAll() {
  if (!isOnline() || syncing) return
  syncing = true
  notify()

  try {
    const pending = await getAllPending()
    if (pending.length === 0) { syncing = false; notify(); return }

    for (const op of pending) {
      if (!isOnline()) break

      try {
        switch (op.type) {
          case 'create_apartment': {
            const result = await serverRequest('/apartments', { method: 'POST', body: JSON.stringify(op.payload) })
            const localApt = await getApartment(op.tempId)
            if (localApt) {
              await putApartment({ ...localApt, id: result.id })
              // Only delete the apartment record — don't cascade-delete images (they still need to sync)
              await removeApartmentOnly(op.tempId)
            }
            // Remap in remaining queue items
            await remapTempIdInQueue(pending, op.tempId, result.id)
            // Update subsequent items in memory too
            for (const p of pending) {
              if (p.entityId === op.tempId) p.entityId = result.id
              if (p.payload?.apartment_id === op.tempId) p.payload.apartment_id = result.id
            }
            emitIdRemap(op.tempId, result.id)
            break
          }
          case 'update_apartment': {
            await serverRequest(`/apartments/${op.entityId}`, { method: 'PUT', body: JSON.stringify(op.payload) })
            break
          }
          case 'delete_apartment': {
            await serverRequest(`/apartments/${op.entityId}`, { method: 'DELETE' })
            break
          }
          case 'save_answers': {
            await serverRequest(`/apartments/${op.entityId}/answers`, {
              method: 'PUT',
              body: JSON.stringify({ answers: op.payload.answers }),
            })
            break
          }
          case 'upload_image': {
            const imgRecord = await getImageRecord(op.blobKey)
            if (imgRecord?.blob) {
              const blob = new Blob([imgRecord.blob], { type: imgRecord.mime_type })
              const formData = new FormData()
              formData.append('images', blob, imgRecord.original_name)
              const res = await fetch(`${BASE}/apartments/${op.entityId}/images`, { method: 'POST', body: formData })
              if (!res.ok) throw new Error(`Upload error: ${res.status}`)
              await removeImageRecord(op.blobKey)
            }
            break
          }
          case 'delete_image': {
            await serverRequest(`/images/${op.entityId}`, { method: 'DELETE' })
            break
          }
          case 'create_broker': {
            const result = await serverRequest('/brokers', { method: 'POST', body: JSON.stringify(op.payload) })
            const allBrokers = await getBrokers()
            const localBroker = allBrokers.find(b => b.id === op.tempId)
            if (localBroker) {
              await putBroker({ ...localBroker, id: result.id })
              await removeBroker(op.tempId)
            }
            await remapTempIdInQueue(pending, op.tempId, result.id)
            for (const p of pending) {
              if (p.entityId === op.tempId) p.entityId = result.id
            }
            break
          }
          case 'update_broker': {
            await serverRequest(`/brokers/${op.entityId}`, { method: 'PUT', body: JSON.stringify(op.payload) })
            break
          }
          case 'delete_broker': {
            await serverRequest(`/brokers/${op.entityId}`, { method: 'DELETE' })
            break
          }
        }
        await dequeue(op.id)
      } catch (err) {
        if (!navigator.onLine || err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          break
        }
        // 4xx errors - unrecoverable, drop
        if (err.message.includes('4')) {
          console.warn('Dropping unrecoverable sync item', op, err)
          await dequeue(op.id)
        } else {
          break
        }
      }
    }

    // If queue fully drained, clear local store and refresh from server
    const remaining = await getAllPending()
    if (remaining.length === 0) {
      await clearAll()
      await refreshCache()
    }
  } finally {
    syncing = false
    notify()
  }
}

async function refreshCache() {
  try {
    const [apartments, brokers, questions] = await Promise.all([
      serverRequest('/apartments'),
      serverRequest('/brokers'),
      serverRequest('/questions'),
    ])
    await cacheApartments(apartments)
    await cacheBrokers(brokers)
    await cacheQuestions(questions)
  } catch {
    // Refresh is best-effort
  }
  notify()
}

// ID remap events for UI
const remapListeners = new Set()
export function onIdRemap(fn) { remapListeners.add(fn); return () => remapListeners.delete(fn) }
function emitIdRemap(tempId, realId) { remapListeners.forEach(fn => fn(tempId, realId)) }

// Trigger sync on connectivity changes
subscribe((online) => { if (online) syncAll() })
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && isOnline()) syncAll()
})
