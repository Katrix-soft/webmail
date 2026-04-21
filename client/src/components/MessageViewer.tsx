import React, { useState } from "react";
import axios from "axios";
import "../styles/Inbox.css";

interface Attachment {
  partId: string;
  filename: string;
  contentType: string;
  size: number;
}

interface Email {
  uid: number;
  from: string;
  subject: string;
  text: string;
  html: string;
  date: string;
  flags: string[];
  attachments?: Attachment[];
}

interface MessageViewerProps {
  email: Email;
  folders: any[];
  onBack: () => void;
  onDelete: () => void;
  onMove: (to: string) => void;
  onReply?: (email: Email) => void;
}

export default function MessageViewer({
  email,
  folders,
  onBack,
  onDelete,
  onMove,
  onReply,
}: MessageViewerProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [isRead, setIsRead] = useState(email.flags.includes("\\Seen"));

  const toggleRead = async () => {
    try {
      const action = isRead ? "mark-unread" : "mark-read";
      await axios.post(`/api/messages/INBOX/${email.uid}/${action}`);
      setIsRead(!isRead);
    } catch (error) {
      console.error("Toggle read failed:", error);
    }
  };

  const handleDownload = async (partId: string, filename: string) => {
    try {
      const response = await axios.get(
        `/api/messages/INBOX/${email.uid}/attachments/${partId}`,
        { responseType: "blob" }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Download failed:", error);
      alert("Error al descargar el archivo");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="message-viewer-container">
      <div className="message-viewer-header">
        <button className="back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </button>

        <div className="viewer-actions">
          <button className="action-btn" onClick={() => onReply?.(email)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
            </svg>
            Responder
          </button>

          <button className="action-btn" onClick={toggleRead}>
            {isRead ? "Marcar no leído" : "Marcar como leído"}
          </button>

          <div style={{ position: "relative" }}>
            <button
              className="action-btn"
              onClick={() => setShowMoveMenu(!showMoveMenu)}
            >
              Mover a
            </button>
            {showMoveMenu && (
              <div className="move-menu">
                {folders.map((f) => (
                  <button
                    key={f.name}
                    className="move-menu-item"
                    onClick={() => {
                      onMove(f.name);
                      setShowMoveMenu(false);
                    }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="action-btn delete-btn" onClick={onDelete}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
            </svg>
            Eliminar
          </button>
        </div>
      </div>

      <div className="message-content">
        <div className="message-meta">
          <h1 className="message-subject-title">{email.subject || "(Sin asunto)"}</h1>
          <div className="message-meta-row">
            <strong>De:</strong> {email.from}
          </div>
          <div className="message-meta-row">
            <strong>Fecha:</strong> {formatDate(email.date)}
          </div>
        </div>

        {email.attachments && email.attachments.length > 0 && (
          <div className="attachments-section">
            <h3 className="attachments-title">Adjuntos ({email.attachments.length})</h3>
            <div className="attachments-grid">
              {email.attachments.map((att) => (
                <div key={att.partId} className="attachment-card" onClick={() => handleDownload(att.partId, att.filename)}>
                  <div className="attachment-icon">📁</div>
                  <div className="attachment-info">
                    <div className="attachment-name">{att.filename}</div>
                    <div className="attachment-size">{formatSize(att.size)}</div>
                  </div>
                  <div className="attachment-download-icon">⬇️</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="message-body">
          {email.html ? (
            <iframe
              title="Email Content"
              className="html-iframe"
              srcDoc={email.html}
            />
          ) : (
            <div className="text-body">{email.text}</div>
          )}
        </div>
      </div>
    </div>
  );
}
