import request from 'supertest';
import app from '../src/app';
import prisma from '../src/db/prisma';
import { createTestUser, issueTestToken, cleanupTestData } from './helpers/testUser';

describe('Role-based access control', () => {
    const userIds: number[] = [];

    afterAll(async () => {
        await cleanupTestData(userIds);
        await prisma.$disconnect();
    });

    describe('GET /api/users (SUPER_ADMIN or SCHEDULER_ADMIN only)', () => {
        it('rejects an unauthenticated request', async () => {
            const res = await request(app).get('/api/users');
            expect(res.status).toBe(401);
        });

        it('rejects a VOLUNTEER with 403', async () => {
            const volunteer = await createTestUser('VOLUNTEER');
            userIds.push(volunteer.id);

            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${issueTestToken(volunteer)}`);

            expect(res.status).toBe(403);
        });

        it('allows a SUPER_ADMIN', async () => {
            const admin = await createTestUser('SUPER_ADMIN');
            userIds.push(admin.id);

            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${issueTestToken(admin)}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('allows a SCHEDULER_ADMIN', async () => {
            const scheduler = await createTestUser('SCHEDULER_ADMIN');
            userIds.push(scheduler.id);

            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${issueTestToken(scheduler)}`);

            expect(res.status).toBe(200);
        });
    });

    describe('DELETE /api/users/invitations/:id (SUPER_ADMIN only)', () => {
        it('rejects a SCHEDULER_ADMIN with 403, even though they can read the roster', async () => {
            const scheduler = await createTestUser('SCHEDULER_ADMIN');
            userIds.push(scheduler.id);

            const res = await request(app)
                .delete('/api/users/invitations/999999')
                .set('Authorization', `Bearer ${issueTestToken(scheduler)}`);

            expect(res.status).toBe(403);
        });

        it('rejects a VOLUNTEER with 403', async () => {
            const volunteer = await createTestUser('VOLUNTEER');
            userIds.push(volunteer.id);

            const res = await request(app)
                .delete('/api/users/invitations/999999')
                .set('Authorization', `Bearer ${issueTestToken(volunteer)}`);

            expect(res.status).toBe(403);
        });

        it('returns 404 for a SUPER_ADMIN deleting a nonexistent invitation', async () => {
            const admin = await createTestUser('SUPER_ADMIN');
            userIds.push(admin.id);

            const res = await request(app)
                .delete('/api/users/invitations/999999')
                .set('Authorization', `Bearer ${issueTestToken(admin)}`);

            expect(res.status).toBe(404);
        });
    });

    describe('An expired/invalid JWT', () => {
        it('is rejected with 401', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', 'Bearer this-is-not-a-real-token');

            expect(res.status).toBe(401);
        });
    });
});
