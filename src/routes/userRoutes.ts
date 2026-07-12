import { Router } from 'express';
import { createUser, deleteUser, getUsers } from '../controllers/userController';
import { authenticate, checkRole } from '../middlewares/auth';
import { validateCreateUser } from '../middlewares/validators';

export const userRouter = Router();

userRouter.use('/users', authenticate, checkRole('ADMIN'));

userRouter.get('/users', getUsers);
userRouter.post('/users', validateCreateUser, createUser);
userRouter.delete('/users/:id', deleteUser);
