import cron from 'node-cron';
import { IntakeService } from '../services/intakeService';

const intakeService = new IntakeService();

// Hourly is frequent enough that an expired intake never lingers much past
// its actual deadline, without hammering the DB on every request cycle.
const SCHEDULE = '0 * * * *';

// File-scoped, not per-call — node-cron doesn't guard against overlapping
// runs on its own, so if a sweep ever ran long (DB hiccup, connection
// stall) a second tick firing mid-sweep would overlap statements against
// the same table. Guards against that, not against normal-speed runs.
let isExecuting = false;

export const startIntakeRetentionJob = () => {
    cron.schedule(SCHEDULE, async () => {
        if (isExecuting) {
            console.warn('⚠️  Intake retention job: previous sweep still running, skipping this tick.');
            return;
        }

        isExecuting = true;
        try {
            const { count } = await intakeService.deleteExpiredIntakes();
            if (count > 0) {
                console.log(`🗑️  Intake retention job: permanently deleted ${count} expired intake(s).`);
            }
        } catch (error) {
            console.error('⛔ Intake retention job failed:', error);
        } finally {
            isExecuting = false;
        }
    });
};
