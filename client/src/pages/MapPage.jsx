/* global google */
import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchApartments, fetchUserProfile } from '../api'
import { loadGoogleMaps } from '../loadGoogleMaps'

function MapPage() {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])
  const userMarkerRef = useRef(null)
  const boundsRef = useRef(null)

  const [apartments, setApartments] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [mapReady, setMapReady] = useState(false)
  const [isSatellite, setIsSatellite] = useState(false)

  useEffect(() => {
    fetchApartments().then(setApartments)
    fetchUserProfile().then(user => {
      if (user.latitude && user.longitude) {
        setUserLocation({ latitude: user.latitude, longitude: user.longitude })
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    let cancelled = false

    const init = async () => {
      await loadGoogleMaps()
      if (cancelled) return

      const { Map } = await google.maps.importLibrary('maps')
      await google.maps.importLibrary('marker')
      if (cancelled) return

      mapInstance.current = new Map(mapRef.current, {
        center: { lat: 32.0853, lng: 34.7818 },
        zoom: 11,
        mapId: 'DEMO_MAP_ID',
        disableDefaultUI: true,
      })

      setMapReady(true)
    }

    init().catch(() => {})
    return () => { cancelled = true }
  }, [])

  const fitBounds = useCallback(() => {
    if (!mapInstance.current || !boundsRef.current) return
    mapInstance.current.fitBounds(boundsRef.current, 40)
  }, [])

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return

    const { AdvancedMarkerElement } = google.maps.marker

    for (const m of markersRef.current) m.map = null
    markersRef.current = []

    const bounds = new google.maps.LatLngBounds()
    let hasPoints = false

    for (const apt of apartments) {
      if (!apt.latitude || !apt.longitude) continue
      const position = { lat: apt.latitude, lng: apt.longitude }
      bounds.extend(position)
      hasPoints = true

      const marker = new AdvancedMarkerElement({
        map: mapInstance.current,
        position,
        title: apt.address,
      })

      marker.addListener('click', () => {
        window.location.href = `/apartments/${apt.id}`
      })

      markersRef.current.push(marker)
    }

    if (userLocation) {
      const pos = { lat: userLocation.latitude, lng: userLocation.longitude }
      bounds.extend(pos)
      hasPoints = true

      if (userMarkerRef.current) userMarkerRef.current.map = null

      const { PinElement } = google.maps.marker
      const pin = new PinElement({
        background: '#7C3AED',
        borderColor: '#4F46E5',
        glyphColor: '#ffffff',
      })

      userMarkerRef.current = new AdvancedMarkerElement({
        map: mapInstance.current,
        position: pos,
        title: 'הכתובת שלי',
        content: pin.element,
      })
    }

    if (hasPoints) {
      boundsRef.current = bounds
      mapInstance.current.fitBounds(bounds, 40)
    }
  }, [apartments, userLocation, mapReady])

  function toggleMapType() {
    if (!mapInstance.current) return
    const next = !isSatellite
    setIsSatellite(next)
    mapInstance.current.setMapTypeId(next ? 'satellite' : 'roadmap')
  }

  return (
    <>
      <div className="page-actions-bar">
        <Link to="/" className="back-link">→ חזרה</Link>
        <span className="page-actions-title">מפה</span>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div className="map-controls">
        <button
          onClick={fitBounds}
          className="map-ctrl-btn"
          title="הצג את כל הסימונים"
        >
          ⟲
        </button>
        <button
          onClick={toggleMapType}
          className="map-ctrl-btn"
          title={isSatellite ? 'תצוגת מפה' : 'תצוגת לוויין'}
        >
          {isSatellite ? '🗺️' : '🛰️'}
        </button>
      </div>
      </div>
    </>
  )
}

export default MapPage
