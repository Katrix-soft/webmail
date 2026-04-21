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
      this.imap!.openImap();
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
          folders.push({
            name: fullPath,
            unreadCount: 0,
            attributes: box.attribs || [],
          });

          if (box.children) {
            Object.values(box.children).forEach((child: any) => {
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
        if (totalMessages === 0) return resolve([]);

        const start = Math.max(1, totalMessages - offset - limit + 1);
        const end = totalMessages - offset;

        if (start > end) return resolve([]);

        const f = this.imap!.seq.fetch(`${start}:${end}`, { bodies: "" });
        const emails: ImapEmail[] = [];
        let pending = 0;
        let finished = false;

        f.on("message", (msg, seqno) => {
          pending++;
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
            simpleParser(stream, (err, parsed) => {
              if (!err && parsed) {
                email.from = parsed.from?.text || "";
                email.subject = parsed.subject || "";
                email.text = parsed.text || "";
                email.html = parsed.html || "";
                email.date = parsed.date || new Date();
              }
              emails.push(email);
              pending--;
              if (finished && pending === 0) resolve(emails.reverse());
            });
          });
        });

        f.on("error", reject);
        f.on("end", () => {
          finished = true;
          if (pending === 0) resolve(emails.reverse());
        });
      });
    });
  }

  async searchEmails(folderName: string, query: string): Promise<ImapEmail[]> {
    if (!this.imap) throw new Error("Not connected to IMAP");

    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, false, (err) => {
        if (err) return reject(err);

        // Simple search by subject OR from OR body
        this.imap!.search([['OR', ['SUBJECT', query], ['FROM', query]]], (err, uids) => {
          if (err) return reject(err);
          if (uids.length === 0) return resolve([]);

          // Fetch the found emails
          const f = this.imap!.fetch(uids, { bodies: "" });
          const emails: ImapEmail[] = [];
          let pending = 0;
          let finished = false;

          f.on("message", (msg, seqno) => {
            pending++;
            let email: ImapEmail = { uid: 0, seqno, from: "", subject: "", text: "", html: "", date: new Date(), flags: [] };
            msg.on("attributes", (attrs) => { email.uid = attrs.uid; email.flags = attrs.flags; });
            msg.on("body", (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (!err && parsed) {
                  email.from = parsed.from?.text || "";
                  email.subject = parsed.subject || "";
                  email.text = parsed.text || "";
                  email.html = parsed.html || "";
                  email.date = parsed.date || new Date();
                }
                emails.push(email);
                pending--;
                if (finished && pending === 0) resolve(emails.reverse());
              });
            });
          });

          f.on("end", () => { finished = true; if (pending === 0) resolve(emails.reverse()); });
          f.on("error", reject);
        });
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

  async markAsUnread(folderName: string, uid: number): Promise<void> {
    if (!this.imap) throw new Error("Not connected to IMAP");
    return new Promise((resolve, reject) => {
      this.imap!.openBox(folderName, false, (err) => {
        if (err) return reject(err);
        this.imap!.delFlags(uid, ["\\Seen"], (err) => {
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
        // Move to Trash instead of hard delete if possible, but for simplicity we add Deleted flag and expunge
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
