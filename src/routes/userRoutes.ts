import { Router } from 'express';
import { createUser, deleteUser, getUsers, updateUserRole } from '../controllers/userController';
import { authenticate, checkRole } from '../middlewares/auth';
import { validateCreateUser, validateUpdateUserRole } from '../middlewares/validators';

export const userRouter = Router();

userRouter.use('/users', authenticate);

// Reading the roster is also open to SCHEDULER_ADMIN — they need it to populate the
// volunteer-assignment dropdown on the shift calendar (POST /shifts/:id/admin-assign
// is already SUPER_ADMIN/SCHEDULER_ADMIN, so this just lets them see who to pick).
userRouter.get('/users', checkRole('SUPER_ADMIN', 'SCHEDULER_ADMIN'), getUsers);

// Account/role management itself (create, change role, delete) stays SUPER_ADMIN-only —
// it's the one role with the power to create or demote other admins.
userRouter.post('/users', checkRole('SUPER_ADMIN'), validateCreateUser, createUser);
userRouter.patch('/users/:id/role', checkRole('SUPER_ADMIN'), validateUpdateUserRole, updateUserRole);
userRouter.delete('/users/:id', checkRole('SUPER_ADMIN'), deleteUser);
