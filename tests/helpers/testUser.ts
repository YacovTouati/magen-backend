import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../src/db/prisma';
import { UserRole } from '../../src/types/user';

// Same convention already used by hand throughout this project's manual
// curl-verification scripts: temp-*@magen.local, always cleaned up afterwards.
export const TEST_EMAIL_PREFIX = 'temp-test-';

export const DEFAULT_TEST_PASSWORD = 'TestPass123!';

export interface TestUser {
    id: number;
    email: string;
    role: UserRole;
    password: string;
}

let counter = 0;

export async function createTestUser(role: UserRole, overrides: Partial<{ email: string; password: string }> = {}): Promise<TestUser> {
    counter += 1;
    const email = overrides.email ?? `${TEST_EMAIL_PREFIX}${role.toLowerCase()}-${Date.now()}-${counter}@magen.local`;
    const password = overrides.password ?? DEFAULT_TEST_PASSWORD;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: { email, password: hashedPassword, name: 'Test User', role },
    });

    return { id: user.id, email: user.email, role: user.role as UserRole, password };
}

// Signs a token directly instead of going through POST /auth/login — keeps
// test setup fast and avoids burning through loginLimiter's 10-per-window cap
// on tests that only need an authenticated request, not to test login itself.
export function issueTestToken(user: { id: number; email: string; role: UserRole }): string {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
    );
}

// Deletes Intakes before their linked CallReports (schema has no cascade on
// that relation — see prisma/schema.prisma), then the CallReports, then the
// users themselves. Safe to call even if a test created none of these.
export async function cleanupTestData(userIds: number[]): Promise<void> {
    if (userIds.length === 0) {
        return;
    }
    await prisma.intake.deleteMany({ where: { callReport: { createdById: { in: userIds } } } });
    await prisma.callReport.deleteMany({ where: { createdById: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}
