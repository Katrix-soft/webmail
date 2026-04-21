import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Inbox.css";

interface Attachment {
  filename: string;
}

interface Email {
  uid: number;
  from: string;
  subject: string;
  text: string;
  date: string;
  flags: string[];
  attachments?: Attachment[];
}

interface MessageListProps {
  folder: string;
  onSelectEmail: (email: any) => void;
}

export default function MessageList({ folder, onSelectEmail }: MessageListProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    setPage(0);
    fetchEmails();
  }, [folder]);

  useEffect(() => {
    if (!searchQuery) {
      fetchEmails();
    }
  }, [page]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/messages/${encodeURIComponent(folder)}?limit=${limit}&offset=${page * limit}`
      );
      setEmails(response.data);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      fetchEmails();
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `/api/messages/${encodeURIComponent(folder)}/search?q=${encodeURIComponent(searchQuery)}`
      );
      setEmails(response.data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  };

  const cleanSenderName = (from: string) => {
    const match = from.match(/^"?(.*?)"?\s*<.*>$/);
    return match ? match[1] : from.split("<")[0].trim();
  };

  return (
    <div className="message-list-container">
      <div className="message-list-header">
        <div className="message-list-header-meta">
          <h2>{folder === "INBOX" ? "Bandeja de Entrada" : folder}</h2>
          <span className="email-count-badge">{emails.length} mensajes</span>
        </div>
        
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Buscar mensajes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
          </button>
        </form>
      </div>

      <div className="message-list">
        {loading ? (
          <div className="empty-state">
            <div className="spinner"></div>
            <p>Cargando mensajes...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <p>No hay mensajes aquí</p>
          </div>
        ) : (
          emails.map((email) => (
            <div
              key={email.uid}
              className={`message-item ${email.flags.includes("\\Seen") ? "" : "unread"}`}
              onClick={() => onSelectEmail(email)}
            >
              <div className="message-sender">
                {!email.flags.includes("\\Seen") && <div className="unread-dot"></div>}
                <span className="sender-name">{cleanSenderName(email.from)}</span>
                {email.attachments && email.attachments.length > 0 && (
                  <span className="attachment-indicator" title="Tiene adjuntos">
                    📎
                  </span>
                )}
              </div>
              <div className="message-date">{formatDate(email.date)}</div>
              <div className="message-subject">{email.subject || "(Sin asunto)"}</div>
              <div className="message-preview">{email.text?.slice(0, 80)}...</div>
            </div>
          ))
        )}
      </div>

      {!searchQuery && (
        <div className="message-list-pagination">
          <button 
            disabled={page === 0} 
            onClick={() => setPage(page - 1)}
            className="pagination-btn"
          >
            Anterior
          </button>
          <span className="page-indicator">Página {page + 1}</span>
          <button 
            disabled={emails.length < limit} 
            onClick={() => setPage(page + 1)}
            className="pagination-btn"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
