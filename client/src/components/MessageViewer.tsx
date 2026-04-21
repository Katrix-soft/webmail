import React, { useState } from "react";

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

interface Folder {
  name: string;
  unreadCount: number;
  attributes: string[];
}

interface MessageViewerProps {
  email: Email;
  folders: Folder[];
  onBack: () => void;
  onDelete: () => void;
  onMove: (folder: string) => void;
}

const FOLDER_LABELS: Record<string, string> = {
  INBOX:           "Bandeja de entrada",
  Sent:            "Enviados",
  "Sent Messages": "Enviados",
  Drafts:          "Borradores",
  Trash:           "Papelera",
  Junk:            "Spam",
  Archive:         "Archivo",
};

export default function MessageViewer({
  email,
  folders,
  onBack,
  onDelete,
  onMove,
}: MessageViewerProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("¿Eliminar este correo?")) return;
    setLoading(true);
    try {
      await onDelete();
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (folder: string) => {
    setLoading(true);
    try {
      await onMove(folder);
    } finally {
      setLoading(false);
      setShowMoveMenu(false);
    }
  };

  return (
    <div className="message-viewer-container">
      {/* Toolbar */}
      <div className="message-viewer-header">
        <button onClick={onBack} className="back-btn" id="back-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
          </svg>
          Volver
        </button>

        <div className="viewer-actions">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="action-btn delete-btn"
            id="delete-btn"
            title="Eliminar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Eliminar
          </button>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowMoveMenu(!showMoveMenu)}
              className="action-btn"
              id="move-btn"
              title="Mover a carpeta"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
              </svg>
              Mover
            </button>

            {showMoveMenu && (
              <div className="move-menu">
                {folders.map((folder) => (
                  <button
                    key={folder.name}
                    onClick={() => handleMove(folder.name)}
                    className="move-menu-item"
                  >
                    {FOLDER_LABELS[folder.name] ?? folder.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="message-content">
        <div className="message-meta">
          <h2 className="message-subject-title">
            {email.subject || "(Sin asunto)"}
          </h2>
          <div className="message-meta-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
              <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
            De: <strong>{email.from}</strong>
          </div>
          <div className="message-meta-row">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
            </svg>
            {new Date(email.date).toLocaleString("es-AR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        <div className="message-body">
          {email.html ? (
            <iframe
              srcDoc={email.html}
              className="html-iframe"
              title="Contenido del correo"
              sandbox={"allow-same-origin" as any}
            />
          ) : (
            <pre className="text-body">{email.text}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
