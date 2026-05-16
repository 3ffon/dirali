import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchApartment, fetchQuestions, createApartment, updateApartment, saveAnswers, uploadImages, fetchBrokers, isOnline, onIdRemap } from '../api'
import QuestionField from '../components/QuestionField'
import ImageUploader from '../components/ImageUploader'
import PlacesAutocomplete from '../components/PlacesAutocomplete'

const today = () => new Date().toISOString().split('T')[0]

function ApartmentFormPage() {
  const { id } = useParams()

  const [questions, setQuestions] = useState(null)
  const [meta, setMeta] = useState({
    address: '', neighborhood: '', visit_date: today(), asking_price: '',
    broker_id: '', overall_rating: '', notes: '',
    latitude: null, longitude: null,
    pros: '[]', cons: '[]', deal_breakers: '[]',
  })
  const [brokers, setBrokers] = useState([])
  const [answers, setAnswers] = useState({})
  const [images, setImages] = useState([])
  const [apartmentId, setApartmentId] = useState(id || null)
  const [saveStatus, setSaveStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const cameraRef = useRef(null)
  const saveTimer = useRef(null)
  const metaRef = useRef(meta)
  const answersRef = useRef(answers)

  useEffect(() => {
    metaRef.current = meta
  }, [meta])

  useEffect(() => {
    answersRef.current = answers
  }, [answers])

  useEffect(() => {
    const load = async () => {
      const [q, b] = await Promise.all([fetchQuestions(), fetchBrokers()])
      setQuestions(q)
      setBrokers(b)

      if (id) {
        const apt = await fetchApartment(id)
        if (apt) {
          setMeta({
            address: apt.address || '',
            neighborhood: apt.neighborhood || '',
            visit_date: apt.visit_date ? apt.visit_date.split('T')[0] : '',
            asking_price: apt.asking_price || '',
            broker_id: apt.broker_id || '',
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
      }
      setLoading(false)
    }
    load()
  }, [id])

  useEffect(() => {
    const unsub = onIdRemap((tempId, realId) => {
      if (apartmentId === tempId) {
        setApartmentId(realId)
        window.history.replaceState(null, '', `/apartments/${realId}/edit`)
      }
    })
    return unsub
  }, [apartmentId])

  const doSave = useCallback(async () => {
    const currentMeta = metaRef.current
    const currentAnswers = answersRef.current

    if (!currentMeta.address) return

    try {
      let aptId = apartmentId
      const payload = {
        ...currentMeta,
        asking_price: currentMeta.asking_price ? parseInt(currentMeta.asking_price) : null,
        overall_rating: currentMeta.overall_rating ? parseInt(currentMeta.overall_rating) : null,
        visit_date: currentMeta.visit_date || null,
        broker_id: currentMeta.broker_id || null,
      }

      if (!aptId) {
        const created = await createApartment(payload)
        aptId = created.id
        setApartmentId(aptId)
        window.history.replaceState(null, '', `/apartments/${aptId}/edit`)
      } else {
        await updateApartment(aptId, payload)
      }

      const ansArray = Object.entries(currentAnswers).map(([question_id, data]) => ({
        question_id,
        value: data.value,
        notes: data.notes,
      }))
      if (ansArray.length > 0) {
        await saveAnswers(aptId, ansArray)
      }

      setSaveStatus(isOnline() ? 'saved' : 'saved-local')
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
      broker_id: '', overall_rating: '', notes: '',
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
      <div className={`save-indicator ${saveStatus === 'saved' || saveStatus === 'saved-local' ? 'visible' : ''} ${saveStatus === 'saved-local' ? 'save-indicator--local' : ''}`}>
        {saveStatus === 'saved-local' ? '✓ נשמר מקומית' : '✓ נשמר'}
      </div>

      <div className="page-actions-bar">
        <Link to={apartmentId ? `/apartments/${apartmentId}` : '/'} className="back-link">
          → חזרה
        </Link>
        <span className="page-actions-title">{apartmentId ? 'עריכת דירה' : 'דירה חדשה'}</span>
        {apartmentId && (
          <button type="button" className="icon-btn icon-btn-camera" style={{ marginRight: 'auto' }} onClick={() => cameraRef.current.click()} title="צלם">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
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

            <div className="full-width question-field">
              <label>מתווך</label>
              <select
                value={meta.broker_id}
                onChange={e => handleMetaChange('broker_id', e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">ללא מתווך</option>
                {brokers.map(b => (
                  <option key={b.id} value={b.id}>{b.full_name}</option>
                ))}
              </select>
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
            address={meta.address}
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
