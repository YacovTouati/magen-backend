import { Router } from 'express';
import { createUser, deleteUser, getUsers, updateUserRole } from '../controllers/userController';
import { authenticate, checkRole } from '../middlewares/auth';
import { validateCreateUser, validateUpdateUserRole } from '../middlewares/validators';

export const userRouter = Router();

// User/account management (including granting the other admin roles) stays
// SUPER_ADMIN-only — it's the one role with the power to create other admins.
userRouter.use('/users', authenticate, checkRole('SUPER_ADMIN'));

userRouter.get('/users', getUsers);
userRouter.post('/users', validateCreateUser, createUser);
userRouter.patch('/users/:id/role', validateUpdateUserRole, updateUserRole);
userRouter.delete('/users/:id', deleteUser);
