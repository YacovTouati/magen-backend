import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app';
import prisma from '../src/db/prisma';
import { hashToken } from '../src/utils/tokens';
import { createTestUser, cleanupTestData, DEFAULT_TEST_PASSWORD } from './helpers/testUser';

// /auth/login is capped at 10 requests/15min by loginLimiter, and
// /auth/forgot-password + /auth/reset-password share authActionLimiter's own
// 10/15min cap — both counters are process-local (in-memory MemoryStore) and
// this file gets its own fresh app instance/module registry from Jest, so
// staying under 10 requests to each group here is what keeps this suite
// independent of any other test file's usage of the same limiters.

describe('Auth', () => {
    const userIds: number[] = [];

    afterAll(async () => {
        await cleanupTestData(userIds);
        await prisma.$disconnect();
    });

    describe('POST /api/auth/login', () => {
        it('logs in with correct credentials and returns a token', async () => {
            const testUser = await createTestUser('VOLUNTEER');
            userIds.push(testUser.id);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: DEFAULT_TEST_PASSWORD });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.token).toEqual(expect.any(String));
            expect(res.body.data.user).toMatchObject({ email: testUser.email, role: 'VOLUNTEER' });
        });

        it('rejects a wrong password with a generic message (no enumeration)', async () => {
            const testUser = await createTestUser('VOLUNTEER');
            userIds.push(testUser.id);

            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: testUser.email, password: 'WrongPassword!' });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('אימייל או סיסמה שגויים');
        });

        it('rejects an email with no account using the exact same message as a wrong password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ email: 'no-such-account@magen.local', password: 'whatever123' });

            expect(res.status).toBe(401);
            expect(res.body.message).toBe('אימייל או סיסמה שגויים');
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        it('always returns the same generic 200, whether or not the email exists', async () => {
            const knownUser = await createTestUser('VOLUNTEER');
            userIds.push(knownUser.id);

            const forKnownEmail = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: knownUser.email });
            const forUnknownEmail = await request(app)
                .post('/api/auth/forgot-password')
                .send({ email: 'no-such-account@magen.local' });

            expect(forKnownEmail.status).toBe(200);
            expect(forUnknownEmail.status).toBe(200);
            expect(forKnownEmail.body.message).toBe(forUnknownEmail.body.message);
        });

        it('sets a password reset token on the user record for a known email', async () => {
            const testUser = await createTestUser('VOLUNTEER');
            userIds.push(testUser.id);

            await request(app).post('/api/auth/forgot-password').send({ email: testUser.email });

            const updated = await prisma.user.findUnique({ where: { id: testUser.id } });
            expect(updated?.passwordResetTokenHash).toEqual(expect.any(String));
            expect(updated?.passwordResetExpiresAt).not.toBeNull();
        });
    });

    describe('POST /api/auth/reset-password', () => {
        it('rejects an invalid/unknown token', async () => {
            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({ token: 'this-token-does-not-exist', password: 'NewPassword123!' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('קישור איפוס הסיסמה אינו תקין או שפג תוקפו');
        });

        it('rejects an expired token even if it otherwise matches a real user', async () => {
            const testUser = await createTestUser('VOLUNTEER');
            userIds.push(testUser.id);

            const rawToken = 'expired-raw-token-for-test';
            const tokenHash = hashToken(rawToken);
            await prisma.user.update({
                where: { id: testUser.id },
                data: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: new Date(Date.now() - 60 * 1000) },
            });

            const res = await request(app)
                .post('/api/auth/reset-password')
                .send({ token: rawToken, password: 'NewPassword123!' });

            expect(res.status).toBe(400);
            expect(res.body.message).toBe('קישור איפוס הסיסמה אינו תקין או שפג תוקפו');
        });

        it('resets the password with a valid, unexpired token, and the token cannot be reused', async () => {
            const testUser = await createTestUser('VOLUNTEER');
            userIds.push(testUser.id);

            const rawToken = 'valid-raw-token-for-test';
            const tokenHash = hashToken(rawToken);
            await prisma.user.update({
                where: { id: testUser.id },
                data: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: new Date(Date.now() + 60 * 1000) },
            });

            const newPassword = 'BrandNewPassword123!';
            const firstAttempt = await request(app)
                .post('/api/auth/reset-password')
                .send({ token: rawToken, password: newPassword });
            expect(firstAttempt.status).toBe(200);

            const updatedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
            expect(await bcrypt.compare(newPassword, updatedUser!.password)).toBe(true);
            expect(updatedUser?.passwordResetTokenHash).toBeNull();

            const secondAttempt = await request(app)
                .post('/api/auth/reset-password')
                .send({ token: rawToken, password: 'AnotherPassword123!' });
            expect(secondAttempt.status).toBe(400);
        });
    });
});
