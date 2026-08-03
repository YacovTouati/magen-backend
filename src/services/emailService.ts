import { Resend } from 'resend';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
// magen-app.com is now verified in Resend — sending from it instead of the
// shared onboarding@resend.dev test domain, which was rate-limited and only
// reliably deliverable to the account's own verified addresses. Overridable
// via env (matching FRONTEND_URL's pattern) in case the sender ever needs to
// change without a code deploy.
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'noreply@magen-app.com';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const wrapRtlEmail = (title: string, bodyHtml: string): string => `
<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 8px;">
  <h2 style="color: #1f2937; margin-top: 0;">${title}</h2>
  ${bodyHtml}
</div>`;

const linkButtonHtml = (link: string, label: string, color: string): string => `
  <p style="text-align: center; margin: 32px 0;">
    <a href="${link}" style="background: ${color}; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
      ${label}
    </a>
  </p>
  <p style="color: #6b7280; font-size: 13px; word-break: break-all;">
    אם הכפתור לא עובד, אפשר להעתיק את הקישור הבא: ${link}
  </p>`;

export class EmailService {
    async sendInviteEmail(email: string, rawToken: string): Promise<void> {
        const link = `${FRONTEND_URL}/register?token=${rawToken}`;
        const html = wrapRtlEmail(
            'הזמנה למערכת מגן',
            `<p style="color: #374151; font-size: 15px; line-height: 1.6;">
                הוזמנת להירשם למערכת מגן. הקישור בתוקף ל-48 שעות.
             </p>` + linkButtonHtml(link, 'לחץ כאן להשלמת ההרשמה', '#16a34a')
        );

        await this.send(email, 'הזמנה להרשמה למערכת מגן', html, () =>
            console.log(`📧 [EMAIL STUB — no provider configured] Invite for ${email}: ${link}`)
        );
    }

    async sendPasswordResetEmail(email: string, rawToken: string): Promise<void> {
        const link = `${FRONTEND_URL}/reset-password?token=${rawToken}`;
        const html = wrapRtlEmail(
            'איפוס סיסמה - מגן',
            `<p style="color: #374151; font-size: 15px; line-height: 1.6;">
                התקבלה בקשה לאיפוס הסיסמה שלך במערכת מגן. הקישור בתוקף ל-15 דקות בלבד.
             </p>` + linkButtonHtml(link, 'לחץ כאן לאיפוס הסיסמה', '#2563eb') +
            `<p style="color: #6b7280; font-size: 13px;">
                אם לא ביקשת לאפס את הסיסמה, אפשר להתעלם מהודעה זו.
             </p>`
        );

        await this.send(email, 'איפוס סיסמה למערכת מגן', html, () =>
            console.log(`📧 [EMAIL STUB — no provider configured] Password reset for ${email}: ${link}`)
        );
    }

    // Never throws — a missing key, a bad key, or a Resend-side failure all
    // fall back to logging rather than bubbling up. Callers (forgot-password,
    // invite) already treat "email didn't actually arrive" as a legitimate
    // outcome the token/log line covers, not a reason to fail the whole
    // request (forgot-password in particular must always resolve the same
    // way regardless, to avoid leaking whether an email is registered).
    private async send(to: string, subject: string, html: string, logFallback: () => void): Promise<void> {
        if (!resend) {
            logFallback();
            return;
        }

        try {
            const { error } = await resend.emails.send({ from: FROM_ADDRESS, to, subject, html });
            if (error) {
                console.error(`⛔ Resend rejected email to ${to}:`, error);
                logFallback();
            }
        } catch (error) {
            console.error(`⛔ Failed to send email to ${to} via Resend:`, error);
            logFallback();
        }
    }
}
