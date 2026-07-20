import { Request, Response } from 'express';
import { HttpError } from '../errors/httpError';
import { IntakeService } from '../services/intakeService';

const intakeService = new IntakeService();

const handleError = (res: Response, error: unknown) => {
    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    console.error('⛔ Intake controller error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
};

const parseIntakeId = (req: Request, res: Response): number | null => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        res.status(400).json({ success: false, message: 'מזהה תיק אינו תקין' });
        return null;
    }
    return id;
};

export const getIntakes = async (req: Request, res: Response) => {
    try {
        const intakes = await intakeService.getAllIntakes();
        return res.status(200).json({ success: true, data: intakes });
    } catch (error) {
        return handleError(res, error);
    }
};

export const createIntake = async (req: Request, res: Response) => {
    try {
        const { callerName, phone, contactedOtherCenter, caseDescription, urgency, status } = req.body;
        const intake = await intakeService.create({
            callerName,
            phone,
            contactedOtherCenter,
            caseDescription,
            urgency,
            status,
        });
        return res.status(201).json({ success: true, data: intake });
    } catch (error) {
        return handleError(res, error);
    }
};

export const updateIntakeStatus = async (req: Request, res: Response) => {
    const id = parseIntakeId(req, res);
    if (id === null) return;
    try {
        const { status } = req.body;
        const intake = await intakeService.updateStatus(id, status);
        return res.status(200).json({ success: true, data: intake });
    } catch (error) {
        return handleError(res, error);
    }
};

export const extendIntakeExpiration = async (req: Request, res: Response) => {
    const id = parseIntakeId(req, res);
    if (id === null) return;
    try {
        const intake = await intakeService.extendExpiration(id);
        return res.status(200).json({ success: true, data: intake });
    } catch (error) {
        return handleError(res, error);
    }
};

export const deleteIntake = async (req: Request, res: Response) => {
    const id = parseIntakeId(req, res);
    if (id === null) return;
    try {
        await intakeService.hardDelete(id);
        return res.status(204).send();
    } catch (error) {
        return handleError(res, error);
    }
};
