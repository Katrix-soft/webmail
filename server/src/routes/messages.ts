import { Router, Request, Response } from "express";
import { ImapService } from "../services/imap.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

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
    res.status(500).json({
      error: "Failed to fetch messages",
    });
  }
});

router.get("/:folder/search", async (req: Request, res: Response) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const query = req.query.q as string;

    if (!query) {
      return res.status(400).json({ error: "Search query required" });
    }

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

    // Mark as read
    await imap.markAsRead(folder, uid);

    await imap.disconnect();
    res.json(email);
  } catch (error: any) {
    console.error("Message error:", error);
    res.status(500).json({
      error: "Failed to fetch message",
    });
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
    console.error("Delete error:", error);
    res.status(500).json({
      error: "Failed to delete message",
    });
  }
});

router.post("/:folder/:uid/move", async (req: Request, res: Response) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);
    const { toFolder } = req.body;

    if (!toFolder) {
      return res.status(400).json({ error: "toFolder required" });
    }

    const imap = new ImapService(req.session.email!, req.session.password!);
    await imap.connect();

    await imap.moveEmail(folder, toFolder, uid);

    await imap.disconnect();
    res.json({ success: true });
  } catch (error: any) {
    console.error("Move error:", error);
    res.status(500).json({
      error: "Failed to move message",
    });
  }
});

router.post("/:folder/:uid/mark-read", async (req: Request, res: Response) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);
    const imap = new ImapService(req.session.email!, req.session.password!);
    await imap.connect();
    await imap.markAsRead(folder, uid);
    await imap.disconnect();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

router.post("/:folder/:uid/mark-unread", async (req: Request, res: Response) => {
  try {
    const folder = decodeURIComponent(req.params.folder);
    const uid = parseInt(req.params.uid);
    const imap = new ImapService(req.session.email!, req.session.password!);
    await imap.connect();
    await imap.markAsUnread(folder, uid);
    await imap.disconnect();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark as unread" });
  }
});

export default router;
