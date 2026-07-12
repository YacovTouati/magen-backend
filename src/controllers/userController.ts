import { Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client';
import { UserService } from '../services/userService';
import { CreateUserPayload } from '../types/user';

const userService = new UserService();

const isUniqueConstraintError = (error: unknown): error is Prisma.PrismaClientKnownRequestError =>
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await userService.getAllUsers();
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error('⛔ User controller error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const payload: CreateUserPayload = req.body;
        const user = await userService.createUser(payload);
        return res.status(201).json({ success: true, data: user });
    } catch (error) {
        if (isUniqueConstraintError(error)) {
            return res.status(409).json({ success: false, message: 'כתובת המייל כבר קיימת במערכת' });
        }
        console.error('⛔ User controller error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
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
        console.error('⛔ User controller error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
