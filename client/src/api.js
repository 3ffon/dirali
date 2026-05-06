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
