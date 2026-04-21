import React from "react";

interface Folder {
  name: string;
  unreadCount: number;
  attributes: string[];
}

interface SidebarProps {
  email: string;
  folders: Folder[];
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
  onCompose: () => void;
  onLogout: () => void;
}

/** Map common IMAP folder names to readable labels + icons */
const FOLDER_MAP: Record<string, { label: string; icon: string }> = {
  INBOX:          { label: "Bandeja de entrada", icon: "📥" },
  Sent:           { label: "Enviados",           icon: "📤" },
  "Sent Messages":{ label: "Enviados",           icon: "📤" },
  Drafts:         { label: "Borradores",         icon: "📝" },
  Trash:          { label: "Papelera",           icon: "🗑️" },
  Deleted:        { label: "Eliminados",         icon: "🗑️" },
  Junk:           { label: "Spam",               icon: "🚫" },
  Spam:           { label: "Spam",               icon: "🚫" },
  Archive:        { label: "Archivo",            icon: "📦" },
};

function getFolderInfo(name: string) {
  return FOLDER_MAP[name] ?? { label: name, icon: "📁" };
}

export default function Sidebar({
  email,
  folders,
  selectedFolder,
  onSelectFolder,
  onCompose,
  onLogout,
}: SidebarProps) {
  const displayName = email.split("@")[0];
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          {/* Inline SVG "mail circuit" icon */}
          <div className="sidebar-logo-icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          <span className="sidebar-title">Arkhon Mail</span>
        </div>

        <div className="sidebar-user-chip">
          <div className="sidebar-user-avatar">{avatarLetter}</div>
          <span className="sidebar-user-name">{email}</span>
        </div>
      </div>

      {/* Compose */}
      <button id="compose-btn" onClick={onCompose} className="compose-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
        </svg>
        Redactar
      </button>

      {/* Folders */}
      <span className="folders-label">Carpetas</span>
      <div className="folders-list">
        {folders.map((folder) => {
          const info = getFolderInfo(folder.name);
          return (
            <button
              key={folder.name}
              onClick={() => onSelectFolder(folder.name)}
              className={`folder-item ${selectedFolder === folder.name ? "active" : ""}`}
              title={folder.name}
            >
              <span style={{ flexShrink: 0, fontSize: 14 }}>{info.icon}</span>
              <span className="folder-name">{info.label}</span>
              {folder.unreadCount > 0 && (
                <span className="badge">{folder.unreadCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer / Logout */}
      <div className="sidebar-footer">
        <button id="logout-btn" onClick={onLogout} className="logout-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
