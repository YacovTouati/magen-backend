import prisma from '../db/prisma';
import { IntakeStatus, IntakeUrgency } from '../types/intake';

// Every CallReport field the Intakes management view needs to display:
// email/region (contact + location), reportingDuty (mandatory-reporting flag),
// magenContactHistory (prior contact with Magen), callerType (applicant type),
// and summaryNotes (full call content, alongside Intake.caseDescription itself).
// Deliberately still NOT `callReport: true` — gender, sector,
// receivedSupportAtOtherCenter, isFamilyMemberOrAcquaintance, callDuration,
// callPurpose etc. have no consumer here and stay excluded, same reasoning as
// before (see the earlier over-fetch trim this select already went through).
const callReportListSelect = {
    id: true,
    email: true,
    region: true,
    reportingDuty: true,
    magenContactHistory: true,
    callerType: true,
    summaryNotes: true,
} as const;

// A case nobody has started working yet. NO_ANSWER deliberately excluded —
// an attempt was already made, so it isn't "untouched," it needs a retry.
// Adjust this one array if the definition of "unhandled" should ever widen.
const UNHANDLED_STATUSES: IntakeStatus[] = ['NEW'];

interface CreateIntakeData {
    callerName: string;
    phone: string;
    contactedOtherCenter: string;
    caseDescription: string;
    urgency: IntakeUrgency;
    status: IntakeStatus;
}

export class IntakeRepository {
    async create(data: CreateIntakeData) {
        return prisma.intake.create({
            data,
            include: { callReport: { select: callReportListSelect } },
        });
    }

    async findAll() {
        return prisma.intake.findMany({
            include: { callReport: { select: callReportListSelect } },
            orderBy: { createdAt: 'desc' },
        });
    }

    // Deliberately a count(), not findMany().length — the frontend badge only
    // needs the number, so this never pulls a single Intake/CallReport row
    // over the wire just to count them.
    async countUnhandled() {
        return prisma.intake.count({
            where: { status: { in: UNHANDLED_STATUSES } },
        });
    }

    async findById(id: number) {
        return prisma.intake.findUnique({
            where: { id },
            include: { callReport: { select: callReportListSelect } },
        });
    }

    // No ownership guard needed anymore — any SUPER_ADMIN/INTAKE_ADMIN may
    // update any intake's status, enforced at the route layer, not here.
    async updateStatus(id: number, status: IntakeStatus) {
        return prisma.intake.update({
            where: { id },
            data: { status },
            include: { callReport: { select: callReportListSelect } },
        });
    }

    // Atomic: extends the row's *current* expiresAt by `days`, computed in
    // SQL rather than read-then-write, so two concurrent extend calls both
    // land instead of one clobbering the other.
    async extendExpiration(id: number, days: number) {
        return prisma.$executeRaw`
            UPDATE "Intake"
            SET "expiresAt" = "expiresAt" + make_interval(days => ${days})
            WHERE id = ${id}
        `;
    }

    async hardDelete(id: number) {
        return prisma.intake.delete({ where: { id } });
    }

    // Permanent retention sweep — called by the cron job in src/jobs/.
    async deleteExpired() {
        return prisma.intake.deleteMany({
            where: { expiresAt: { lte: new Date() } },
        });
    }
}
