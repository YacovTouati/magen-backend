import 'dotenv/config';

// Tests must never send a real email — resendClient.ts reads this at import
// time, so it has to be cleared before any test file (or the app it imports)
// gets required. An empty key makes `resend` resolve to null there, which
// makes both emailService.ts and logger.ts fall back to their console-only stub.
process.env.RESEND_API_KEY = '';
