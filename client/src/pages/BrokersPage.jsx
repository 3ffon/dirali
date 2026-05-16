import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { parsePhoneNumber } from 'libphonenumber-js'
import { fetchBrokers, createBroker, updateBroker, deleteBroker } from '../api'

function BrokersPage() {
  const [brokers, setBrokers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [form, setForm] = useState({ full_name: '', phone: '', email: '' })
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadBrokers()
  }, [])

  async function loadBrokers() {
    const data = await fetchBrokers()
    setBrokers(data)
    setLoading(false)
  }

  function handleEdit(broker) {
    setEditingId(broker.id)
    setForm({ full_name: broker.full_name, phone: broker.phone || '', email: broker.email || '' })
    setShowForm(true)
  }

  function handleNew() {
    setEditingId(null)
    setForm({ full_name: '', phone: '', email: '' })
    setShowForm(true)
  }

  function sanitizePhone(value) {
    return value.replace(/[\s-]/g, '')
  }

  function formatPhone(phone) {
    if (!phone) return null
    try {
      const parsed = parsePhoneNumber(phone, 'IL')
      return parsed.formatInternational()
    } catch {
      return phone
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.full_name.trim()) return
    const data = { ...form, phone: sanitizePhone(form.phone) }
    if (editingId) {
      await updateBroker(editingId, data)
    } else {
      await createBroker(data)
    }
    setShowForm(false)
    setEditingId(null)
    loadBrokers()
  }

  async function handleDelete() {
    if (!confirm('למחוק את המתווך?')) return
    await deleteBroker(editingId)
    setShowForm(false)
    setEditingId(null)
    loadBrokers()
  }

  if (loading) return <div className="loading">טוען...</div>

  return (
    <div className="form-layout">
      <div className="page-actions-bar">
        <Link to="/" className="back-link">→ חזרה</Link>
        <span className="page-actions-title">מתווכים</span>
        {!showForm && (
          <button className="icon-btn icon-btn-edit" style={{ marginRight: 'auto' }} onClick={handleNew} title="מתווך חדש">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          </button>
        )}
      </div>

      <div className="form-content">
        {showForm && (
          <form onSubmit={handleSave} className="broker-form card" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label>שם מלא</label>
              <input
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
                placeholder="שם המתווך"
                required
              />
            </div>
            <div className="form-group">
              <label>טלפון</label>
              <input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="טלפון"
                type="tel"
              />
            </div>
            <div className="form-group">
              <label>אימייל</label>
              <input
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="אימייל"
                type="email"
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>
                ביטול
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                {editingId ? 'עדכן' : 'הוסף'}
              </button>
            </div>
            {editingId && (
              <button type="button" className="btn btn-danger btn-full" style={{ marginTop: 12 }} onClick={handleDelete}>
                מחק מתווך
              </button>
            )}
          </form>
        )}


        {brokers.length === 0 && !showForm ? (
          <div className="empty-state">
            <div className="icon">🤝</div>
            <p>עוד לא הוספתם מתווכים</p>
          </div>
        ) : (
          brokers.map(broker => (
            <div key={broker.id} className="broker-item">
              <div className="card broker-card" onClick={() => setExpandedId(expandedId === broker.id ? null : broker.id)}>
                <div className="broker-info">
                  <div className="broker-name">
                    <Link to={`/brokers/${broker.id}/messages`} onClick={e => e.stopPropagation()} className="broker-name-link">
                      {broker.full_name}
                    </Link>
                    {broker.Apartments && broker.Apartments.length > 0 && <span className="broker-count">🏠 {broker.Apartments.length}</span>}
                  </div>
                  {broker.phone && <div className="broker-detail" dir="ltr">{formatPhone(broker.phone)}</div>}
                  {broker.email && <div className="broker-detail">{broker.email}</div>}
                </div>
                <div className="broker-actions" onClick={e => e.stopPropagation()}>
                  <button className="icon-btn icon-btn-edit" onClick={() => handleEdit(broker)} title="עריכה">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  {broker.phone && (
                    <a className="icon-btn icon-btn-call" href={`tel:${broker.phone}`} title="התקשר">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                    </a>
                  )}
                </div>
              </div>
              {expandedId === broker.id && (
                <div className="broker-apartments">
                  {broker.Apartments && broker.Apartments.length > 0 ? (
                    broker.Apartments.map(apt => (
                      <Link to={`/apartments/${apt.id}`} key={apt.id} className="broker-apt-link">
                        <span>{apt.address}</span>
                        {apt.asking_price && <span className="broker-apt-price">{new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(apt.asking_price)}</span>}
                      </Link>
                    ))
                  ) : (
                    <div className="broker-no-apts">אין דירות משויכות</div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default BrokersPage
