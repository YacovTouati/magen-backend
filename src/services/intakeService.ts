import { Prisma } from '../generated/prisma/client';
import { HttpError } from '../errors/httpError';
import { IntakeRepository } from '../repositories/intakeRepository';
import { CreateIntakePayload, IntakeStatus } from '../types/intake';

const EXTENSION_DAYS = 7;

const isNotFoundError = (error: unknown): error is Prisma.PrismaClientKnownRequestError =>
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';

export class IntakeService {
    private intakeRepository = new IntakeRepository();

    async getAllIntakes() {
        return this.intakeRepository.findAll();
    }

    async create(payload: CreateIntakePayload) {
        return this.intakeRepository.create({
            callerName: payload.callerName,
            phone: payload.phone,
            contactedOtherCenter: payload.contactedOtherCenter,
            caseDescription: payload.caseDescription,
            urgency: payload.urgency,
            status: payload.status ?? 'NEW',
        });
    }

    async updateStatus(id: number, status: IntakeStatus) {
        try {
            return await this.intakeRepository.updateStatus(id, status);
        } catch (error) {
            if (isNotFoundError(error)) {
                throw new HttpError(404, 'תיק לא נמצא');
            }
            throw error;
        }
    }

    // Admin-only escape hatch — pushes expiresAt 7 days past whatever it
    // currently is, not 7 days from now, so repeated extensions stack.
    async extendExpiration(id: number) {
        const affectedRows = await this.intakeRepository.extendExpiration(id, EXTENSION_DAYS);
        if (affectedRows === 0) {
            throw new HttpError(404, 'תיק לא נמצא');
        }
        return this.intakeRepository.findById(id);
    }

    // Immediate hard delete, on demand — separate from the automatic
    // retention sweep. Backs the frontend's "close and delete now" dialog
    // for terminal statuses, instead of waiting out the full 14-day window.
    async hardDelete(id: number) {
        try {
            await this.intakeRepository.hardDelete(id);
        } catch (error) {
            if (isNotFoundError(error)) {
                throw new HttpError(404, 'תיק לא נמצא');
            }
            throw error;
        }
    }

    async deleteExpiredIntakes() {
        return this.intakeRepository.deleteExpired();
    }
}
