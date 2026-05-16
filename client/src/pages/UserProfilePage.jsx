/* global google */
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { fetchUserProfile, updateUserProfile } from '../api'
import PlacesAutocomplete from '../components/PlacesAutocomplete'
import { loadGoogleMaps } from '../loadGoogleMaps'

function UserProfilePage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', latitude: null, longitude: null })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const markerRef = useRef(null)
  const addressFieldRef = useRef(null)

  useEffect(() => {
    fetchUserProfile().then(data => {
      setForm({
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
      })
    })
  }, [])

  useEffect(() => {
    if (!form.latitude || !form.longitude || !mapRef.current) return

    let cancelled = false

    const init = async () => {
      await loadGoogleMaps()
      if (cancelled) return

      const { Map } = await google.maps.importLibrary('maps')
      await google.maps.importLibrary('marker')
      if (cancelled) return

      const position = { lat: form.latitude, lng: form.longitude }

      if (!mapInstance.current) {
        mapInstance.current = new Map(mapRef.current, {
          center: position,
          zoom: 15,
          mapId: 'DEMO_MAP_ID',
          disableDefaultUI: true,
          zoomControl: true,
        })
      } else {
        mapInstance.current.setCenter(position)
      }

      const { AdvancedMarkerElement } = google.maps.marker

      if (markerRef.current) {
        markerRef.current.map = null
      }

      markerRef.current = new AdvancedMarkerElement({
        map: mapInstance.current,
        position,
        title: form.address,
      })
    }

    init().catch(() => {})
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.latitude, form.longitude])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSaved(false)
  }

  function handlePlaceSelect({ address, lat, lng }) {
    setForm(f => ({ ...f, address, latitude: lat, longitude: lng }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await updateUserProfile(form)
    setSaving(false)
    setSaved(true)
  }

  return (
    <>
      <div className="page-actions-bar">
        <Link to="/" className="back-link">→ חזרה</Link>
        <span className="page-actions-title">פרופיל משתמש</span>
      </div>
      <div className="form-content">
        <form onSubmit={handleSubmit} id="profile-form">
          <div className="question-field">
            <label>שם</label>
            <input name="name" value={form.name} onChange={handleChange} placeholder="השם שלך" />
          </div>
          <div className="question-field">
            <label>טלפון</label>
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="050-0000000" dir="ltr" />
          </div>
          <div className="question-field">
            <label>אימייל</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" dir="ltr" />
          </div>
          <div className="question-field" ref={addressFieldRef} onFocus={() => {
            setTimeout(() => addressFieldRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
          }}>
            <label>כתובת</label>
            <PlacesAutocomplete
              value={form.address}
              onChange={(address) => { setForm(f => ({ ...f, address })); setSaved(false) }}
              onPlaceSelect={handlePlaceSelect}
              placeholder="הכתובת שלך"
            />
          </div>
          {form.latitude && form.longitude && (
            <div ref={mapRef} style={{ width: '100%', height: 200, borderRadius: 12, marginTop: 8 }} />
          )}
        </form>
      </div>
      <div className="form-footer">
        <button type="submit" form="profile-form" className="btn btn-primary btn-full" disabled={saving}>
          {saving ? 'שומר...' : saved ? 'נשמר!' : 'שמור'}
        </button>
      </div>
    </>
  )
}

export default UserProfilePage
