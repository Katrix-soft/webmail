import Imap from "imap";
import { simpleParser } from "mailparser";

export interface Attachment {
  partId: string;
  filename: string;
  contentType: string;
  size: number;
  content?: Buffer;
}

export interface ImapEmail {
  uid: number;
  seqno: number;
  from: string;
  subject: string;
  text: string;
  html: string;
  date: Date;
  flags: string[];
  attachments?: Attachment[];
}

export interface ImapFolder {
  name: string;
  unreadCount: number;
  attributes: string[];
}

export class ImapService {
  private imap: Imap | null = null;
  private email: string = "";
  private password: string = "";
  private host: string = "mail.arkhon.com.ar";
  private port: number = 993;

  constructor(email: string, password: string) {
    this.email = email;
    this.password = password;
  }

  private createImap(): Imap {
    return new Imap({
      user: this.email,
      password: this.password,
      host: this.host,
      port: this.port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });
  }

  async connect(): Promise<void> {
    this.imap = this.createImap();
    return new Promise((resolve, reject) => {
      this.imap!.on("ready", () => {
        // Just verify we can open INBOX
        this.imap!.openBox("INBOX", true, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      this.imap!.on("error", (err) => {
        console.error("IMAP Connection Error:", err);
        reject(err);
      });
      this.imap!.connect();
    });
  }

  async disconnect(): Promise<void> {
    if (this.imap) {
      this.imap!.end();
    }
  }

  async listFolders(): Promise<ImapFolder[]> {
    if (!this.imap) throw new Error("Not connected");
    return new Promise((resolve, reject) => {
      this.imap!.getBoxes((err, boxes) => {
        if (err) return reject(err);
        const folders: ImapFolder[] = [];
        const traverse = (box: any, path: string[] = []) => {
          const fullPath = [...path, box.name].join(box.delimiter || "/");
          folders.push({ name: fullPath, unreadCount: 0, attributes: box.attribs || [] });
          if (box.children) {
            Object.keys(box.children).forEach(k => traverse(box.children[k], [...path, box.name]));
          }
        };
        Object.keys(boxes).forEach(k => traverse(boxes[k]));
        resolve(folders);
      });
    });
  }

  async fetchEmails(folderName: string, limit: number = 50, offset: number = 0): Promise<ImapEmail[]> {
    if (!this.imap) throw new Error("Not connected");
    
    // Normalize folder name if it's "Recibidos" from some old state, though it shouldn't happen
    const folder = folderName === "Recibidos" ? "INBOX" : folderName;

    return new Promise((resolve, reject) => {
      this.imap!.openBox(folder, true, (err, mailbox) => {
        if (err) {
          console.error(`Error opening box ${folder}:`, err);
          return resolve([]); // Return empty rather than crashing if folder missing
        }

        const total = mailbox.messages.total;
        if (total === 0) return resolve([]);

        const start = Math.max(1, total - offset - limit + 1);
        const end = total - offset;
        if (start > end) return resolve([]);

        const f = this.imap!.seq.fetch(`${start}:${end}`, { bodies: "" });
        const emails: ImapEmail[] = [];
        let fetched = 0;
        const expected = end - start + 1;

        f.on("message", (msg, seqno) => {
          let email: ImapEmail = { uid: 0, seqno, from: "", subject: "", text: "", html: "", date: new Date(), flags: [], attachments: [] };
          
          msg.on("attributes", (attrs) => {
            email.uid = attrs.uid;
            email.flags = attrs.flags;
          });

          msg.on("body", (stream) => {
            simpleParser(stream, (err, parsed) => {
              if (!err && parsed) {
                email.from = parsed.from?.text || "";
                email.subject = parsed.subject || "";
                email.text = parsed.text || "";
                email.html = parsed.html || "";
                email.date = parsed.date || new Date();
                if (parsed.attachments) {
                  email.attachments = parsed.attachments.map((a, i) => ({
                    partId: (i + 1).toString(), filename: a.filename || "unnamed", contentType: a.contentType, size: a.size
                  }));
                }
              }
              emails.push(email);
              fetched++;
              if (fetched === expected) resolve(emails.sort((a,b) => b.seqno - a.seqno));
            });
          });
        });

        f.on("error", (err) => { console.error("Fetch error:", err); reject(err); });
        f.on("end", () => {
          setTimeout(() => { // Small timeout to catch last parser results
            if (fetched < expected) resolve(emails.sort((a,b) => b.seqno - a.seqno));
          }, 500);
        });
      });
    });
  }

  async getEmail(folderName: string, uid: number): Promise<ImapEmail> {
    if (!this.imap) throw new Error("Not connected");
    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, false, (err) => {
        if (err) return reject(err);
        const f = this.imap!.fetch(uid, { bodies: "" });
        let email: ImapEmail | null = null;
        f.on("message", (msg, seqno) => {
          email = { uid, seqno, from: "", subject: "", text: "", html: "", date: new Date(), flags: [], attachments: [] };
          msg.on("attributes", (attrs) => { if(email) email.flags = attrs.flags; });
          msg.on("body", (stream) => {
            simpleParser(stream, (err, parsed) => {
              if (!err && parsed && email) {
                email.from = parsed.from?.text || ""; email.subject = parsed.subject || "";
                email.text = parsed.text || ""; email.html = parsed.html || ""; email.date = parsed.date || new Date();
                if (parsed.attachments) {
                  email.attachments = parsed.attachments.map((a, i) => ({
                    partId: (i + 1).toString(), filename: a.filename || "unnamed", contentType: a.contentType, size: a.size, content: a.content
                  }));
                }
              }
              resolve(email!);
            });
          });
        });
        f.on("error", reject);
      });
    });
  }

