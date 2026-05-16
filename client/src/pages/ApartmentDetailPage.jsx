import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchApartment, fetchQuestions, deleteApartment, uploadImages } from "../api";
import ImageViewer from "../components/ImageViewer";

function ApartmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const [apartment, setApartment] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchApartment(id), fetchQuestions()])
      .then(([apt, q]) => {
        setApartment(apt);
        setQuestions(q);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("למחוק את הדירה?")) return;
    await deleteApartment(id);
    navigate("/");
  };

  const handleCameraUpload = async (files) => {
    if (!files || files.length === 0) return;
    const newImages = await uploadImages(id, files);
    setApartment(prev => ({
      ...prev,
      Images: [...(prev.Images || []), ...newImages],
    }));
  };

  const formatPrice = (price) => {
    if (!price) return null;
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const renderAnswer = (question, answer) => {
    if (!answer || (!answer.value && !answer.notes)) return null;

    let displayValue = answer.value;
    switch (question.answer_type) {
      case "boolean":
      case "boolean_with_notes":
        displayValue =
          answer.value === "yes" ? "כן" : answer.value === "no" ? "לא" : "";
        break;
      case "multi_select":
        try {
          displayValue = JSON.parse(answer.value).join(", ");
        } catch { /* invalid JSON, use raw value */ }
        break;
      case "rating_1_5":
        displayValue = answer.value
          ? "★".repeat(parseInt(answer.value)) +
            "☆".repeat(5 - parseInt(answer.value))
          : "";
        break;
      case "checkbox":
        displayValue = answer.value === "true" ? "✓ התקבל" : "✗ לא התקבל";
        break;
    }

    return (
      <div key={question.id} className="detail-field">
        <div className="label">{question.question_he}</div>
        <div className="value">{displayValue}</div>
        {answer.notes && (
          <div
            className="value"
            style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}
          >
            {answer.notes}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="loading">טוען...</div>;
  if (!apartment) return <div className="loading">דירה לא נמצאה</div>;

  const answersMap = {};
  for (const a of apartment.Answers || []) {
    answersMap[a.question_id] = a;
  }

  return (
    <div className="detail-layout">
      <div className="page-actions-bar">
        <Link to="/" className="back-link">
          → חזרה
        </Link>

        <div style={{ display: "flex", gap: 8, marginRight: "auto" }}>
          <button type="button" className="icon-btn icon-btn-camera" onClick={() => cameraRef.current.click()} title="צלם">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </button>
          <Link to={`/apartments/${id}/edit`} className="icon-btn icon-btn-edit" title="עריכה">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </Link>
          <button onClick={handleDelete} className="icon-btn icon-btn-danger" title="מחק">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => { handleCameraUpload(e.target.files); e.target.value = '' }}
        />
      </div>

      <div className="sub-detail-topbar">
        <h2>{apartment.address}</h2>
        {apartment.asking_price && (
          <div className="detail-price">
            {formatPrice(apartment.asking_price)}
          </div>
        )}
      </div>
      <div className="detail-content">
        <div className="detail-section">
          {apartment.neighborhood && (
            <div className="detail-field">
              <div className="label">שכונה</div>
              <div className="value">{apartment.neighborhood}</div>
            </div>
          )}
          {apartment.visit_date && (
            <div className="detail-field">
              <div className="label">תאריך ביקור</div>
              <div className="value">
                {new Date(apartment.visit_date).toLocaleDateString("he-IL")}
              </div>
            </div>
          )}
          {apartment.overall_rating && (
            <div className="detail-field">
              <div className="label">דירוג</div>
              <div className="value">
                {"★".repeat(apartment.overall_rating)}
                {"☆".repeat(5 - apartment.overall_rating)}
              </div>
            </div>
          )}
          {apartment.Broker && (
            <div className="detail-field">
              <div className="label">מתווך</div>
              <div className="value">
                <Link to="/brokers">{apartment.Broker.full_name}</Link>
              </div>
            </div>
          )}
          {apartment.notes && (
            <div className="detail-field">
              <div className="label">הערות</div>
              <div className="value">{apartment.notes}</div>
            </div>
          )}
        </div>

        {questions &&
          questions.categories.map((category) => {
            const categoryAnswers = category.questions
              .map((q) => ({ question: q, answer: answersMap[q.id] }))
              .filter(({ answer }) => answer && (answer.value || answer.notes));

            if (categoryAnswers.length === 0) return null;

            return (
              <div key={category.id} className="detail-section">
                <div className="category-header">
                  <span>{category.icon}</span>
                  <span>{category.name_he}</span>
                </div>
                {categoryAnswers.map(({ question, answer }) =>
                  renderAnswer(question, answer),
                )}
              </div>
            );
          })}
      </div>

      {apartment.Images && apartment.Images.length > 0 && (
        <div className="detail-footer">
          <ImageViewer images={apartment.Images} address={apartment.address} thumbnailStrip />
        </div>
      )}
    </div>
  );
}

export default ApartmentDetailPage;
