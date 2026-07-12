import bcrypt from 'bcrypt';
import prisma from '../src/db/prisma';

const BOOTSTRAP_ADMIN_EMAIL = 'yacovtouati@gmail.com';
const BOOTSTRAP_ADMIN_TEMP_PASSWORD = 'MagenAdmin2026!';

async function main() {
    const existing = await prisma.user.findUnique({
        where: { email: BOOTSTRAP_ADMIN_EMAIL },
    });

    if (existing) {
        console.log(`ℹ️ משתמש admin (${BOOTSTRAP_ADMIN_EMAIL}) כבר קיים, מדלג על יצירה`);
        return;
    }

    const hashedPassword = await bcrypt.hash(BOOTSTRAP_ADMIN_TEMP_PASSWORD, 10);
    const admin = await prisma.user.create({
        data: {
            email: BOOTSTRAP_ADMIN_EMAIL,
            password: hashedPassword,
            name: 'Yacov Touati',
            role: 'ADMIN',
        },
    });

    console.log(`✅ נוצר משתמש admin ראשוני: ${admin.email} (סיסמה זמנית: ${BOOTSTRAP_ADMIN_TEMP_PASSWORD})`);
}

main()
    .catch((error) => {
        console.error('⛔ Seed נכשל:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
