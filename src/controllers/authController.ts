import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { LoginPayload } from '../types/auth';

const authService = new AuthService();

export const login = async (req: Request, res: Response) => {
    try {
        const payload: LoginPayload = req.body;
        const result = await authService.login(payload);
        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        return res.status(401).json({ success: false, message: error.message || 'אימות נכשל' });
    }
};
