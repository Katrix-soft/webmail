import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../components/Sidebar";
import MessageList from "../components/MessageList";
import MessageViewer from "../components/MessageViewer";
import ComposeModal from "../components/ComposeModal";
import "../styles/Inbox.css";

interface Folder {
  name: string;
  unreadCount: number;
  attributes: string[];
}

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

interface InboxProps {
  email: string;
  onLogout: () => void;
}

export default function Inbox({ email, onLogout }: InboxProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState("INBOX");
  const [showCompose, setShowCompose] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const response = await axios.get("/api/folders");
      setFolders(response.data);
    } catch (error) {
      console.error("Failed to load folders:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      onLogout();
    } catch (error) {
      console.error("Logout error:", error);
      onLogout();
    }
  };

  const handleSelectEmail = (e: Email) => {
    setSelectedEmail(e);
    setIsSidebarOpen(false); // Close sidebar on mobile when selecting email
  };

  const handleDeleteEmail = async () => {
    if (!selectedEmail) return;
    try {
      await axios.delete(
        `/api/messages/${encodeURIComponent(selectedFolder)}/${selectedEmail.uid}`
      );
      setSelectedEmail(null);
      loadFolders();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleMoveEmail = async (toFolder: string) => {
    if (!selectedEmail) return;
    try {
      await axios.post(
        `/api/messages/${encodeURIComponent(selectedFolder)}/${selectedEmail.uid}/move`,
        { toFolder }
      );
      setSelectedEmail(null);
      loadFolders();
    } catch (error) {
      console.error("Move failed:", error);
    }
  };

  const handleSendEmail = async (data: {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    html: string;
    text: string;
  }) => {
    try {
      await axios.post("/api/compose/send", data);
      setShowCompose(false);
      loadFolders();
    } catch (error) {
      console.error("Send failed:", error);
      throw error;
    }
  };

  return (
    <div className="inbox-container">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
        <Sidebar
          email={email}
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={(f) => {
            setSelectedFolder(f);
            setIsSidebarOpen(false);
            setSelectedEmail(null);
          }}
          onCompose={() => {
            setShowCompose(true);
            setIsSidebarOpen(false);
          }}
          onLogout={handleLogout}
        />
      </div>

      <div className="inbox-content">
        {/* Mobile Header */}
        <div className="mobile-header">
          <button 
            className="menu-toggle"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
          <span className="mobile-title">Arkhon Mail</span>
        </div>

        {selectedEmail ? (
          <MessageViewer
            email={selectedEmail}
            folders={folders}
            onBack={() => setSelectedEmail(null)}
            onDelete={handleDeleteEmail}
            onMove={handleMoveEmail}
          />
        ) : (
          <MessageList
            folder={selectedFolder}
            onSelectEmail={handleSelectEmail}
          />
        )}
      </div>

      {showCompose && (
        <ComposeModal
          email={email}
          onClose={() => setShowCompose(false)}
          onSend={handleSendEmail}
        />
      )}
    </div>
  );
}
