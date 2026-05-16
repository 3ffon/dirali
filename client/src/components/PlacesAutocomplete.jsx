/* global google */
import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../loadGoogleMaps'

function PlacesAutocomplete({ value, onChange, onPlaceSelect, placeholder, types }) {
  const containerRef = useRef(null)
  const elRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [fallback, setFallback] = useState(false)
  const [userSearching, setUserSearching] = useState(false)
  const searching = userSearching || !value

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setReady(true))
      .catch(() => setFallback(true))
  }, [])

  useEffect(() => {
    if (!ready || !containerRef.current || elRef.current) return

    const init = async () => {
      const { BasicPlaceAutocompleteElement } = await google.maps.importLibrary('places')
      if (!containerRef.current) return

      const el = new BasicPlaceAutocompleteElement()
      if (types && types.length) {
        el.includedPrimaryTypes = types
      }
      el.includedRegionCodes = ['il']
      el.requestedLanguage = 'he'

      containerRef.current.appendChild(el)
      elRef.current = el

      requestAnimationFrame(() => {
        const inner = el.querySelector('input')
        if (inner && placeholder) inner.placeholder = placeholder
      })

      el.addEventListener('gmp-select', async (event) => {
        const place = event.place
        await place.fetchFields({ fields: ['formattedAddress', 'location', 'displayName'] })

        const lat = place.location?.lat()
        const lng = place.location?.lng()
        const address = place.formattedAddress || place.displayName || ''

        onChange(address)
        onPlaceSelect({ address, lat, lng })
        setUserSearching(false)

        const inner = el.querySelector('input')
        if (inner) inner.value = ''
      })
    }

    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const handleChange = () => {
    setUserSearching(true)
    requestAnimationFrame(() => {
      const inner = elRef.current?.querySelector('input')
      if (inner) {
        inner.value = ''
        inner.focus()
      }
    })
  }

  if (fallback || !ready) {
    return (
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )
  }

  return (
    <div className="places-autocomplete-wrapper">
      {!searching && value && (
        <div className="places-selected-value" onClick={handleChange}>
          <span>{value}</span>
          <button type="button" className="places-change-btn" onClick={(e) => { e.stopPropagation(); handleChange() }}>
            שנה
          </button>
        </div>
      )}
      <div
        ref={containerRef}
        className="places-autocomplete-container"
        style={{ display: searching ? 'block' : 'none' }}
      />
    </div>
  )
}

export default PlacesAutocomplete
