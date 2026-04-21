import { Router, Request, Response } from "express";
import { ImapService } from "../services/imap.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Test IMAP connection
    const imap = new ImapService(email, password);
    await imap.connect();
    await imap.disconnect();

    // Store credentials in session
    req.session.email = email;
    req.session.password = password;

    res.json({
      success: true,
      email,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(401).json({
      error:
        error.message ||
        "Invalid credentials or IMAP server unreachable",
    });
  }
});

router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ success: true });
  });
});

router.get("/session", (req: Request, res: Response) => {
  if (req.session.email && req.session.password) {
    res.json({ authenticated: true, email: req.session.email });
  } else {
    res.json({ authenticated: false });
  }
});

export default router;
