import { UserRepository } from '../repositories/userRepository';
import { EmailService } from './emailService';

interface IntakeAlertData {
    id: number;
    callerName: string;
    phone: string | null;
    reportedBy: string;
}

// Fire-and-forget by design (see both call sites: intakeService.create and
// reportService.processAndSaveReport call notifyNewIntake without awaiting it) —
// a slow or failing notification email must never delay or fail the Intake
// creation response itself. Every failure is caught and logged here, never thrown.
export class IntakeAlertService {
    private userRepository = new UserRepository();
    private emailService = new EmailService();

    async notifyNewIntake(intake: IntakeAlertData): Promise<void> {
        try {
            const recipients = await this.userRepository.findSuperAdminsWithIntakeAlerts();
            await Promise.all(
                recipients.map((recipient) => this.emailService.sendIntakeAlertEmail(recipient.email, intake))
            );
        } catch (error) {
            console.error(`⛔ Failed to dispatch new-intake alert emails for intake #${intake.id}:`, error);
        }
    }
}
