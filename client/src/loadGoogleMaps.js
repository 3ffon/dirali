let loadPromise = null

export function loadGoogleMaps() {
  if (loadPromise) return loadPromise
  if (window.google?.maps) return Promise.resolve()

  loadPromise = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!key) {
      console.warn('Missing VITE_GOOGLE_MAPS_API_KEY — Places autocomplete disabled')
      reject(new Error('No API key'))
      return
    }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=he`
    script.async = true
    script.onload = resolve
    script.onerror = () => reject(new Error('Failed to load Google Maps'))
    document.head.appendChild(script)
  })

  return loadPromise
}
