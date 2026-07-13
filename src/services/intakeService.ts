import { Prisma } from '../generated/prisma/client';
import { HttpError } from '../errors/httpError';
import { IntakeRepository } from '../repositories/intakeRepository';
import { CreateIntakePayload, IntakeStatus } from '../types/intake';

export class IntakeService {
    private intakeRepository = new IntakeRepository();

    async getAllIntakes() {
        return this.intakeRepository.findAllWithAssignee();
    }

    async create(payload: CreateIntakePayload) {
        try {
            return await this.intakeRepository.create({
                callerName: payload.callerName,
                phone: payload.phone,
                contactedOtherCenter: payload.contactedOtherCenter,
                caseDescription: payload.caseDescription,
                urgency: payload.urgency,
                status: payload.status ?? 'NEW',
                assignedToId: payload.assignedToId ?? null,
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                throw new HttpError(400, 'המטפל שצוין אינו קיים במערכת');
            }
            throw error;
        }
    }

    async claim(id: number, currentUserId: number) {
        const result = await this.intakeRepository.claimIfUnassigned(id, currentUserId);
        if (result.count === 0) {
            await this.assertExists(id);
            throw new HttpError(400, 'התיק כבר נלקח לטיפול על ידי מטפל אחר');
        }
        return this.intakeRepository.findById(id);
    }

    async undoClaim(id: number, currentUserId: number) {
        const result = await this.intakeRepository.undoClaimIfOwner(id, currentUserId);
        if (result.count === 0) {
            await this.assertExists(id);
            throw new HttpError(403, 'אינך הבעלים של תיק זה');
        }
        return this.intakeRepository.findById(id);
    }

    async takeover(id: number, currentUserId: number) {
        const intake = await this.intakeRepository.findById(id);
        if (!intake) {
            throw new HttpError(404, 'תיק לא נמצא');
        }
        if (intake.assignedToId === null) {
            throw new HttpError(400, 'לא ניתן להעביר טיפול בתיק שאינו בטיפול איש צוות');
        }
        if (intake.status === 'ACTIVE') {
            throw new HttpError(400, 'התיק נעול לטיפול פעיל על ידי מטפל אחר');
        }

        const result = await this.intakeRepository.takeoverIfReleased(id, currentUserId);
        if (result.count === 0) {
            // Ownership/status changed between the read above and this write — re-derive the correct error.
            const fresh = await this.intakeRepository.findById(id);
            if (!fresh) {
                throw new HttpError(404, 'תיק לא נמצא');
            }
            if (fresh.assignedToId === null) {
                throw new HttpError(400, 'לא ניתן להעביר טיפול בתיק שאינו בטיפול איש צוות');
            }
            throw new HttpError(400, 'התיק נעול לטיפול פעיל על ידי מטפל אחר');
        }
        return this.intakeRepository.findById(id);
    }

    async updateStatus(id: number, currentUserId: number, status: IntakeStatus) {
        const result = await this.intakeRepository.updateStatusIfOwner(id, currentUserId, status);
        if (result.count === 0) {
            await this.assertExists(id);
            throw new HttpError(403, 'רק המטפל המשויך לתיק רשאי לעדכן את הסטטוס');
        }
        return this.intakeRepository.findById(id);
    }

    private async assertExists(id: number) {
        const intake = await this.intakeRepository.findById(id);
        if (!intake) {
            throw new HttpError(404, 'תיק לא נמצא');
        }
    }
}
