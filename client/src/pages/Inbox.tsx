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
  from: string;
  subject: string;
  text: string;
  html: string;
  date: string;
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
  const [composeInitialData, setComposeInitialData] = useState<any>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      onLogout();
    }
  };

  const handleSelectEmail = (e: Email) => {
    setSelectedEmail(e);
    setIsSidebarOpen(false);
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

  const handleReply = (email: Email) => {
    const fromMatch = email.from.match(/<(.+?)>/) || [null, email.from];
    const to = fromMatch[1] || email.from;
    
    setComposeInitialData({
      to,
      subject: email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`,
      text: `\n\n--- El ${new Date(email.date).toLocaleString()} escribió ---\n\n${email.text}`,
    });
    setShowCompose(true);
  };

  const handleSendEmail = async (data: any) => {
    await axios.post("/api/compose/send", data);
    setShowCompose(false);
    setComposeInitialData(null);
    loadFolders();
  };

  return (
    <div className="inbox-container">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

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
            setComposeInitialData(null);
            setShowCompose(true);
            setIsSidebarOpen(false);
          }}
          onLogout={handleLogout}
        />
      </div>

      <div className="inbox-content">
        <div className="mobile-header">
          <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
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
            onBack={() => {
              setSelectedEmail(null);
              loadFolders(); // Reload to refresh read status
            }}
            onDelete={handleDeleteEmail}
            onMove={handleMoveEmail}
            onReply={handleReply}
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
          initialData={composeInitialData}
          onClose={() => {
            setShowCompose(false);
            setComposeInitialData(null);
          }}
          onSend={handleSendEmail}
        />
      )}
    </div>
  );
}
