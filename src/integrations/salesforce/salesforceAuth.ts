import jwt from 'jsonwebtoken';
import { SalesforceConfig } from './salesforceConfig';

export interface SalesforceSession {
    accessToken: string;
    instanceUrl: string;
}

// Salesforce requires the JWT assertion's `exp` to be a few minutes out at most —
// this is a short-lived signed request, not a session token.
const ASSERTION_EXPIRY_SECONDS = 180;

interface SalesforceTokenResponse {
    access_token?: string;
    instance_url?: string;
    error?: string;
    error_description?: string;
}

// jsforce does not itself implement the JWT Bearer handshake — this is the
// widely-documented pattern: sign the assertion ourselves (reusing the same
// `jsonwebtoken` package already used for our own auth) and POST it directly
// to Salesforce's OAuth token endpoint, then hand the resulting access token
// to a jsforce Connection for the actual API calls.
export async function authenticateWithJwtBearer(config: SalesforceConfig): Promise<SalesforceSession> {
    const assertion = jwt.sign(
        {
            iss: config.clientId,
            sub: config.username,
            aud: config.loginUrl,
        },
        config.privateKey,
        {
            algorithm: 'RS256',
            expiresIn: ASSERTION_EXPIRY_SECONDS,
        }
    );

    const tokenUrl = `${config.loginUrl}/services/oauth2/token`;
    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion,
        }),
    });

    const body = await response.json().catch(() => null) as SalesforceTokenResponse | null;

    if (!response.ok || !body?.access_token || !body?.instance_url) {
        const reason = body?.error_description || body?.error || `HTTP ${response.status}`;
        throw new Error(`אימות JWT Bearer מול Salesforce נכשל: ${reason}`);
    }

    return {
        accessToken: body.access_token,
        instanceUrl: body.instance_url,
    };
}
