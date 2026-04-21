import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Inbox.css";

interface Attachment { filename: string; }
interface Email { uid: number; from: string; subject: string; text: string; date: string; flags: string[]; attachments?: Attachment[]; }
interface MessageListProps { folder: string; onSelectEmail: (email: any) => void; }

export default function MessageList({ folder, onSelectEmail }: MessageListProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => { setPage(0); fetchEmails(); }, [folder]);
  useEffect(() => { if (!searchQuery) fetchEmails(); }, [page]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/messages/${encodeURIComponent(folder)}?limit=${limit}&offset=${page * limit}`);
      setEmails(response.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const toggleStar = async (e: React.MouseEvent, email: Email) => {
    e.stopPropagation();
    const isStarred = email.flags.includes("\\Flagged");
    const action = isStarred ? "unstar" : "star";
    try {
      await axios.post(`/api/messages/${encodeURIComponent(folder)}/${email.uid}/${action}`);
      setEmails(emails.map(emp => emp.uid === email.uid ? { ...emp, flags: isStarred ? emp.flags.filter(f => f !== "\\Flagged") : [...emp.flags, "\\Flagged"] } : emp));
    } catch (error) { console.error(error); }
  };

  const cleanSenderName = (from: string) => {
    const match = from.match(/^"?(.*?)"?\s*<.*>$/);
    return match ? match[1] : from.split("<")[0].trim();
  };

  const getAvatarColor = (name: string) => {
    const colors = ["#008B8B", "#2D2D2D", "#E63946", "#457B9D", "#1D3557", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="message-list-container">
      <div className="message-list-header">
        <div className="message-list-header-meta">
          <h2>{folder === "INBOX" ? "Recibidos" : folder}</h2>
          {!loading && <span className="email-count-badge">{emails.length} mensajes</span>}
        </div>
        <form className="search-bar" onSubmit={(e) => { e.preventDefault(); fetchEmails(); }}>
          <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <button type="submit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></button>
        </form>
      </div>

      <div className="message-list">
        {loading ? (
          <div className="empty-state"><div className="spinner"></div><p>Cargando...</p></div>
        ) : (
          emails.map((email) => {
            const sender = cleanSenderName(email.from);
            return (
              <div key={email.uid} className={`message-item ${email.flags.includes("\\Seen") ? "" : "unread"}`} onClick={() => onSelectEmail(email)}>
                <div className="message-list-left">
                  <div className={`star-icon ${email.flags.includes("\\Flagged") ? "starred" : ""}`} onClick={(e) => toggleStar(e, email)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={email.flags.includes("\\Flagged") ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </div>
                  <div className="sender-avatar" style={{ backgroundColor: getAvatarColor(sender) }}>{sender?.[0]?.toUpperCase()}</div>
                  <div className="message-sender-info">
                    <span className="sender-name">{sender}</span>
                    {email.attachments && email.attachments.length > 0 && <span className="attachment-indicator">📎</span>}
                  </div>
                </div>
                <div className="message-subject-preview">
                  <span className="subject-text">{email.subject || "(Sin asunto)"}</span>
                  <span className="preview-text"> — {email.text?.slice(0, 80)}...</span>
                </div>
                <div className="message-date">{new Date(email.date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
