import { Request, Response } from 'express';
import { HttpError } from '../errors/httpError';
import { AuthService } from '../services/authService';
import { LoginPayload } from '../types/auth';

const authService = new AuthService();

const handleError = (res: Response, error: unknown) => {
    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('⛔ Auth controller error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
};

export const login = async (req: Request, res: Response) => {
    try {
        const payload: LoginPayload = {
            email: req.body.email,
            password: req.body.password,
        };
        const result = await authService.login(payload);
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        return handleError(res, error);
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, phone, token } = req.body;
        const result = await authService.register({ email, password, name, phone, token });
        return res.status(201).json({ success: true, data: result });
    } catch (error) {
        return handleError(res, error);
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        await authService.forgotPassword(req.body.email);
    } catch (error) {
        console.error('⛔ Auth controller error (forgot-password):', error);
        // Fall through to the same generic response below regardless — never
        // let an internal failure here leak whether the email exists either.
    }
    return res.status(200).json({
        success: true,
        message: 'אם קיים חשבון המשויך לכתובת מייל זו, נשלח אליו קישור לאיפוס הסיסמה',
    });
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password } = req.body;
        await authService.resetPassword(token, password);
        return res.status(200).json({ success: true, message: 'הסיסמה אופסה בהצלחה' });
    } catch (error) {
        return handleError(res, error);
    }
};
