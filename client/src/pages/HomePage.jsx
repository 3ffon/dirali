import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { fetchApartments, fetchUserProfile } from '../api'
import ApartmentsMap from '../components/ApartmentsMap'

const scrollKey = 'home-scroll-pos'

function HomePage() {
  const [apartments, setApartments] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const listRef = useRef(null)

  useEffect(() => {
    fetchApartments()
      .then(setApartments)
      .catch(() => {})
      .finally(() => setLoading(false))
    fetchUserProfile().then(user => {
      if (user.latitude && user.longitude) {
        setUserLocation({ latitude: user.latitude, longitude: user.longitude })
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (loading) return
    const el = listRef.current
    if (!el) return

    const saved = sessionStorage.getItem(scrollKey)
    if (saved) el.scrollTop = parseInt(saved, 10)

    const handleScroll = () => sessionStorage.setItem(scrollKey, el.scrollTop)
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [loading])

  const formatPrice = (price) => {
    if (!price) return null
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(price)
  }

  const formatDate = (date) => {
    if (!date) return null
    return new Date(date).toLocaleDateString('he-IL')
  }

  if (loading) return <div className="loading">טוען...</div>

  return (
    <div className="home-layout">
      <div className="apartment-list" ref={listRef}>
        {apartments.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🏘️</div>
            <p>עוד לא הוספתם דירות</p>
            <p>לחצו על "דירה חדשה" כדי להתחיל</p>
          </div>
        ) : (
          apartments.map(apt => (
            <Link to={`/apartments/${apt.id}`} key={apt.id} className="apartment-card">
              <div className="card">
                <div className="card-top">
                  <span className="address">{apt.address}</span>
                  {apt.asking_price && <span className="price">{formatPrice(apt.asking_price)}</span>}
                </div>
                <div className="meta">
                  {apt.neighborhood && <span>{apt.neighborhood}</span>}
                  {apt.visit_date && <span>{formatDate(apt.visit_date)}</span>}
                  {apt.overall_rating && <span>{'★'.repeat(apt.overall_rating)}{'☆'.repeat(5 - apt.overall_rating)}</span>}
                  {apt.Images && apt.Images.length > 0 && <span>📷 {apt.Images.length}</span>}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <ApartmentsMap apartments={apartments} userLocation={userLocation} />
    </div>
  )
}

export default HomePage
