import { Request, Response } from 'express';
import { HttpError } from '../errors/httpError';
import { AuthService } from '../services/authService';
import { LoginPayload } from '../types/auth';

const authService = new AuthService();

export const login = async (req: Request, res: Response) => {
    try {
        const payload: LoginPayload = {
            email: req.body.email,
            password: req.body.password,
        };
        const result = await authService.login(payload);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        if (error instanceof HttpError) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        console.error('⛔ Auth controller error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
