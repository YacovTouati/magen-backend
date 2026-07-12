import { Router } from 'express';
import { validateLogin } from '../middlewares/validators';
import { login } from '../controllers/authController';

export const authRouter = Router();

authRouter.post('/auth/login', validateLogin, login);
