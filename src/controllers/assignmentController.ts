import { Request, Response } from 'express';
import { HttpError } from '../errors/httpError';
import { AssignmentService } from '../services/assignmentService';

const assignmentService = new AssignmentService();

const handleError = (res: Response, error: unknown) => {
    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('⛔ Assignment controller error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
};

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const parseDateParam = (req: Request, res: Response): string | null => {
    const date = req.params.date;
    if (typeof date !== 'string' || !DATE_ONLY_PATTERN.test(date)) {
        res.status(400).json({ success: false, message: 'תאריך אינו תקין (נדרש פורמט YYYY-MM-DD)' });
        return null;
    }
    return date;
};

export const getAssignments = async (req: Request, res: Response) => {
    try {
        const { from, to } = req.query;
        const assignments = await assignmentService.getAll(
            typeof from === 'string' ? from : undefined,
            typeof to === 'string' ? to : undefined
        );
        return res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        return handleError(res, error);
    }
};

export const upsertAssignment = async (req: Request, res: Response) => {
    try {
        const { date, volunteerId } = req.body;
        const assignment = await assignmentService.upsert({ date, volunteerId });
        return res.status(200).json({ success: true, data: assignment });
    } catch (error) {
        return handleError(res, error);
    }
};

export const deleteAssignment = async (req: Request, res: Response) => {
    const date = parseDateParam(req, res);
    if (date === null) return;
    try {
        await assignmentService.remove(date);
        return res.status(204).send();
    } catch (error) {
        return handleError(res, error);
    }
};
