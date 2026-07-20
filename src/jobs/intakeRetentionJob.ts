import cron from 'node-cron';
import { IntakeService } from '../services/intakeService';

const intakeService = new IntakeService();

// Hourly is frequent enough that an expired intake never lingers much past
// its actual deadline, without hammering the DB on every request cycle.
const SCHEDULE = '0 * * * *';

export const startIntakeRetentionJob = () => {
    cron.schedule(SCHEDULE, async () => {
        try {
            const { count } = await intakeService.deleteExpiredIntakes();
            if (count > 0) {
                console.log(`🗑️  Intake retention job: permanently deleted ${count} expired intake(s).`);
            }
        } catch (error) {
            console.error('⛔ Intake retention job failed:', error);
        }
    });
};
