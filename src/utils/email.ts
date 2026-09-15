// Single choke point for email comparison/storage across invite, register, login
// and forgot-password — none of those previously normalized case or whitespace, so
// whatever casing an admin happened to type into an invite (or a mobile keyboard's
// auto-capitalized first letter) permanently decided whether that person could ever
// log in again. Applied at every repository read/write site touching email columns.
export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}
