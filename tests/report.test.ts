import request from 'supertest';
import app from '../src/app';
import prisma from '../src/db/prisma';
import { createTestUser, issueTestToken, cleanupTestData } from './helpers/testUser';

describe('POST /api/reports', () => {
    const userIds: number[] = [];
    let token: string;

    beforeAll(async () => {
        const reporter = await createTestUser('VOLUNTEER');
        userIds.push(reporter.id);
        token = issueTestToken(reporter);
    });

    afterAll(async () => {
        await cleanupTestData(userIds);
        await prisma.$disconnect();
    });

    const basePayload = {
        callDuration: 15,
        callerType: 'victim',
        callPurpose: 'counseling',
        summaryNotes: 'תקציר בדיקה אוטומטית',
        callerName: 'פונה לבדיקה',
        region: 'מרכז',
        gender: 'female',
        sector: 'secular',
        receivedSupportAtOtherCenter: 'no',
        magenContactHistory: 'first_time',
        reportedBy: 'בודק אוטומטי',
    };

    it('rejects an unauthenticated request', async () => {
        const res = await request(app).post('/api/reports').send(basePayload);
        expect(res.status).toBe(401);
    });

    it('creates a report+intake without a phone number (phone is optional)', async () => {
        const res = await request(app)
            .post('/api/reports')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...basePayload, phone: '', email: '' });

        expect(res.status).toBe(201);
        expect(res.body.data.report.phone).toBeNull();
        expect(res.body.data.intake).toBeDefined();
    });

    it('rejects a report missing reportedBy', async () => {
        const { reportedBy, ...payloadWithoutReportedBy } = basePayload;
        const res = await request(app)
            .post('/api/reports')
            .set('Authorization', `Bearer ${token}`)
            .send(payloadWithoutReportedBy);

        expect(res.status).toBe(400);
    });

    it('rejects an invalid (retired) callPurpose value', async () => {
        const res = await request(app)
            .post('/api/reports')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...basePayload, callPurpose: 'coercion' });

        expect(res.status).toBe(400);
    });

    it('ignores a legacy isFamilyMemberOrAcquaintance field instead of erroring', async () => {
        const res = await request(app)
            .post('/api/reports')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...basePayload, isFamilyMemberOrAcquaintance: true });

        expect(res.status).toBe(201);
        expect(res.body.data.report.isFamilyMemberOrAcquaintance).toBeUndefined();
    });

    it.each([
        ['crisis', 'CRITICAL'],
        ['counseling', 'HIGH'],
        ['referral', 'MEDIUM'],
        ['legal_process', 'MEDIUM'],
        ['rights_advocacy', 'LOW'],
        ['other', 'LOW'],
    ])('maps callPurpose "%s" to urgency "%s"', async (callPurpose, expectedUrgency) => {
        const res = await request(app)
            .post('/api/reports')
            .set('Authorization', `Bearer ${token}`)
            .send({ ...basePayload, callPurpose });

        expect(res.status).toBe(201);
        expect(res.body.data.intake.urgency).toBe(expectedUrgency);
    });
});
