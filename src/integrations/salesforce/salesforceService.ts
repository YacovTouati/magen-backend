import jsforce from 'jsforce';
import { loadSalesforceConfig } from './salesforceConfig';
import { authenticateWithJwtBearer } from './salesforceAuth';

export interface SalesforceConnectionResult {
    success: boolean;
    message: string;
}

export class SalesforceService {
    // Proves the full handshake end-to-end (config -> signed JWT -> token exchange ->
    // authenticated API call), not just that a token was issued. Never throws: any
    // failure at any stage (missing config, bad key, Salesforce rejecting the
    // assertion, network failure) is caught and logged here, so a caller — including
    // a future route handler — can never let a Salesforce outage crash a request.
    async testConnection(): Promise<SalesforceConnectionResult> {
        try {
            const config = loadSalesforceConfig();
            const session = await authenticateWithJwtBearer(config);

            const conn = new jsforce.Connection({
                instanceUrl: session.instanceUrl,
                accessToken: session.accessToken,
            });

            const identity = await conn.identity();

            console.log(
                `✅ Salesforce connection verified (org: ${identity.organization_id}, user: ${identity.username})`
            );
            return {
                success: true,
                message: `מחובר בהצלחה ל-Salesforce כ-${identity.username}`,
            };
        } catch (error) {
            console.error('⛔ Salesforce connection test failed:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'חיבור ל-Salesforce נכשל מסיבה לא ידועה',
            };
        }
    }
}
