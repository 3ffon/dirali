import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchBrokers, fetchWhatsAppStatus, fetchWhatsAppMessages, parseMessagesToApartment } from '../api'

function BrokerMessagesPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [broker, setBroker] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [waStatus, setWaStatus] = useState(null)
  const [error, setError] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [parsing, setParsing] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadData() {
    try {
      const brokers = await fetchBrokers()
      const found = brokers.find(b => b.id === Number(id))
      if (!found) {
        setError('מתווך לא נמצא')
        setLoading(false)
        return
      }
      setBroker(found)

      const status = await fetchWhatsAppStatus()
      setWaStatus(status)

      if (status.status === 'ready' && found.phone) {
        const msgs = await fetchWhatsAppMessages(found.phone)
        setMessages(msgs)
      }
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  function toggleSelect(msgId) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(msgId)) next.delete(msgId)
      else next.add(msgId)
      return next
    })
  }

  async function handleParse() {
    if (selectedIds.size === 0) return
    setParsing(true)
    try {
      const selected = messages.filter(m => selectedIds.has(m.id))
      const result = await parseMessagesToApartment(selected, broker.id)
      navigate(`/apartments/${result.id}/edit`)
    } catch (err) {
      alert('שגיאה בעיבוד ההודעות: ' + err.message)
    }
    setParsing(false)
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp * 1000)
    return date.toLocaleString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) return <div className="loading">טוען...</div>
  if (error) return <div className="loading">{error}</div>

  return (
    <div className="form-layout">
      <div className="page-actions-bar">
        <Link to="/brokers" className="back-link">→ חזרה</Link>
        <span className="page-actions-title">הודעות עם {broker?.full_name}</span>
        <button
          className="btn btn-primary btn-sm"
          disabled={selectedIds.size === 0 || parsing}
          onClick={handleParse}
          style={{ marginRight: 'auto' }}
        >
          {parsing ? 'מעבד...' : `צור דירה (${selectedIds.size})`}
        </button>
      </div>

      <div className="form-content">
        {waStatus?.status !== 'ready' && (
          <div className="whatsapp-status-banner">
            {waStatus?.status === 'qr' && (
              <div className="qr-container">
                <p>סרקו את הקוד עם וואטסאפ:</p>
                <img src={waStatus.qr} alt="WhatsApp QR" className="qr-image" />
                <button className="btn btn-secondary" onClick={loadData} style={{ marginTop: 12 }}>
                  בדוק שוב
                </button>
              </div>
            )}
            {waStatus?.status === 'disconnected' && (
              <div className="qr-container">
                <p>וואטסאפ לא מחובר</p>
                <button className="btn btn-primary" onClick={loadData}>
                  נסה שוב
                </button>
              </div>
            )}
            {waStatus?.status === 'error' && (
              <p>שגיאה בהתחברות לוואטסאפ</p>
            )}
          </div>
        )}

        {waStatus?.status === 'ready' && !broker?.phone && (
          <div className="empty-state">
            <p>למתווך זה לא מוגדר מספר טלפון</p>
            <Link to="/brokers" className="btn btn-primary">עדכן פרטי מתווך</Link>
          </div>
        )}

        {waStatus?.status === 'ready' && broker?.phone && messages.length === 0 && (
          <div className="empty-state">
            <p>לא נמצאו הודעות עם מתווך זה</p>
          </div>
        )}

        {messages.length > 0 && (
          <div className="messages-list">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`message-bubble ${msg.fromMe ? 'message-sent' : 'message-received'} ${selectedIds.has(msg.id) ? 'message-selected' : ''}`}
                onClick={() => toggleSelect(msg.id)}
              >
                {msg.hasMedia && (
                  <div className="message-media">
                    <img
                      src={`/api/whatsapp/media?id=${encodeURIComponent(msg.id)}`}
                      alt=""
                      loading="lazy"
                      onError={e => { e.target.parentElement.innerHTML = '<span class="message-type-label">📎 קובץ מדיה</span>' }}
                    />
                  </div>
                )}
                {msg.body && <div className="message-body">{msg.body}</div>}
                {!msg.body && !msg.hasMedia && msg.type === 'location' && (
                  <div className="message-type-label">📍 מיקום</div>
                )}
                {!msg.body && !msg.hasMedia && msg.type === 'vcard' && (
                  <div className="message-type-label">👤 איש קשר</div>
                )}
                {!msg.body && !msg.hasMedia && msg.type !== 'location' && msg.type !== 'vcard' && msg.type !== 'chat' && (
                  <div className="message-type-label">[{msg.type}]</div>
                )}
                <div className="message-time">{formatTime(msg.timestamp)}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}

export default BrokerMessagesPage
