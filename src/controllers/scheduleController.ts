import { Request, Response } from 'express';
import { HttpError } from '../errors/httpError';
import { ScheduleService } from '../services/scheduleService';

const scheduleService = new ScheduleService();

const handleError = (res: Response, error: unknown) => {
    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('⛔ Schedule controller error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
};

const parseScheduleId = (req: Request, res: Response): number | null => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        res.status(400).json({ success: false, message: 'מזהה לוח משמרות אינו תקין' });
        return null;
    }
    return id;
};

const parseShiftId = (req: Request, res: Response): number | null => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        res.status(400).json({ success: false, message: 'מזהה משמרת אינו תקין' });
        return null;
    }
    return id;
};

export const createSchedule = async (req: Request, res: Response) => {
    try {
        const { month, year } = req.body;
        const result = await scheduleService.createSchedule(Number(month), Number(year));
        return res.status(201).json({ success: true, data: result });
    } catch (error) {
        return handleError(res, error);
    }
};

export const getScheduleShifts = async (req: Request, res: Response) => {
    const id = parseScheduleId(req, res);
    if (id === null) return;
    try {
        const schedule = await scheduleService.getScheduleWithShifts(id);
        return res.status(200).json({ success: true, data: schedule });
    } catch (error) {
        return handleError(res, error);
    }
};

export const publishSchedule = async (req: Request, res: Response) => {
    const id = parseScheduleId(req, res);
    if (id === null) return;
    try {
        const schedule = await scheduleService.publish(id);
        return res.status(200).json({ success: true, data: schedule });
    } catch (error) {
        return handleError(res, error);
    }
};

export const claimShift = async (req: Request, res: Response) => {
    const id = parseShiftId(req, res);
    if (id === null) return;
    try {
        const shift = await scheduleService.claimShift(id, req.user!.id);
        return res.status(200).json({ success: true, data: shift });
    } catch (error) {
        return handleError(res, error);
    }
};

export const adminReleaseShift = async (req: Request, res: Response) => {
    const id = parseShiftId(req, res);
    if (id === null) return;
    try {
        const shift = await scheduleService.adminRelease(id);
        return res.status(200).json({ success: true, data: shift });
    } catch (error) {
        return handleError(res, error);
    }
};
