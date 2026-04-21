import nodemailer from "nodemailer";

interface Attachment {
  filename: string;
  content: any;
  contentType?: string;
}

export class SmtpService {
  private transporter: nodemailer.Transporter | null = null;
  private email: string = "";

  constructor(email: string, password: string) {
    this.email = email;
    this.transporter = nodemailer.createTransport({
      host: "mail.arkhon.com.ar",
      port: 587,
      secure: false,
      auth: {
        user: email,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async sendEmail(
    to: string,
    cc: string = "",
    bcc: string = "",
    subject: string,
    html: string,
    text: string,
    attachments: Attachment[] = []
  ): Promise<string> {
    if (!this.transporter) throw new Error("SMTP not initialized");

    const mailOptions: any = {
      from: this.email,
      to,
      subject,
      html,
      text,
      attachments,
    };

    if (cc) mailOptions.cc = cc;
    if (bcc) mailOptions.bcc = bcc;

    const info = await this.transporter.sendMail(mailOptions);
    return info.messageId;
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
