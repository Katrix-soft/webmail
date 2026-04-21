import React, { useState } from "react";
import "../styles/Inbox.css";

interface ComposeModalProps {
  email: string;
  initialData?: {
    to: string;
    subject: string;
    text: string;
  };
  onClose: () => void;
  onSend: (data: any) => Promise<void>;
}

export default function ComposeModal({
  email,
  initialData,
  onClose,
  onSend,
}: ComposeModalProps) {
  const [to, setTo] = useState(initialData?.to || "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [body, setBody] = useState(initialData?.text || "");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [showExtra, setShowExtra] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!to || !subject) {
      setError("Destinatario y Asunto son requeridos");
      return;
    }

    setIsSending(true);
    setError("");
    try {
      await onSend({
        to,
        cc,
        bcc,
        subject,
        text: body,
        html: `<div>${body.replace(/\n/g, "<br>")}</div>`,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || "Error al enviar el mensaje");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h2>Redactar Mensaje</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && <div className="alert-error">{error}</div>}

          <div className="form-group">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label className="form-label">Para</label>
              <button
                type="button"
                className="btn-text-only"
                onClick={() => setShowExtra(!showExtra)}
              >
                {showExtra ? "Ocultar CC/BCC" : "CC/BCC"}
              </button>
            </div>
            <input
              className="form-input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="ejemplo@correo.com"
              disabled={isSending}
            />
          </div>

          {showExtra && (
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">CC</label>
                <input
                  className="form-input"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">BCC</label>
                <input
                  className="form-input"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Asunto</label>
            <input
              className="form-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Asunto del mensaje"
              disabled={isSending}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mensaje</label>
            <textarea
              className="form-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              disabled={isSending}
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSending}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isSending}>
              {isSending ? "Enviando..." : "Enviar Mensaje"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
