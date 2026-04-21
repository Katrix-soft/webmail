import Imap from "imap";
import { simpleParser } from "mailparser";

export interface ImapEmail {
  uid: number;
  seqno: number;
  from: string;
  subject: string;
  text: string;
  html: string;
  date: Date;
  flags: string[];
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
      this.imap!.on("error", reject);
      this.imap!.on("alert", (msg) => console.log("IMAP Alert:", msg));
      this.imap!.openImap();
    });
  }

  async disconnect(): Promise<void> {
    if (this.imap) {
      return new Promise((resolve, reject) => {
        this.imap!.closeBox(false, (err) => {
          if (err) reject(err);
          this.imap!.end();
          resolve();
        });
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
          folders.push({
            name: fullPath,
            unreadCount: 0,
            attributes: box.attribs || [],
          });

          if (box.children) {
            box.children.forEach((child: any) => {
              traverse(child, [...path, box.name]);
            });
          }
        };

        Object.values(boxes).forEach((box: any) => {
          traverse(box);
        });

        resolve(folders);
      });
    });
  }

  async selectFolder(folderName: string): Promise<void> {
    if (!this.imap) throw new Error("Not connected to IMAP");

    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, false, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async getUnreadCount(folderName: string): Promise<number> {
    if (!this.imap) throw new Error("Not connected to IMAP");

    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, false, (err, mailbox) => {
        if (err) return reject(err);
        const unread = mailbox.status || 0;
        resolve(unread);
      });
    });
  }

  async fetchEmails(
    folderName: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ImapEmail[]> {
    if (!this.imap) throw new Error("Not connected to IMAP");

    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, false, (err, mailbox) => {
        if (err) return reject(err);

        const totalMessages = mailbox.messages.total;
        const start = Math.max(1, totalMessages - offset - limit + 1);
        const end = totalMessages - offset;

        if (start > end) return resolve([]);

        const f = this.imap!.seq.fetch(`${start}:${end}`, { bodies: "" });
        const emails: ImapEmail[] = [];

        f.on("message", (msg, seqno) => {
          let email: ImapEmail = {
            uid: 0,
            seqno,
            from: "",
            subject: "",
            text: "",
            html: "",
            date: new Date(),
            flags: [],
          };

          msg.on("attributes", (attrs) => {
            email.uid = attrs.uid;
            email.flags = attrs.flags;
          });

          msg.on("body", (stream) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) return;
              email.from = parsed.from?.text || "";
              email.subject = parsed.subject || "";
              email.text = parsed.text || "";
              email.html = parsed.html || "";
              email.date = parsed.date || new Date();
            });
          });

          f.on("error", reject);
          f.on("end", () => {
            emails.push(email);
          });
        });

        f.on("error", reject);
        f.on("end", () => {
          resolve(emails);
        });
      });
    });
  }

  async getEmail(folderName: string, uid: number): Promise<ImapEmail> {
    if (!this.imap) throw new Error("Not connected to IMAP");

    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, false, (err) => {
        if (err) return reject(err);

        const f = this.imap!.fetch(uid, { bodies: "" });
        let email: ImapEmail = {
          uid,
          seqno: 0,
          from: "",
          subject: "",
          text: "",
          html: "",
          date: new Date(),
          flags: [],
        };

        f.on("message", (msg) => {
          msg.on("attributes", (attrs) => {
            email.seqno = attrs.uid;
            email.flags = attrs.flags;
          });

          msg.on("body", (stream) => {
            simpleParser(stream, (err, parsed) => {
              if (err) return;
              email.from = parsed.from?.text || "";
              email.subject = parsed.subject || "";
              email.text = parsed.text || "";
              email.html = parsed.html || "";
              email.date = parsed.date || new Date();
            });
          });
        });

        f.on("error", reject);
        f.on("end", () => resolve(email));
      });
    });
  }

  async markAsRead(folderName: string, uid: number): Promise<void> {
    if (!this.imap) throw new Error("Not connected to IMAP");

    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, false, (err) => {
        if (err) return reject(err);
        this.imap!.addFlags(uid, ["\\Seen"], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
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

  async moveEmail(
    fromFolder: string,
    toFolder: string,
    uid: number
  ): Promise<void> {
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
