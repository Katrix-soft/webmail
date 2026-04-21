import type { SessionData as BaseSessionData } from "express-session";

declare global {
  namespace Express {
    interface SessionData extends BaseSessionData {
      email?: string;
      password?: string;
    }
  }
}

export {};
