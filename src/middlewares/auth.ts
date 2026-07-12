import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../types/auth';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in the environment');
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'נדרש אימות (Authorization header חסר)' });
    }

    const token = authHeader.slice('Bearer '.length);

    try {
        const decoded = jwt.verify(token, JWT_SECRET as string) as AuthTokenPayload;
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'טוקן לא תקין או שפג תוקפו' });
    }
};

export const checkRole = (...allowedRoles: AuthTokenPayload['role'][]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'נדרש אימות' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'אין הרשאה לבצע פעולה זו' });
        }

        next();
    };
};
