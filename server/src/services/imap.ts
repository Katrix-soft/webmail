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
        this.imap!.openBox("INBOX", false, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      this.imap!.on("error", (err) => {
        console.error("IMAP Error:", err);
        reject(err);
      });
      this.imap!.connect();
    });
  }

  async disconnect(): Promise<void> {
    if (this.imap) {
      return new Promise((resolve, reject) => {
        this.imap!.end();
        resolve();
      });
    }
  }

  async listFolders(): Promise<ImapFolder[]> {
    if (!this.imap) throw new Error("Not connected to IMAP");
    return new Promise((resolve, reject) => {
      this.imap!.getBoxes((err, boxes) => {
        if (err) return reject(err);
        const folders: ImapFolder[] = [];
        const traverse = (box: any, path: string[] = []) => {
          const fullPath = [...path, box.name].join(box.delimiter);
          folders.push({ name: fullPath, unreadCount: 0, attributes: box.attribs || [] });
          if (box.children) {
            Object.keys(box.children).forEach((key) => {
              traverse(box.children[key], [...path, box.name]);
            });
          }
        };
        Object.keys(boxes).forEach((key) => traverse(boxes[key]));
        resolve(folders);
      });
    });
  }

  async fetchEmails(folderName: string, limit: number = 50, offset: number = 0): Promise<ImapEmail[]> {
    if (!this.imap) throw new Error("Not connected to IMAP");
    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, true, (err, mailbox) => {
        if (err) return reject(err);
        const totalMessages = mailbox.messages.total;
        if (totalMessages === 0) return resolve([]);
        const start = Math.max(1, totalMessages - offset - limit + 1);
        const end = totalMessages - offset;
        if (start > end) return resolve([]);
        const f = this.imap!.seq.fetch(`${start}:${end}`, { bodies: "" });
        const emails: ImapEmail[] = [];
        let pending = 0; let finished = false;
        f.on("message", (msg, seqno) => {
          pending++;
          let email: ImapEmail = { uid: 0, seqno, from: "", subject: "", text: "", html: "", date: new Date(), flags: [], attachments: [] };
          msg.on("attributes", (attrs) => { email.uid = attrs.uid; email.flags = attrs.flags; });
          msg.on("body", (stream) => {
            simpleParser(stream, (err, parsed) => {
              if (!err && parsed) {
                email.from = parsed.from?.text || ""; email.subject = parsed.subject || "";
                email.text = parsed.text || ""; email.html = parsed.html || ""; email.date = parsed.date || new Date();
                if (parsed.attachments) {
                  email.attachments = parsed.attachments.map((att: any, idx: number) => ({
                    partId: (idx + 1).toString(), filename: att.filename || "unnamed", contentType: att.contentType, size: att.size,
                  }));
                }
              }
              emails.push(email); pending--;
              if (finished && pending === 0) resolve(emails.sort((a,b) => b.uid - a.uid));
            });
          });
        });
        f.on("end", () => { finished = true; if (pending === 0) resolve(emails.sort((a,b) => b.uid - a.uid)); });
        f.on("error", reject);
      });
    });
  }

  async getEmail(folderName: string, uid: number): Promise<ImapEmail> {
    if (!this.imap) throw new Error("Not connected to IMAP");
    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, false, (err) => {
        if (err) return reject(err);
        const f = this.imap!.fetch(uid, { bodies: "" });
        let email: ImapEmail | null = null; let pending = 0;
        f.on("message", (msg, seqno) => {
          pending++;
          email = { uid, seqno, from: "", subject: "", text: "", html: "", date: new Date(), flags: [], attachments: [] };
          msg.on("attributes", (attrs) => { if(email) email.flags = attrs.flags; });
          msg.on("body", (stream) => {
            simpleParser(stream, (err, parsed) => {
              if (!err && parsed && email) {
                email.from = parsed.from?.text || ""; email.subject = parsed.subject || "";
                email.text = parsed.text || ""; email.html = parsed.html || ""; email.date = parsed.date || new Date();
                if (parsed.attachments) {
                  email.attachments = parsed.attachments.map((att: any, idx: number) => ({
                    partId: (idx + 1).toString(), filename: att.filename || "unnamed", contentType: att.contentType, size: att.size, content: att.content,
                  }));
                }
              }
              pending--;
              if (pending === 0 && email) resolve(email);
            });
          });
        });
        f.on("end", () => { if (pending === 0 && email) resolve(email); });
        f.on("error", reject);
      });
    });
  }

  async searchEmails(folderName: string, query: string): Promise<ImapEmail[]> {
    if (!this.imap) throw new Error("Not connected to IMAP");
    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, true, (err) => {
        if (err) return reject(err);
        this.imap!.search([['OR', ['SUBJECT', query], ['FROM', query]]], (err, uids) => {
          if (err) return reject(err);
          if (uids.length === 0) return resolve([]);
          const f = this.imap!.fetch(uids, { bodies: "" });
          const emails: ImapEmail[] = []; let pending = 0; let finished = false;
          f.on("message", (msg, seqno) => {
            pending++;
            let e: ImapEmail = { uid: 0, seqno, from: "", subject: "", text: "", html: "", date: new Date(), flags: [], attachments: [] };
            msg.on("attributes", (attrs) => { e.uid = attrs.uid; e.flags = attrs.flags; });
            msg.on("body", (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (!err && parsed) {
                  e.from = parsed.from?.text || ""; e.subject = parsed.subject || "";
                  e.text = parsed.text || ""; e.html = parsed.html || ""; e.date = parsed.date || new Date();
                }
                emails.push(e); pending--;
                if (finished && pending === 0) resolve(emails.sort((a,b) => b.uid - a.uid));
              });
            });
          });
          f.on("end", () => { finished = true; if (pending === 0) resolve(emails.sort((a,b) => b.uid - a.uid)); });
          f.on("error", reject);
        });
      });
    });
  }

  async setFlag(folderName: string, uid: number, flag: string, value: boolean): Promise<void> {
    if (!this.imap) throw new Error("Not connected to IMAP");
    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, false, (err) => {
        if (err) return reject(err);
        const method = value ? "addFlags" : "delFlags";
        this.imap![method](uid, [flag], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async markAsRead(folderName: string, uid: number): Promise<void> {
    return this.setFlag(folderName, uid, "\\Seen", true);
  }

  async toggleStar(folderName: string, uid: number, value: boolean): Promise<void> {
    return this.setFlag(folderName, uid, "\\Flagged", value);
  }

  async deleteEmail(folderName: string, uid: number): Promise<void> {
    if (!this.imap) throw new Error("Not connected to IMAP");
    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, false, (err) => {
        if (err) return reject(err);
        this.imap!.addFlags(uid, ["\\Deleted"], (err) => {
          if (err) return reject(err);
          this.imap!.expunge((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      });
    });
  }

  async moveEmail(fromFolder: string, toFolder: string, uid: number): Promise<void> {
    if (!this.imap) throw new Error("Not connected to IMAP");
    return new Promise((resolve, reject) => {
      this.imap!.openBox(fromFolder, false, (err) => {
        if (err) return reject(err);
        this.imap!.move(uid, toFolder, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }
}
