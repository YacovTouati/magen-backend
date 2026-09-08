import fs from 'fs';
import path from 'path';
import { resend, FROM_ADDRESS } from './resendClient';

// Everything the app used to only print with console.error/warn disappeared the
// moment the process restarted, with no way to look back at what happened to a
// specific user's request. This appends the same events to a file so they can
// be grepped later (e.g. by email) instead of being lost.
const LOG_DIR = path.join(__dirname, '../../logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Personal request from Yacov — every logged issue also lands directly in his
// inbox, not just the file, so nothing needs to wait for someone to go look.
const ALERT_EMAIL = 'yacovtouati@gmail.com';

type LogLevel = 'error' | 'warn';

const write = (level: LogLevel, context: string, meta?: Record<string, unknown>): void => {
    const entry = { timestamp: new Date().toISOString(), level, context, ...meta };
    fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', (err) => {
        if (err) {
            console.error('⛔ Failed to write to log file:', err);
        }
    });
};

const escapeHtml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Fire-and-forget, like every other email in this app — an alert email must
// never delay or fail the request that triggered it. Failures here only go to
// console.error (never back through logError/logWarn), otherwise a broken
// email provider would recursively re-trigger this same function forever.
const sendAlertEmail = (level: LogLevel, context: string, meta?: Record<string, unknown>): void => {
    if (!resend) {
        return;
    }

    const entry = { timestamp: new Date().toISOString(), level, context, ...meta };
    const subject = `מגן ${level === 'error' ? '⛔ שגיאה' : '⚠️ אזהרה'}: ${context}`;
    const html = `<pre dir="ltr" style="white-space: pre-wrap; font-family: monospace; font-size: 13px;">${escapeHtml(JSON.stringify(entry, null, 2))}</pre>`;

    resend.emails.send({ from: FROM_ADDRESS, to: ALERT_EMAIL, subject, html }).catch((err) => {
        console.error('⛔ Failed to send log-alert email:', err);
    });
};

// Unexpected/internal failures — exceptions that hit a catch-all.
export const logError = (context: string, error: unknown, meta?: Record<string, unknown>): void => {
    console.error(`⛔ ${context}:`, error);
    const fullMeta = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        ...meta,
    };
    write('error', context, fullMeta);
    sendAlertEmail('error', context, fullMeta);
};

// Expected failures worth auditing (wrong password, expired token, etc.) —
// these already return a clean 4xx to the client and never throw an
// exception, so logError's catch-all would never see them.
export const logWarn = (context: string, meta?: Record<string, unknown>): void => {
    console.warn(`⚠️  ${context}`, meta ?? '');
    write('warn', context, meta);
    sendAlertEmail('warn', context, meta);
};
