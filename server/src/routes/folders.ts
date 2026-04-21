import { Router, Request, Response } from "express";
import { ImapService } from "../services/imap.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req: Request, res: Response) => {
  try {
    const imap = new ImapService(req.session.email!, req.session.password!);
    await imap.connect();

    const folders = await imap.listFolders();

    // Get unread count for each folder
    for (const folder of folders) {
      try {
        const count = await imap.getUnreadCount(folder.name);
        folder.unreadCount = count;
      } catch {
        folder.unreadCount = 0;
      }
    }

    await imap.disconnect();
    res.json(folders);
  } catch (error: any) {
    console.error("Folders error:", error);
    res.status(500).json({
      error: "Failed to fetch folders",
    });
  }
});

export default router;
