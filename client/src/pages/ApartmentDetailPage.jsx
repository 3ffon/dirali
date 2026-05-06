import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchApartment, fetchQuestions, deleteApartment, getImageUrl } from '../api'

function ApartmentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [apartment, setApartment] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchApartment(id), fetchQuestions()])
      .then(([apt, q]) => {
        setApartment(apt)
        setQuestions(q)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!confirm('למחוק את הדירה?')) return
    await deleteApartment(id)
    navigate('/')
  }

  const formatPrice = (price) => {
    if (!price) return null
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(price)
  }

  const renderAnswer = (question, answer) => {
    if (!answer || (!answer.value && !answer.notes)) return null

    let displayValue = answer.value
    switch (question.answer_type) {
      case 'boolean':
      case 'boolean_with_notes':
        displayValue = answer.value === 'yes' ? 'כן' : answer.value === 'no' ? 'לא' : ''
        break
      case 'multi_select':
        try { displayValue = JSON.parse(answer.value).join(', ') } catch { }
        break
      case 'rating_1_5':
        displayValue = answer.value ? '★'.repeat(parseInt(answer.value)) + '☆'.repeat(5 - parseInt(answer.value)) : ''
        break
      case 'checkbox':
        displayValue = answer.value === 'true' ? '✓ התקבל' : '✗ לא התקבל'
        break
    }

    return (
      <div key={question.id} className="detail-field">
        <div className="label">{question.question_he}</div>
        <div className="value">{displayValue}</div>
        {answer.notes && <div className="value" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{answer.notes}</div>}
      </div>
    )
  }

  if (loading) return <div className="loading">טוען...</div>
  if (!apartment) return <div className="loading">דירה לא נמצאה</div>

  const answersMap = {}
  for (const a of apartment.Answers || []) {
    answersMap[a.question_id] = a
  }

  return (
    <div>
      <Link to="/" className="back-link">→ חזרה לרשימה</Link>

      <div className="header" style={{ borderBottom: 'none', marginBottom: 8 }}>
        <h1 style={{ fontSize: '1.3rem' }}>{apartment.address}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/apartments/${id}/edit`} className="btn btn-secondary">✏️</Link>
          <button onClick={handleDelete} className="btn btn-danger">🗑️</button>
        </div>
      </div>

      {apartment.asking_price && (
        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)', marginBottom: 16 }}>
          {formatPrice(apartment.asking_price)}
        </div>
      )}

      <div className="detail-section">
        {apartment.neighborhood && <div className="detail-field"><div className="label">שכונה</div><div className="value">{apartment.neighborhood}</div></div>}
        {apartment.visit_date && <div className="detail-field"><div className="label">תאריך ביקור</div><div className="value">{new Date(apartment.visit_date).toLocaleDateString('he-IL')}</div></div>}
        {apartment.overall_rating && <div className="detail-field"><div className="label">דירוג</div><div className="value">{'★'.repeat(apartment.overall_rating)}{'☆'.repeat(5 - apartment.overall_rating)}</div></div>}
        {apartment.agent_name && <div className="detail-field"><div className="label">סוכן</div><div className="value">{apartment.agent_name} {apartment.agent_phone && `(${apartment.agent_phone})`}</div></div>}
        {apartment.notes && <div className="detail-field"><div className="label">הערות</div><div className="value">{apartment.notes}</div></div>}
      </div>

      {questions && questions.categories.map(category => {
        const categoryAnswers = category.questions
          .map(q => ({ question: q, answer: answersMap[q.id] }))
          .filter(({ answer }) => answer && (answer.value || answer.notes))

        if (categoryAnswers.length === 0) return null

        return (
          <div key={category.id} className="detail-section">
            <div className="category-header">
              <span>{category.icon}</span>
              <span>{category.name_he}</span>
            </div>
            {categoryAnswers.map(({ question, answer }) => renderAnswer(question, answer))}
          </div>
        )
      })}

      {apartment.Images && apartment.Images.length > 0 && (
        <div className="detail-section">
          <div className="category-header">📷 תמונות</div>
          <div className="image-grid">
            {apartment.Images.map(img => (
              <div key={img.id} className="image-item">
                <img src={getImageUrl(img.id)} alt={img.original_name} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ApartmentDetailPage
