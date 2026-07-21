import { Router } from 'express';
import { validateForgotPassword, validateLogin, validateRegister, validateResetPassword } from '../middlewares/validators';
import { forgotPassword, login, register, resetPassword } from '../controllers/authController';
import { authActionLimiter, loginLimiter } from '../middlewares/rateLimiters';

export const authRouter = Router();

authRouter.post('/auth/login', loginLimiter, validateLogin, login);
authRouter.post('/auth/register', authActionLimiter, validateRegister, register);
authRouter.post('/auth/forgot-password', authActionLimiter, validateForgotPassword, forgotPassword);
authRouter.post('/auth/reset-password', authActionLimiter, validateResetPassword, resetPassword);
