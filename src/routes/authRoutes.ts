import { Router } from 'express';
import { validateLogin } from '../middlewares/validators';
import { login } from '../controllers/authController';
import { loginLimiter } from '../middlewares/rateLimiters';

export const authRouter = Router();

authRouter.post('/auth/login', loginLimiter, validateLogin, login);
