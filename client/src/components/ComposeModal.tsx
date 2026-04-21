import React, { useState } from "react";

interface ComposeModalProps {
  email: string;
  onClose: () => void;
  onSend: (data: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    html: string;
    text: string;
  }) => Promise<void>;
}

export default function ComposeModal({
  email,
  onClose,
  onSend,
}: ComposeModalProps) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);

  const handleSend = async () => {
    if (!to.trim()) { setError("El campo 'Para' es obligatorio"); return; }
    if (!subject.trim()) { setError("El asunto es obligatorio"); return; }

    setLoading(true);
    setError("");
    try {
      await onSend({ to, cc: cc || undefined, bcc: bcc || undefined, subject, html: body, text: body });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "No se pudo enviar el correo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Redactar correo">
        {/* Header */}
        <div className="modal-header">
          <h2>Nuevo correo</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
            aria-label="Cerrar"
            id="compose-close-btn"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {error && <div className="alert-error">{error}</div>}

          {/* From (readonly) */}
          <div className="form-group">
            <label className="form-label">De</label>
            <input
              type="email"
              value={email}
              disabled
              className="form-input"
            />
          </div>

          {/* To */}
          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label className="form-label" htmlFor="compose-to">Para *</label>
              <button
                type="button"
                onClick={() => setShowCcBcc(!showCcBcc)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  color: "var(--primary)",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                {showCcBcc ? "Ocultar CC/BCC" : "CC / BCC"}
              </button>
            </div>
            <input
              id="compose-to"
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="destinatario@ejemplo.com"
              className="form-input"
              multiple
            />
          </div>

          {/* CC / BCC (collapsible) */}
          {showCcBcc && (
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="compose-cc">CC</label>
                <input
                  id="compose-cc"
                  type="email"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Opcional"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="compose-bcc">BCC</label>
                <input
                  id="compose-bcc"
                  type="email"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="Opcional"
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="form-group">
            <label className="form-label" htmlFor="compose-subject">Asunto *</label>
            <input
              id="compose-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del correo"
              className="form-input"
            />
          </div>

          {/* Message */}
          <div className="form-group">
            <label className="form-label" htmlFor="compose-body">Mensaje *</label>
            <textarea
              id="compose-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribí tu mensaje aquí…"
              rows={10}
              className="form-textarea"
            />
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
              id="compose-cancel-btn"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={loading}
              className="btn-primary"
              id="compose-send-btn"
            >
              {loading ? (
                <>
                  <span style={{ display: "inline-block", marginRight: 6, verticalAlign: "middle" }}>
                    ⏳
                  </span>
                  Enviando…
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: "middle", marginRight: 6 }}>
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                  Enviar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
