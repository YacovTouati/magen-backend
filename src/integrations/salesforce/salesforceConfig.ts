export interface SalesforceConfig {
    loginUrl: string;
    clientId: string;
    username: string;
    privateKey: string;
}

export class SalesforceConfigError extends Error {}

// Reads + validates env vars lazily (called only when a Salesforce operation actually
// runs) rather than at module load — so a backend without Salesforce configured yet
// still boots normally instead of crashing on missing env vars it doesn't need yet.
export function loadSalesforceConfig(): SalesforceConfig {
    const loginUrl = process.env.SALESFORCE_LOGIN_URL;
    const clientId = process.env.SALESFORCE_CLIENT_ID;
    const username = process.env.SALESFORCE_USERNAME;
    const privateKeyBase64 = process.env.SALESFORCE_PRIVATE_KEY_BASE64;

    const missing = [
        !loginUrl && 'SALESFORCE_LOGIN_URL',
        !clientId && 'SALESFORCE_CLIENT_ID',
        !username && 'SALESFORCE_USERNAME',
        !privateKeyBase64 && 'SALESFORCE_PRIVATE_KEY_BASE64',
    ].filter((name): name is string => Boolean(name));

    if (missing.length > 0) {
        throw new SalesforceConfigError(`חסרים משתני סביבה להתחברות ל-Salesforce: ${missing.join(', ')}`);
    }

    let privateKey: string;
    try {
        privateKey = Buffer.from(privateKeyBase64 as string, 'base64').toString('utf8');
    } catch {
        throw new SalesforceConfigError('SALESFORCE_PRIVATE_KEY_BASE64 אינו Base64 תקין');
    }

    if (!privateKey.includes('BEGIN') || !privateKey.includes('PRIVATE KEY')) {
        throw new SalesforceConfigError('SALESFORCE_PRIVATE_KEY_BASE64 אינו מכיל מפתח פרטי בפורמט PEM תקין לאחר פענוח');
    }

    return {
        loginUrl: loginUrl as string,
        clientId: clientId as string,
        username: username as string,
        privateKey,
    };
}
