import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// magen-app.com is now verified in Resend — sending from it instead of the
// shared onboarding@resend.dev test domain, which was rate-limited and only
// reliably deliverable to the account's own verified addresses. Overridable
// via env (matching FRONTEND_URL's pattern) in case the sender ever needs to
// change without a code deploy.
export const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'noreply@magen-app.com';

// Shared by emailService.ts and logger.ts — kept in its own module (rather than
// living inside emailService.ts) so logger.ts can send alert emails without a
// circular import (emailService.ts itself reports its own failures via logger.ts).
export const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;
