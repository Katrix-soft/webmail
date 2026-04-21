import { Router, Request, Response } from "express";
import { SmtpService } from "../services/smtp.js";
import { ImapService } from "../services/imap.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/send", async (req: Request, res: Response) => {
  try {
    const { to, cc, bcc, subject, html, text } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: "to and subject required" });
    }

    const smtp = new SmtpService(req.session.email!, req.session.password!);

    const messageId = await smtp.sendEmail(to, cc || "", bcc || "", subject, html || "", text || "");

    res.json({
      success: true,
      messageId,
    });
  } catch (error: any) {
    console.error("Send error:", error);
    res.status(500).json({
      error: "Failed to send email",
    });
  }
});

router.post("/saveDraft", async (req: Request, res: Response) => {
  try {
    const { to, cc, bcc, subject, html, text } = req.body;

    if (!to || !subject) {
      return res.status(400).json({ error: "to and subject required" });
    }

    const smtp = new SmtpService(req.session.email!, req.session.password!);

    // Save as draft by sending to self with specific headers
    const messageId = await smtp.sendEmail(
      req.session.email!,
      cc || "",
      bcc || "",
      `[DRAFT] ${subject}`,
      html || "",
      text || ""
    );

    res.json({
      success: true,
      messageId,
    });
  } catch (error: any) {
    console.error("Draft save error:", error);
    res.status(500).json({
      error: "Failed to save draft",
    });
  }
});

export default router;
