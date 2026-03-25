import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers)
        });

        if (session) {
            (req as any).user = session.user;
            (req as any).session = session.session;
        }

        next();
    } catch (e) {
        console.error("Auth middleware error:", e);
        next();
    }
};

export const checkRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return res.status(401).json({ error: "Unauthorized", message: "You must be logged in to perform this action." });
        }

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ error: "Forbidden", message: "You do not have permission to perform this action." });
        }

        next();
    };
};
