import { Prisma } from '../generated/prisma/client';
import { HttpError } from '../errors/httpError';
import { AssignmentRepository } from '../repositories/assignmentRepository';
import { UpsertAssignmentPayload } from '../types/assignment';

export class AssignmentService {
    private assignmentRepository = new AssignmentRepository();

    async getAll(from?: string, to?: string) {
        return this.assignmentRepository.findAll(
            from ? this.toDateOnly(from) : undefined,
            to ? this.toDateOnly(to) : undefined
        );
    }

    async upsert(payload: UpsertAssignmentPayload) {
        try {
            return await this.assignmentRepository.upsert(this.toDateOnly(payload.date), payload.volunteerId);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
                throw new HttpError(400, 'המתנדב שצוין אינו קיים במערכת');
            }
            throw error;
        }
    }

    async remove(date: string) {
        const result = await this.assignmentRepository.deleteByDate(this.toDateOnly(date));
        if (result.count === 0) {
            throw new HttpError(404, 'לא נמצא שיבוץ לתאריך זה');
        }
    }

    private toDateOnly(dateStr: string): Date {
        return new Date(`${dateStr}T00:00:00.000Z`);
    }
}
