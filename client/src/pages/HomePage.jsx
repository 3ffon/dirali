import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchApartments, getImageUrl } from '../api'

function HomePage() {
  const [apartments, setApartments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApartments()
      .then(setApartments)
      .finally(() => setLoading(false))
  }, [])

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
      <div className="header">
        <h1>🏠 דירה לי</h1>
        <Link to="/apartments/new" className="btn btn-primary">+ דירה חדשה</Link>
      </div>

      <div className="apartment-list">
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
    </div>
  )
}

export default HomePage
