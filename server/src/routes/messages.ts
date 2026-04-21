import { Router, Request, Response } from "express";
import { ImapService } from "../services/imap.ts";
import { SmtpService } from "../services/smtp.ts";
import { requireAuth } from "../middleware/auth.ts";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.get("/:folder", async (req: Request, res: Response) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const imap = new ImapService(req.session.email!, req.session.password!);
    await imap.connect();
    const emails = await imap.fetchEmails(folder, limit, offset);
    await imap.disconnect();
    res.json(emails);
  } catch (error: any) {
    console.error("Messages error:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

router.get("/:folder/search", async (req: Request, res: Response) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: "Search query required" });
    const imap = new ImapService(req.session.email!, req.session.password!);
    await imap.connect();
    const emails = await imap.searchEmails(folder, query);
    await imap.disconnect();
    res.json(emails);
  } catch (error: any) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Failed to search messages" });
  }
});

router.get("/:folder/:uid", async (req: Request, res: Response) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);
    const imap = new ImapService(req.session.email!, req.session.password!);
    await imap.connect();
    const email = await imap.getEmail(folder, uid);
    await imap.markAsRead(folder, uid);
    await imap.disconnect();
    res.json(email);
  } catch (error: any) {
    console.error("Message error:", error);
    res.status(500).json({ error: "Failed to fetch message" });
  }
});

router.delete("/:folder/:uid", async (req: Request, res: Response) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);
    const imap = new ImapService(req.session.email!, req.session.password!);
    await imap.connect();
    await imap.deleteEmail(folder, uid);
    await imap.disconnect();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

router.post("/:folder/:uid/move", async (req: Request, res: Response) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);
    const { toFolder } = req.body;
    if (!toFolder) return res.status(400).json({ error: "toFolder required" });
    const imap = new ImapService(req.session.email!, req.session.password!);
    await imap.connect();
    await imap.moveEmail(folder, toFolder, uid);
    await imap.disconnect();
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to move message" });
  }
});

router.post("/send", upload.array("attachments"), async (req: Request, res: Response) => {
  try {
    const { to, cc, bcc, subject, body } = req.body;
    const smtp = new SmtpService(req.session.email!, req.session.password!);
    const attachments = (req.files as any[])?.map(file => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype
    })) || [];
    await smtp.sendEmail(to, cc, bcc, subject, body, body, attachments);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to send email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

router.post("/:folder/:uid/star", async (req: Request, res: Response) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);
    const imap = new ImapService(req.session.email!, req.session.password!);
    await imap.connect();
    await imap.toggleStar(folder, uid, true);
    await imap.disconnect();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to star email" });
  }
});

router.post("/:folder/:uid/unstar", async (req: Request, res: Response) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);
    const imap = new ImapService(req.session.email!, req.session.password!);
    await imap.connect();
    await imap.toggleStar(folder, uid, false);
    await imap.disconnect();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to unstar email" });
  }
});

router.get("/:folder/:uid/attachments/:partId", async (req: Request, res: Response) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);
    const partId = req.params.partId;
    const imap = new ImapService(req.session.email!, req.session.password!);
    await imap.connect();
    const email = await imap.getEmail(folder, uid);
    await imap.disconnect();
    const attachment = email.attachments?.find((att: any) => att.partId === partId);
    if (!attachment || !attachment.content) return res.status(404).json({ error: "Attachment not found" });
    res.setHeader("Content-Type", attachment.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${attachment.filename}"`);
    res.send(attachment.content);
  } catch (error) {
    res.status(500).json({ error: "Failed to download attachment" });
  }
});

export default router;
