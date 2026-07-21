import { Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client';
import { HttpError } from '../errors/httpError';
import { UserService } from '../services/userService';
import { InviteService } from '../services/inviteService';

const userService = new UserService();
const inviteService = new InviteService();

const handleError = (res: Response, error: unknown) => {
    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('⛔ User controller error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        return handleError(res, error);
    }
};

// Replaces the old createUser — no password field exists here at all. The
// admin only picks who gets in and what role they'll have; the invitee sets
// their own password at POST /auth/register.
export const inviteUser = async (req: Request, res: Response) => {
    try {
        const { email, role } = req.body;
        const invite = await inviteService.inviteUser(email, role, req.user!.id);
        return res.status(201).json({ success: true, data: invite });
    } catch (error) {
        return handleError(res, error);
    }
};

export const listInvitations = async (req: Request, res: Response) => {
    try {
        const invites = await inviteService.listPendingInvites();
        return res.status(200).json({ success: true, data: invites });
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
        return res.status(400).json({ success: false, message: 'מזהה משתמש אינו תקין' });
    }

    try {
        const user = await userService.updateUserRole(userId, req.body.role);
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'משתמש לא נמצא' });
        }
        return handleError(res, error);
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
        return res.status(400).json({ success: false, message: 'מזהה משתמש אינו תקין' });
    }

    try {
        await userService.deleteUser(userId);
        return res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ success: false, message: 'משתמש לא נמצא' });
        }
        return handleError(res, error);
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { currentPassword, newPassword } = req.body;
        await userService.changePassword(req.user!.id, currentPassword, newPassword);
        return res.status(200).json({ success: true, message: 'הסיסמה עודכנה בהצלחה' });
    } catch (error) {
        return handleError(res, error);
    }
};
