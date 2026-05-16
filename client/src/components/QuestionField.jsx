


function QuestionField({ question, value, notes, onChange }) {
  const handleChange = (newValue, newNotes) => {
    onChange(question.id, newValue ?? value, newNotes ?? notes)
  }

  switch (question.answer_type) {
    case 'text':
      return (
        <div className="question-field">
          <label>{question.question_he}</label>
          <textarea
            value={value || ''}
            onChange={e => handleChange(e.target.value, notes)}
            rows={2}
          />
        </div>
      )

    case 'number':
      return (
        <div className="question-field">
          <label>{question.question_he}{question.unit ? ` (${question.unit})` : ''}</label>
          <input
            type="number"
            value={value || ''}
            onChange={e => handleChange(e.target.value, notes)}
          />
        </div>
      )

    case 'boolean':
      return (
        <div className="question-field">
          <label>{question.question_he}</label>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${value === 'yes' ? 'active' : ''}`}
              onClick={() => handleChange(value === 'yes' ? '' : 'yes', notes)}
            >כן</button>
            <button
              type="button"
              className={`toggle-btn ${value === 'no' ? 'active' : ''}`}
              onClick={() => handleChange(value === 'no' ? '' : 'no', notes)}
            >לא</button>
          </div>
        </div>
      )

    case 'boolean_with_notes':
      return (
        <div className="question-field">
          <label>{question.question_he}</label>
          <div className="toggle-group" style={{ marginBottom: 8 }}>
            <button
              type="button"
              className={`toggle-btn ${value === 'yes' ? 'active' : ''}`}
              onClick={() => handleChange(value === 'yes' ? '' : 'yes', notes)}
            >כן</button>
            <button
              type="button"
              className={`toggle-btn ${value === 'no' ? 'active' : ''}`}
              onClick={() => handleChange(value === 'no' ? '' : 'no', notes)}
            >לא</button>
          </div>
          <textarea
            placeholder="הערות..."
            value={notes || ''}
            onChange={e => handleChange(value, e.target.value)}
            rows={2}
          />
        </div>
      )

    case 'multi_select': {
      const selected = value ? JSON.parse(value) : []
      return (
        <div className="question-field">
          <label>{question.question_he}</label>
          <div className="multi-select-group">
            {(question.options || []).map(opt => (
              <button
                key={opt}
                type="button"
                className={`multi-select-btn ${selected.includes(opt) ? 'active' : ''}`}
                onClick={() => {
                  const next = selected.includes(opt)
                    ? selected.filter(s => s !== opt)
                    : [...selected, opt]
                  handleChange(JSON.stringify(next), notes)
                }}
              >{opt}</button>
            ))}
          </div>
        </div>
      )
    }
    case 'rating_1_5':
      return (
        <div className="question-field">
          <label>{question.question_he}</label>
          <div className="rating-group">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                className={`rating-btn ${parseInt(value) === n ? 'active' : ''}`}
                onClick={() => handleChange(parseInt(value) === n ? '' : String(n), notes)}
              >{n}</button>
            ))}
          </div>
        </div>
      )

    case 'checkbox':
      return (
        <div className="question-field">
          <div className="checkbox-field">
            <input
              type="checkbox"
              checked={value === 'true'}
              onChange={e => handleChange(String(e.target.checked), notes)}
            />
            <label>{question.question_he}</label>
          </div>
        </div>
      )

    default:
      return (
        <div className="question-field">
          <label>{question.question_he}</label>
          <input value={value || ''} onChange={e => handleChange(e.target.value, notes)} />
        </div>
      )
  }
}

export default QuestionField
