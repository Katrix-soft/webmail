import express from "express";
import sessionModule from "express-session";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import authRoutes from "./routes/auth.js";
import foldersRoutes from "./routes/folders.js";
import messagesRoutes from "./routes/messages.js";
import composeRoutes from "./routes/compose.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

app.use(
  sessionModule({
    secret: "arkhon-webmail-secret-key-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/folders", foldersRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/compose", composeRoutes);

// Serve React frontend
app.use(express.static(join(__dirname, "../public")));

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
