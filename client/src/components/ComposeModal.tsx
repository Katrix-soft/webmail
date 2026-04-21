import React, { useState } from "react";
import axios from "axios";
import "../styles/Inbox.css";

interface ComposeModalProps {
  initialData?: {
    to: string;
    subject: string;
    body: string;
  };
  onClose: () => void;
  onSent: () => void;
}

export default function ComposeModal({
  initialData,
  onClose,
  onSent,
}: ComposeModalProps) {
  const [to, setTo] = useState(initialData?.to || "");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [body, setBody] = useState(initialData?.body || "");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("to", to);
      formData.append("cc", cc);
      formData.append("bcc", bcc);
      formData.append("subject", subject);
      formData.append("body", body);
      
      attachments.forEach((file) => {
        formData.append("attachments", file);
      });

      await axios.post("/api/messages/send", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSent();
      onClose();
    } catch (error) {
      console.error("Failed to send email:", error);
      alert("Error al enviar el correo. Por favor, reintente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="compose-modal">
        <div className="compose-header">
          <span>Mensaje nuevo</span>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <form className="compose-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <div className="field-row">
              <input
                type="text"
                placeholder="Para"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
              />
              <button
                type="button"
                className="cc-bcc-toggle"
                onClick={() => setShowCcBcc(!showCcBcc)}
              >
                Cc/Cco
              </button>
            </div>
          </div>

          {showCcBcc && (
            <>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Cc"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Cco"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <input
              type="text"
              placeholder="Asunto"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="form-group body-group">
            <textarea
              placeholder="Escribe tu mensaje aquí..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          {attachments.length > 0 && (
            <div className="compose-attachments-list">
              {attachments.map((file, i) => (
                <div key={i} className="compose-attachment-item">
                  <span>{file.name}</span>
                  <button type="button" onClick={() => removeAttachment(i)}>×</button>
                </div>
              ))}
            </div>
          )}

          <div className="compose-footer">
            <div className="compose-tools">
              <label className="attach-trigger">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                <input type="file" multiple onChange={handleFileChange} style={{ display: "none" }} />
              </label>
            </div>
            <button className="send-btn" type="submit" disabled={sending}>
              {sending ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
