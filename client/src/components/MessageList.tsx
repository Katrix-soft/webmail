import React, { useState, useEffect } from "react";
import axios from "axios";

interface Email {
  uid: number;
  seqno: number;
  from: string;
  subject: string;
  text: string;
  html: string;
  date: Date;
  flags: string[];
}

interface MessageListProps {
  folder: string;
  onSelectEmail: (email: Email) => void;
}

const FOLDER_LABELS: Record<string, string> = {
  INBOX:           "Bandeja de entrada",
  Sent:            "Enviados",
  "Sent Messages": "Enviados",
  Drafts:          "Borradores",
  Trash:           "Papelera",
  Deleted:         "Eliminados",
  Junk:            "Spam",
  Archive:         "Archivo",
};

function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Ayer";
  } else {
    return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  }
}

function formatSender(from: string): string {
  // Extract "Name" from "Name <email>" or return the raw string
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from;
}

const isUnread = (flags: string[]) => !flags.includes("\\Seen");

export default function MessageList({ folder, onSelectEmail }: MessageListProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [folder]);

  useEffect(() => {
    loadMessages();
  }, [folder, page]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/messages/${encodeURIComponent(folder)}?limit=50&offset=${page * 50}`
      );
      setEmails(response.data);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  const folderLabel = FOLDER_LABELS[folder] ?? folder;

  if (loading && emails.length === 0) {
    return (
      <div className="message-list-container">
        <div className="loading-screen" style={{ flex: 1 }}>
          <div className="loading-inner">
            <div className="spinner" />
            <p>Cargando mensajes…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list-container">
      {/* Header */}
      <div className="message-list-header">
        <div className="message-list-header-meta">
          <h2>{folderLabel}</h2>
        </div>
        <span className="email-count-badge">
          {emails.length} {emails.length === 1 ? "mensaje" : "mensajes"}
        </span>
      </div>

      {/* Empty state */}
      {emails.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <p>Esta carpeta está vacía</p>
        </div>
      ) : (
        <>
          <div className="message-list">
            {emails.map((email) => {
              const unread = isUnread(email.flags);
              return (
                <div
                  key={`${email.uid}-${email.seqno}`}
                  onClick={() => onSelectEmail(email)}
                  className={`message-item ${unread ? "unread" : ""}`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onSelectEmail(email)}
                >
                  <div className="message-sender">
                    {unread && <div className="unread-dot" />}
                    <span className="sender-name">{formatSender(email.from)}</span>
                  </div>
                  <div className="message-date">{formatDate(email.date)}</div>
                  <div className="message-subject">
                    {email.subject || "(Sin asunto)"}
                  </div>
                  {email.text && (
                    <div className="message-preview">
                      {email.text.substring(0, 120)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="message-pagination">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="pagination-btn"
              id="prev-page-btn"
            >
              ← Anterior
            </button>
            <span className="page-indicator">Página {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={emails.length < 50}
              className="pagination-btn"
              id="next-page-btn"
            >
              Siguiente →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
