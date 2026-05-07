import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../loadGoogleMaps'

function ApartmentsMap({ apartments }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (!mapRef.current) return

    let cancelled = false

    const init = async () => {
      await loadGoogleMaps()
      if (cancelled) return

      const { Map } = await google.maps.importLibrary('maps')
      await google.maps.importLibrary('marker')
      if (cancelled) return

      const map = new Map(mapRef.current, {
        center: { lat: 32.0853, lng: 34.7818 },
        zoom: 11,
        mapId: 'DEMO_MAP_ID',
        disableDefaultUI: true,
        zoomControl: true,
      })

      mapInstance.current = map
      setMapReady(true)
    }

    init().catch(() => {})

    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return

    const { AdvancedMarkerElement } = google.maps.marker

    for (const m of markersRef.current) {
      m.map = null
    }
    markersRef.current = []

    let latest = null

    for (const apt of apartments) {
      if (!apt.latitude || !apt.longitude) continue

      const position = { lat: apt.latitude, lng: apt.longitude }
      const marker = new AdvancedMarkerElement({
        map: mapInstance.current,
        position,
        title: apt.address,
      })

      marker.addListener('click', () => {
        window.location.href = `/apartments/${apt.id}`
      })

      markersRef.current.push(marker)
      if (!latest) latest = position
    }

    if (latest) {
      mapInstance.current.setCenter(latest)
      mapInstance.current.setZoom(14)
    }
  }, [apartments, mapReady])

  return <div ref={mapRef} className="apartments-map" />
}

export default ApartmentsMap
