import { openDB } from 'idb'

const DB_NAME = 'dira-li-offline'
const DB_VERSION = 1

let dbPromise

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('apartments', { keyPath: 'id' })
        db.createObjectStore('answers', { keyPath: ['apartment_id', 'question_id'] })
        const imgStore = db.createObjectStore('images', { keyPath: 'id' })
        imgStore.createIndex('apartment_id', 'apartment_id')
        db.createObjectStore('brokers', { keyPath: 'id' })
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true })
        syncStore.createIndex('timestamp', 'timestamp')
        db.createObjectStore('questions', { keyPath: 'key' })
      },
    })
  }
  return dbPromise
}

// --- Apartments ---

export async function cacheApartments(apartments) {
  const db = await getDb()
  const tx = db.transaction('apartments', 'readwrite')
  await tx.store.clear()
  for (const apt of apartments) await tx.store.put(apt)
  await tx.done
}

export async function cacheApartment(apartment) {
  const db = await getDb()
  await db.put('apartments', apartment)
}

export async function getApartments() {
  const db = await getDb()
  return db.getAll('apartments')
}

export async function getApartment(id) {
  const db = await getDb()
  return db.get('apartments', id)
}

export async function putApartment(apartment) {
  const db = await getDb()
  await db.put('apartments', apartment)
}

export async function removeApartment(id) {
  const db = await getDb()
  const tx = db.transaction(['apartments', 'answers', 'images'], 'readwrite')
  await tx.objectStore('apartments').delete(id)
  // Remove related answers
  const allAnswers = await tx.objectStore('answers').getAll()
  for (const a of allAnswers) {
    if (a.apartment_id === id) await tx.objectStore('answers').delete([a.apartment_id, a.question_id])
  }
  // Remove related images
  const imgIndex = tx.objectStore('images').index('apartment_id')
  const imgs = await imgIndex.getAll(id)
  for (const img of imgs) await tx.objectStore('images').delete(img.id)
  await tx.done
}

export async function removeApartmentOnly(id) {
  const db = await getDb()
  await db.delete('apartments', id)
}

// --- Answers ---

export async function getAnswersForApartment(apartmentId) {
  const db = await getDb()
  const all = await db.getAll('answers')
  return all.filter(a => a.apartment_id === apartmentId)
}

export async function putAnswers(apartmentId, answers) {
  const db = await getDb()
  const tx = db.transaction('answers', 'readwrite')
  for (const a of answers) {
    await tx.store.put({ apartment_id: apartmentId, question_id: a.question_id, value: a.value, notes: a.notes })
  }
  await tx.done
}

// --- Images ---

export async function getImagesForApartment(apartmentId) {
  const db = await getDb()
  const index = db.transaction('images').store.index('apartment_id')
  return index.getAll(apartmentId)
}

export async function putImageRecord(record) {
  const db = await getDb()
  await db.put('images', record)
}

export async function getImageRecord(id) {
  const db = await getDb()
  return db.get('images', id)
}

export async function removeImageRecord(id) {
  const db = await getDb()
  await db.delete('images', id)
}

// --- Brokers ---

export async function cacheBrokers(brokers) {
  const db = await getDb()
  const tx = db.transaction('brokers', 'readwrite')
  await tx.store.clear()
  for (const b of brokers) await tx.store.put(b)
  await tx.done
}

export async function getBrokers() {
  const db = await getDb()
  return db.getAll('brokers')
}

export async function putBroker(broker) {
  const db = await getDb()
  await db.put('brokers', broker)
}

export async function removeBroker(id) {
  const db = await getDb()
  await db.delete('brokers', id)
}

// --- Questions ---

export async function cacheQuestions(questions) {
  const db = await getDb()
  await db.put('questions', { key: 'questions', data: questions })
}

export async function getQuestions() {
  const db = await getDb()
  const record = await db.get('questions', 'questions')
  return record?.data || null
}

// --- Sync Queue ---

export async function enqueue(operation) {
  const db = await getDb()
  return db.add('syncQueue', { ...operation, timestamp: Date.now() })
}

export async function dequeue(id) {
  const db = await getDb()
  await db.delete('syncQueue', id)
}

export async function getAllPending() {
  const db = await getDb()
  const index = db.transaction('syncQueue').store.index('timestamp')
  return index.getAll()
}

export async function getPendingCount() {
  const db = await getDb()
  return db.count('syncQueue')
}

export async function updateQueueItem(id, updates) {
  const db = await getDb()
  const item = await db.get('syncQueue', id)
  if (item) await db.put('syncQueue', { ...item, ...updates })
}

export async function clearAll() {
  const db = await getDb()
  const tx = db.transaction(
    ['apartments', 'answers', 'images', 'brokers', 'syncQueue', 'questions'],
    'readwrite'
  )
  await tx.objectStore('apartments').clear()
  await tx.objectStore('answers').clear()
  await tx.objectStore('images').clear()
  await tx.objectStore('brokers').clear()
  await tx.objectStore('syncQueue').clear()
  await tx.objectStore('questions').clear()
  await tx.done
}
