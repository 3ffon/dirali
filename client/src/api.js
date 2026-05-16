const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function fetchApartments() {
  return request('/apartments');
}

export function fetchApartment(id) {
  return request(`/apartments/${id}`);
}

export function createApartment(data) {
  return request('/apartments', { method: 'POST', body: JSON.stringify(data) });
}

export function updateApartment(id, data) {
  return request(`/apartments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteApartment(id) {
  return request(`/apartments/${id}`, { method: 'DELETE' });
}

export function saveAnswers(apartmentId, answers) {
  return request(`/apartments/${apartmentId}/answers`, {
    method: 'PUT',
    body: JSON.stringify({ answers }),
  });
}

export async function uploadImages(apartmentId, files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append('images', file);
  }
  const res = await fetch(`${BASE}/apartments/${apartmentId}/images`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload error: ${res.status}`);
  return res.json();
}

export function deleteImage(imageId) {
  return request(`/images/${imageId}`, { method: 'DELETE' });
}

export function getImageUrl(imageId) {
  return `${BASE}/images/${imageId}/file`;
}

export function fetchQuestions() {
  return request('/questions');
}

export function fetchBrokers() {
  return request('/brokers');
}

export function createBroker(data) {
  return request('/brokers', { method: 'POST', body: JSON.stringify(data) });
}

export function updateBroker(id, data) {
  return request(`/brokers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteBroker(id) {
  return request(`/brokers/${id}`, { method: 'DELETE' });
}

export function fetchUserProfile() {
  return request('/users/profile');
}

export function updateUserProfile(data) {
  return request('/users/profile', { method: 'PUT', body: JSON.stringify(data) });
}

export function fetchWhatsAppStatus() {
  return request('/whatsapp/status');
}

export function initializeWhatsApp() {
  return request('/whatsapp/initialize', { method: 'POST' });
}

export function fetchWhatsAppMessages(phone) {
  return request(`/whatsapp/messages/${encodeURIComponent(phone)}`);
}

export function parseMessagesToApartment(messages, brokerId) {
  return request('/whatsapp/parse', {
    method: 'POST',
    body: JSON.stringify({ messages, brokerId }),
  });
}
