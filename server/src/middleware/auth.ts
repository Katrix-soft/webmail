import { Request, Response, NextFunction } from "express";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.email || !req.session.password) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
};

export const checkSession = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.session.email && req.session.password) {
    res.json({ authenticated: true, email: req.session.email });
  } else {
    res.json({ authenticated: false });
  }
};
