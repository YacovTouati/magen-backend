// No email provider is wired up yet (no SendGrid/SES/nodemailer dependency, no
// API key in .env) — this stub logs the link instead of sending it. Registration
// and password-reset tokens are fully functional and secure end-to-end (hashed
// at rest, expiring, single-use), but until a real provider replaces this class,
// an invited/resetting user has no way to receive their link except someone
// reading server logs and handing it to them manually. Must be replaced before
// this feature is usable by real, non-technical users.
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

export class EmailService {
    async sendInviteEmail(email: string, rawToken: string): Promise<void> {
        const link = `${FRONTEND_URL}/register?token=${rawToken}`;
        console.log(`📧 [EMAIL STUB — no provider configured] Invite for ${email}: ${link}`);
    }

    async sendPasswordResetEmail(email: string, rawToken: string): Promise<void> {
        const link = `${FRONTEND_URL}/reset-password?token=${rawToken}`;
        console.log(`📧 [EMAIL STUB — no provider configured] Password reset for ${email}: ${link}`);
    }
}
