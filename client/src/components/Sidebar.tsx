import React from "react";
import "../styles/Inbox.css";

interface Folder {
  name: string;
  unreadCount: number;
  attributes: string[];
}

interface SidebarProps {
  email: string;
  folders: Folder[];
  selectedFolder: string;
  onSelectFolder: (name: string) => void;
  onCompose: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  email,
  folders,
  selectedFolder,
  onSelectFolder,
  onCompose,
  onLogout,
}: SidebarProps) {
  
  const getSpanishName = (name: string) => {
    const n = name.toUpperCase();
    if (n === "INBOX") return "Recibidos";
    if (n === "SENT" || n === "SENT MESSAGES") return "Enviados";
    if (n === "DRAFTS") return "Borradores";
    if (n === "TRASH" || n === "DELETED MESSAGES") return "Papelera";
    if (n === "JUNK" || n === "SPAM") return "Spam";
    if (n === "ARCHIVE") return "Archivo";
    return name;
  };

  const getIcon = (name: string) => {
    const n = name.toUpperCase();
    if (n === "INBOX") return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    );
    if (n === "SENT" || n === "SENT MESSAGES") return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    );
    if (n === "DRAFTS") return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    );
    if (n === "TRASH" || n === "DELETED MESSAGES") return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    );
    if (n === "JUNK" || n === "SPAM") return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
    );
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    );
  };

  const userInitial = email ? email[0].toUpperCase() : "A";

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
             <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span className="sidebar-title">Arkhon Mail</span>
        </div>
        <div className="sidebar-user-chip">
          <div className="sidebar-user-avatar">{userInitial}</div>
          <span className="sidebar-user-name">{email}</span>
        </div>
      </div>

      <button className="compose-btn" onClick={onCompose}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Redactar
      </button>

      <div className="folders-label">Carpetas</div>
      <div className="folders-list">
        {folders.map((folder) => (
          <button
            key={folder.name}
            className={`folder-item ${selectedFolder === folder.name ? "active" : ""}`}
            onClick={() => onSelectFolder(folder.name)}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {getIcon(folder.name)}
              <span className="folder-name">{getSpanishName(folder.name)}</span>
            </div>
            {folder.unreadCount > 0 && <span className="badge">{folder.unreadCount}</span>}
          </button>
        ))}
      </div>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
