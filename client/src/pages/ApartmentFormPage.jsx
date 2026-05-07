import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fetchApartment, fetchQuestions, createApartment, updateApartment, saveAnswers, uploadImages } from '../api'
import QuestionField from '../components/QuestionField'
import ImageUploader from '../components/ImageUploader'
import PlacesAutocomplete from '../components/PlacesAutocomplete'

const today = () => new Date().toISOString().split('T')[0]

function ApartmentFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [questions, setQuestions] = useState(null)
  const [meta, setMeta] = useState({
    address: '', neighborhood: '', visit_date: today(), asking_price: '',
    agent_name: '', agent_phone: '', overall_rating: '', notes: '',
    latitude: null, longitude: null,
    pros: '[]', cons: '[]', deal_breakers: '[]',
  })
  const [answers, setAnswers] = useState({})
  const [images, setImages] = useState([])
  const [apartmentId, setApartmentId] = useState(id || null)
  const [saveStatus, setSaveStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const cameraRef = useRef(null)
  const saveTimer = useRef(null)
  const metaRef = useRef(meta)
  const answersRef = useRef(answers)

  metaRef.current = meta
  answersRef.current = answers

  useEffect(() => {
    const load = async () => {
      const q = await fetchQuestions()
      setQuestions(q)

      if (id) {
        const apt = await fetchApartment(id)
        setMeta({
          address: apt.address || '',
          neighborhood: apt.neighborhood || '',
          visit_date: apt.visit_date ? apt.visit_date.split('T')[0] : '',
          asking_price: apt.asking_price || '',
          agent_name: apt.agent_name || '',
          agent_phone: apt.agent_phone || '',
          overall_rating: apt.overall_rating || '',
          notes: apt.notes || '',
          latitude: apt.latitude || null,
          longitude: apt.longitude || null,
          pros: apt.pros || '[]',
          cons: apt.cons || '[]',
          deal_breakers: apt.deal_breakers || '[]',
        })
        const ansMap = {}
        for (const a of apt.Answers || []) {
          ansMap[a.question_id] = { value: a.value, notes: a.notes }
        }
        setAnswers(ansMap)
        setImages(apt.Images || [])
      }
      setLoading(false)
    }
    load()
  }, [id])

  const doSave = useCallback(async () => {
    const currentMeta = metaRef.current
    const currentAnswers = answersRef.current

    if (!currentMeta.address) return

    try {
      let aptId = apartmentId
      if (!aptId) {
        const created = await createApartment({
          ...currentMeta,
          asking_price: currentMeta.asking_price ? parseInt(currentMeta.asking_price) : null,
          overall_rating: currentMeta.overall_rating ? parseInt(currentMeta.overall_rating) : null,
          visit_date: currentMeta.visit_date || null,
        })
        aptId = created.id
        setApartmentId(aptId)
        window.history.replaceState(null, '', `/apartments/${aptId}/edit`)
      } else {
        await updateApartment(aptId, {
          ...currentMeta,
          asking_price: currentMeta.asking_price ? parseInt(currentMeta.asking_price) : null,
          overall_rating: currentMeta.overall_rating ? parseInt(currentMeta.overall_rating) : null,
          visit_date: currentMeta.visit_date || null,
        })
      }

      const ansArray = Object.entries(currentAnswers).map(([question_id, data]) => ({
        question_id,
        value: data.value,
        notes: data.notes,
      }))
      if (ansArray.length > 0) {
        await saveAnswers(aptId, ansArray)
      }

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(''), 2000)
    } catch (e) {
      console.error('Save error', e)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(''), 3000)
    }
  }, [apartmentId])

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaveStatus('saving')
    saveTimer.current = setTimeout(() => doSave(), 1500)
  }, [doSave])

  const handleMetaChange = (field, value) => {
    setMeta(prev => ({ ...prev, [field]: value }))
    scheduleSave()
  }

  const handleAnswerChange = (questionId, value, notes) => {
    setAnswers(prev => ({ ...prev, [questionId]: { value, notes } }))
    scheduleSave()
  }

  const handleReset = () => {
    if (!confirm('לאפס את כל הטופס?')) return
    setMeta({
      address: '', neighborhood: '', visit_date: today(), asking_price: '',
      agent_name: '', agent_phone: '', overall_rating: '', notes: '',
      latitude: null, longitude: null,
      pros: '[]', cons: '[]', deal_breakers: '[]',
    })
    setAnswers({})
  }

  const handleManualSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    doSave()
  }

  const handleCameraUpload = async (files) => {
    if (!files || files.length === 0 || !apartmentId) return
    const newImages = await uploadImages(apartmentId, files)
    setImages(prev => [...prev, ...newImages])
  }

  if (loading) return <div className="loading">טוען...</div>

  return (
    <div className="form-layout">
      <div className={`save-indicator ${saveStatus === 'saved' ? 'visible' : ''}`}>
        ✓ נשמר
      </div>

      <div className="form-topbar">
        <Link to={apartmentId ? `/apartments/${apartmentId}` : '/'} className="back-link">
          → חזרה
        </Link>
        {apartmentId && (
          <button type="button" className="btn btn-secondary" style={{ marginRight: 'auto' }} onClick={() => cameraRef.current.click()}>
            📸
          </button>
        )}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => { handleCameraUpload(e.target.files); e.target.value = '' }}
        />
      </div>

      <div className="form-content">
        <div className="category-section">
          <div className="category-header">📝 פרטים כלליים</div>

          <div className="apartment-meta">
            <div className="full-width">
              <div className="question-field">
                <label>כתובת *</label>
                <PlacesAutocomplete
                  value={meta.address}
                  onChange={val => handleMetaChange('address', val)}
                  onPlaceSelect={({ address, lat, lng, neighborhood }) => {
                    setMeta(prev => ({
                      ...prev,
                      address,
                      latitude: lat,
                      longitude: lng,
                      neighborhood: neighborhood || prev.neighborhood,
                    }))
                    scheduleSave()
                  }}
                  placeholder="חפש כתובת..."
                />
              </div>
            </div>

            <div className="question-field">
              <label>שכונה</label>
              <input
                value={meta.neighborhood}
                onChange={e => handleMetaChange('neighborhood', e.target.value)}
              />
            </div>

            <div className="question-field">
              <label>תאריך ביקור</label>
              <input
                type="date"
                value={meta.visit_date}
                onChange={e => handleMetaChange('visit_date', e.target.value)}
              />
            </div>

            <div className="question-field">
              <label>מחיר מבוקש (₪)</label>
              <input
                type="number"
                value={meta.asking_price}
                onChange={e => handleMetaChange('asking_price', e.target.value)}
              />
            </div>

            <div className="question-field">
              <label>דירוג כללי</label>
              <div className="rating-group">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`rating-btn ${parseInt(meta.overall_rating) === n ? 'active' : ''}`}
                    onClick={() => handleMetaChange('overall_rating', parseInt(meta.overall_rating) === n ? '' : String(n))}
                  >{n}</button>
                ))}
              </div>
            </div>

            <div className="question-field">
              <label>שם סוכן/מתווך</label>
              <input
                value={meta.agent_name}
                onChange={e => handleMetaChange('agent_name', e.target.value)}
              />
            </div>

            <div className="question-field">
              <label>טלפון סוכן</label>
              <input
                type="tel"
                value={meta.agent_phone}
                onChange={e => handleMetaChange('agent_phone', e.target.value)}
              />
            </div>

            <div className="full-width question-field">
              <label>הערות כלליות</label>
              <textarea
                value={meta.notes}
                onChange={e => handleMetaChange('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        {questions && questions.categories.map(category => (
          <div key={category.id} className="category-section">
            <div className="category-header">
              <span>{category.icon}</span>
              <span>{category.name_he}</span>
            </div>
            {category.description_he && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 12 }}>
                {category.description_he}
              </p>
            )}
            {category.questions.map(q => (
              <QuestionField
                key={q.id}
                question={q}
                value={answers[q.id]?.value || ''}
                notes={answers[q.id]?.notes || ''}
                onChange={handleAnswerChange}
              />
            ))}
          </div>
        ))}

        {apartmentId && (
          <ImageUploader
            apartmentId={apartmentId}
            images={images}
            onUpdate={setImages}
          />
        )}

        {!apartmentId && meta.address && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 20 }}>
            הדירה תישמר אוטומטית ואז תוכלו להוסיף תמונות
          </p>
        )}
      </div>

      <div className="form-footer">
        <button type="button" className="btn btn-secondary" onClick={handleReset}>איפוס</button>
        <button type="button" className="btn btn-primary" onClick={handleManualSave}>שמור</button>
      </div>
    </div>
  )
}

export default ApartmentFormPage
