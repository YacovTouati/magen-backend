import rateLimit from 'express-rate-limit';

// הגנה כללית מפני עומס/שימוש לרעה על כלל ה-API
export const generalApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 דקות
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'יותר מדי בקשות מכתובת זו, אנא נסה שוב מאוחר יותר' },
});

// הגנה מפני ניחוש סיסמאות (brute force) על נקודת הכניסה
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 דקות
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { success: false, message: 'יותר מדי ניסיונות התחברות, אנא נסה שוב בעוד כמה דקות' },
});

// הגנה מפני יצירת דיווחים/תיקים בכמות חריגה מחשבון בודד
export const reportSubmissionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // שעה
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'יותר מדי דיווחים נשלחו מכתובת זו, אנא נסה שוב מאוחר יותר' },
});