  async searchEmails(folderName: string, query: string): Promise<ImapEmail[]> {
    if (!this.imap) throw new Error("Not connected");
    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, true, (err) => {
        if (err) return resolve([]);
        this.imap!.search([['OR', ['SUBJECT', query], ['FROM', query]]], (err, uids) => {
          if (err || !uids.length) return resolve([]);
          const f = this.imap!.fetch(uids, { bodies: "" });
          const emails: ImapEmail[] = [];
          let fetched = 0;
          f.on("message", (msg, seqno) => {
            let e: ImapEmail = { uid: 0, seqno, from: "", subject: "", text: "", html: "", date: new Date(), flags: [], attachments: [] };
            msg.on("attributes", (attrs) => { e.uid = attrs.uid; e.flags = attrs.flags; });
            msg.on("body", (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (!err && parsed) {
                  e.from = parsed.from?.text || ""; e.subject = parsed.subject || "";
                  e.text = parsed.text || ""; e.html = parsed.html || ""; e.date = parsed.date || new Date();
                }
                emails.push(e); fetched++;
                if (fetched === uids.length) resolve(emails.sort((a,b) => b.uid - a.uid));
              });
            });
          });
          f.on("end", () => { setTimeout(() => resolve(emails.sort((a,b) => b.uid - a.uid)), 500); });
        });
      });
    });
  }

  async setFlag(folder: string, uid: number, flag: string, val: boolean): Promise<void> {
    if (!this.imap) throw new Error("Not connected");
    return new Promise((resolve, reject) => {
      this.imap!.openBox(folder, false, (err) => {
        if (err) return reject(err);
        this.imap![val ? "addFlags" : "delFlags"](uid, [flag], (err) => {
          if (err) reject(err); else resolve();
        });
      });
    });
  }

  async markAsRead(folder: string, uid: number): Promise<void> { return this.setFlag(folder, uid, "\\Seen", true); }
  async toggleStar(folder: string, uid: number, val: boolean): Promise<void> { return this.setFlag(folder, uid, "\\Flagged", val); }

  async deleteEmail(folder: string, uid: number): Promise<void> {
    if (!this.imap) throw new Error("Not connected");
    return new Promise((resolve, reject) => {
      this.imap!.openBox(folder, false, (err) => {
        if (err) return reject(err);
        this.imap!.addFlags(uid, ["\\Deleted"], (err) => {
          if (err) return reject(err);
          this.imap!.expunge((err) => { if (err) reject(err); else resolve(); });
        });
      });
    });
  }

  async moveEmail(from: string, to: string, uid: number): Promise<void> {
    if (!this.imap) throw new Error("Not connected");
    return new Promise((resolve, reject) => {
      this.imap!.openBox(from, false, (err) => {
        if (err) return reject(err);
        this.imap!.move(uid, to, (err) => { if (err) reject(err); else resolve(); });
      });
    });
  }
}
