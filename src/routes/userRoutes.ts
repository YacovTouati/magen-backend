import { Router } from 'express';
import {
    changePassword,
    deleteUser,
    getUsers,
    inviteUser,
    listInvitations,
    updateUserRole,
} from '../controllers/userController';
import { authenticate, checkRole } from '../middlewares/auth';
import { authActionLimiter } from '../middlewares/rateLimiters';
import { validateChangePassword, validateInviteUser, validateUpdateUserRole } from '../middlewares/validators';

export const userRouter = Router();

userRouter.use('/users', authenticate);

// Reading the roster is also open to SCHEDULER_ADMIN — they need it to populate the
// volunteer-assignment dropdown on the shift calendar (POST /shifts/:id/admin-assign
// is already SUPER_ADMIN/SCHEDULER_ADMIN, so this just lets them see who to pick).
userRouter.get('/users', checkRole('SUPER_ADMIN', 'SCHEDULER_ADMIN'), getUsers);

// Account/role management itself (invite, change role, delete) stays SUPER_ADMIN-only —
// it's the one role with the power to create or demote other admins. No password field
// anywhere in this file anymore — invitees set their own at POST /auth/register.
userRouter.post('/users/invite', checkRole('SUPER_ADMIN'), validateInviteUser, inviteUser);
userRouter.get('/users/invitations', checkRole('SUPER_ADMIN'), listInvitations);
userRouter.patch('/users/:id/role', checkRole('SUPER_ADMIN'), validateUpdateUserRole, updateUserRole);
userRouter.delete('/users/:id', checkRole('SUPER_ADMIN'), deleteUser);

// Not under /users — any authenticated user changes their own password, no
// role gate. Explicit authenticate here since this path falls outside the
// router.use('/users', ...) scoping above.
userRouter.post('/user/change-password', authenticate, authActionLimiter, validateChangePassword, changePassword);
