import React, { useState, useEffect } from "react";
import axios from "axios";
import Login from "./pages/Login";
import Inbox from "./pages/Inbox";
import "./App.css";

interface SessionData {
  authenticated: boolean;
  email?: string;
}

function App() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await axios.get("/api/auth/session");
      setSession(response.data);
    } catch {
      setSession({ authenticated: false });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-inner">
          <div className="spinner" />
          <p>Iniciando Arkhon Mail…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {session?.authenticated ? (
        <Inbox
          email={session.email!}
          onLogout={() => {
            setSession({ authenticated: false });
          }}
        />
      ) : (
        <Login onLogin={() => checkSession()} />
      )}
    </div>
  );
}

export default App;
