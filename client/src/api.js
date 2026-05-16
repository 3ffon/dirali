import {
  cacheApartments, cacheApartment, getApartments, getApartment,
  putApartment, removeApartment,
  putAnswers as putAnswersLocal, getAnswersForApartment,
  putImageRecord, getImageRecord, removeImageRecord, getImagesForApartment,
  cacheBrokers, getBrokers, putBroker, removeBroker,
  cacheQuestions, getQuestions,
  enqueue, getAllPending, dequeueByEntity,
} from './offlineStore'

export { onSyncChange, onIdRemap, isSyncing } from './syncEngine'
export { isOnline, subscribe as onNetworkChange } from './networkStatus'
export { getPendingCount } from './offlineStore'

const BASE = '/api'

function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function isTempId(id) {
  return typeof id === 'string' && (id.startsWith('temp_') || id.startsWith('img_temp_'))
}

async function serverRequest(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

function isNetworkError(err) {
  return !navigator.onLine || err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.name === 'TypeError'
}

// --- Apartments ---

export async function fetchApartments() {
  // Always check local temp apartments that haven't synced yet
  const localApartments = await getApartments()
  const tempApartments = localApartments.filter(a => isTempId(a.id))

  // Check for pending deletes so we don't re-show them from server data
  const pendingOps = await getAllPending()
  const pendingDeleteIds = new Set(
    pendingOps.filter(op => op.type === 'delete_apartment').map(op => op.entityId)
  )

  try {
    const data = await serverRequest('/apartments')
    const filtered = data.filter(a => !pendingDeleteIds.has(a.id))
    await cacheApartments(filtered)
    for (const apt of tempApartments) await putApartment(apt)
    return [...tempApartments, ...filtered]
  } catch (err) {
    if (isNetworkError(err)) {
      return localApartments.filter(a => !pendingDeleteIds.has(a.id))
    }
    throw err
  }
}

export async function fetchApartment(id) {
  if (isTempId(id)) {
    const apt = await getApartment(id)
    if (apt) {
      apt.Answers = await getAnswersForApartment(id)
      apt.Images = await getImagesForApartment(id)
    }
    return apt
  }
  try {
    const data = await serverRequest(`/apartments/${id}`)
    await cacheApartment(data)
    return data
  } catch (err) {
    if (isNetworkError(err)) {
      const apt = await getApartment(id)
      if (apt) {
        apt.Answers = await getAnswersForApartment(id)
        apt.Images = await getImagesForApartment(id)
      }
      return apt
    }
    throw err
  }
}

export async function createApartment(data) {
  const tempId = generateTempId()
  const localApt = { id: tempId, ...data, Answers: [], Images: [] }
  await putApartment(localApt)

  try {
    const result = await serverRequest('/apartments', { method: 'POST', body: JSON.stringify(data) })
    await removeApartment(tempId)
    await cacheApartment(result)
    return result
  } catch {
    // Any failure (network or server) — keep local and queue for sync
    await enqueue({ type: 'create_apartment', tempId, entityId: tempId, payload: data })
    return localApt
  }
}

export async function updateApartment(id, data) {
  const existing = await getApartment(id)
  if (existing) await putApartment({ ...existing, ...data, id })

  if (isTempId(id)) return

  try {
    await serverRequest(`/apartments/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  } catch {
    await enqueue({ type: 'update_apartment', entityId: id, payload: data })
  }
}

export async function deleteApartment(id) {
  await removeApartment(id)
  await dequeueByEntity(id)

  if (isTempId(id)) return

  try {
    await serverRequest(`/apartments/${id}`, { method: 'DELETE' })
  } catch {
    await enqueue({ type: 'delete_apartment', entityId: id })
  }
}

// --- Answers ---

export async function saveAnswers(apartmentId, answers) {
  await putAnswersLocal(apartmentId, answers)

  if (isTempId(apartmentId)) {
    await enqueue({ type: 'save_answers', entityId: apartmentId, payload: { answers } })
    return
  }

  try {
    await serverRequest(`/apartments/${apartmentId}/answers`, {
      method: 'PUT',
      body: JSON.stringify({ answers }),
    })
  } catch {
    await enqueue({ type: 'save_answers', entityId: apartmentId, payload: { answers } })
  }
}

// --- Images ---

export async function uploadImages(apartmentId, files) {
  const results = []

  for (const file of files) {
    const tempId = `img_${generateTempId()}`
    const buffer = await file.arrayBuffer()
    const record = {
      id: tempId,
      apartment_id: apartmentId,
      blob: buffer,
      original_name: file.name,
      mime_type: file.type,
    }
    await putImageRecord(record)
    results.push({ id: tempId, apartment_id: apartmentId, original_name: file.name, mime_type: file.type })

    if (!isTempId(apartmentId)) {
      try {
        const formData = new FormData()
        formData.append('images', file)
        const res = await fetch(`${BASE}/apartments/${apartmentId}/images`, { method: 'POST', body: formData })
        if (res.ok) {
          const [serverImg] = await res.json()
          await removeImageRecord(tempId)
          results[results.length - 1] = serverImg
          continue
        }
      } catch {
        // Fall through to enqueue
      }
    }

    await enqueue({ type: 'upload_image', entityId: apartmentId, tempId, blobKey: tempId, payload: { original_name: file.name, mime_type: file.type } })
  }

  return results
}

export async function deleteImage(imageId) {
  await removeImageRecord(imageId)

  if (isTempId(imageId)) return

  try {
    await serverRequest(`/images/${imageId}`, { method: 'DELETE' })
  } catch {
    await enqueue({ type: 'delete_image', entityId: imageId })
  }
}

export function getImageUrl(imageId) {
  if (isTempId(imageId)) return null
  return `${BASE}/images/${imageId}/file`
}

export async function getImageBlobUrl(imageId) {
  const record = await getImageRecord(imageId)
  if (record?.blob) {
    const blob = new Blob([record.blob], { type: record.mime_type })
    return URL.createObjectURL(blob)
  }
  return null
}

// --- Questions ---

export async function fetchQuestions() {
  try {
    const data = await serverRequest('/questions')
    await cacheQuestions(data)
    return data
  } catch (err) {
    if (isNetworkError(err)) return getQuestions()
    throw err
  }
}

// --- Brokers ---

export async function fetchBrokers() {
  const localBrokers = await getBrokers()
  const tempBrokers = localBrokers.filter(b => isTempId(b.id))

  try {
    const data = await serverRequest('/brokers')
    await cacheBrokers(data)
    for (const b of tempBrokers) await putBroker(b)
    return [...tempBrokers, ...data]
  } catch (err) {
    if (isNetworkError(err)) return localBrokers
    throw err
  }
}

export async function createBroker(data) {
  const tempId = generateTempId()
  const localBroker = { id: tempId, ...data }
  await putBroker(localBroker)

  try {
    const result = await serverRequest('/brokers', { method: 'POST', body: JSON.stringify(data) })
    await removeBroker(tempId)
    await putBroker(result)
    return result
  } catch {
    await enqueue({ type: 'create_broker', tempId, entityId: tempId, payload: data })
    return localBroker
  }
}

export async function updateBroker(id, data) {
  const existing = (await getBrokers()).find(b => b.id === id)
  if (existing) await putBroker({ ...existing, ...data, id })

  if (isTempId(id)) return

  try {
    await serverRequest(`/brokers/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  } catch {
    await enqueue({ type: 'update_broker', entityId: id, payload: data })
  }
}

export async function deleteBroker(id) {
  await removeBroker(id)

  if (isTempId(id)) return

  try {
    await serverRequest(`/brokers/${id}`, { method: 'DELETE' })
  } catch {
    await enqueue({ type: 'delete_broker', entityId: id })
  }
}

// --- User profile (online-only with graceful fallback) ---

export function fetchUserProfile() {
  return serverRequest('/users/profile')
}

export function updateUserProfile(data) {
  return serverRequest('/users/profile', { method: 'PUT', body: JSON.stringify(data) })
}

// --- WhatsApp (online-only) ---

export function fetchWhatsAppStatus() {
  return serverRequest('/whatsapp/status')
}

export function initializeWhatsApp() {
  return serverRequest('/whatsapp/initialize', { method: 'POST' })
}

export function fetchWhatsAppMessages(phone) {
  return serverRequest(`/whatsapp/messages/${encodeURIComponent(phone)}`)
}

export function parseMessagesToApartment(messages, brokerId) {
  return serverRequest('/whatsapp/parse', {
    method: 'POST',
    body: JSON.stringify({ messages, brokerId }),
  })
}
