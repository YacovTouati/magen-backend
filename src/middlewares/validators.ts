import { body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// מספר טלפון: ספרות בלבד, בין 7 ספרות (קווי) ל-10 ספרות (נייד)
const PHONE_PATTERN = /^\d{7,10}$/;
const PHONE_INVALID_MESSAGE = 'מספר הטלפון אינו תקין (נדרשות בין 7 ל-10 ספרות)';

// סיסמה חזקה: לפחות 8 תווים, אות גדולה אחת, ספרה אחת, ותו מיוחד אחד
const STRONG_PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const STRONG_PASSWORD_MESSAGE = 'הסיסמה חייבת להכיל לפחות 8 תווים, אות גדולה אחת, ספרה אחת ותו מיוחד אחד';

// פונקציית ניתוח תוצאות בדיקה משותפת
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({ field: (err as any).path, message: err.msg }))
    });
  }
  next();
};

// 🛡️ חוקי אימות קשיחים ומורחבים לטופס דיווח שיחה החדש
export const validateCallReport = [
  // שדות קודמים
  body('callDuration')
    .isInt({ min: 1, max: 480 }).withMessage('אורך השיחה חייב להיות מספר דקות הגיוני (בין 1 ל-480)'),

  body('callerType')
    .isIn(['victim', 'family', 'friend']).withMessage('סוג הפונה אינו תקין'),

  body('callPurpose')
    .isIn(['counseling', 'coercion', 'crisis']).withMessage('מטרת השיחה אינה תואמת את הגדרות הארגון'),

  body('summaryNotes')
    .trim()
    .isLength({ min: 5, max: 5000 }).withMessage('סיכום השיחה חייב להכיל בין 5 ל-5000 תווים'),

  // 🔥 שדות חדשים שהתווספו לדרישת הארגון:
  body('callerName')
    .trim()
    .notEmpty().withMessage('חובה להזין שם פונה (ניתן להשתמש בשם בדוי)'),

  body('phone')
    .trim()
    .notEmpty().withMessage('חובה להזין מספר טלפון')
    .bail()
    .matches(PHONE_PATTERN).withMessage(PHONE_INVALID_MESSAGE),

  // אופציונלי — דוח יכול להישמר גם אם שדה המייל נותר ריק
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail().withMessage('כתובת המייל שהוזנה אינה תקינה'),

  // טקסט חופשי (לא רשימה סגורה) — כתובת/יישוב בפועל, לא רק אזור כללי בארץ
  body('region')
    .trim()
    .notEmpty().withMessage('חובה להזין אזור בארץ')
    .isLength({ max: 200 }).withMessage('אזור בארץ ארוך מדי'),

  body('gender')
    .isIn(['male', 'female', 'other', 'unknown'])
    .withMessage('המגדר שהוזן אינו תקין'),

  body('sector')
    .isIn(['secular', 'traditional', 'religious', 'ultra_orthodox', 'arab', 'other'])
    .withMessage('המגזר שהוזן אינו תקין'),

  body('receivedSupportAtOtherCenter')
    .isBoolean().withMessage('השדה האם קיבל ליווי במרכז סיוע אחר חייב להיות כן או לא (בוליאני)'),

  body('isFamilyMemberOrAcquaintance')
    .isBoolean().withMessage('השדה האם מכר או בן משפחה של נפגע חייב להיות כן או לא (בוליאני)'),

  body('magenContactHistory')
    .isIn(['first_time', 'past', 'dont_remember'])
    .withMessage('היסטוריית הפנייה למגן אינה תקינה'),

  handleValidationErrors
];

// 🛡️ חוקי אימות ליצירת משתמש חדש
// 🛡️ חוקי אימות להזמנת משתמש חדש (whitelist) — אין כאן שדה סיסמה בכלל:
// המוזמן קובע את הסיסמה שלו בעצמו בהרשמה, לא המנהל.
export const validateInviteUser = [
  body('email')
    .trim()
    .notEmpty().withMessage('חובה להזין כתובת מייל')
    .isEmail().withMessage('כתובת המייל שהוזנה אינה תקינה')
    .normalizeEmail(),

  body('role')
    .isIn(['SUPER_ADMIN', 'INTAKE_ADMIN', 'SCHEDULER_ADMIN', 'VOLUNTEER']).withMessage('תפקיד המשתמש אינו תקין'),

  handleValidationErrors
];

// 🛡️ חוקי אימות להרשמה עצמית (רק למי שכתובת המייל שלו ברשימת ההזמנות)
export const validateRegister = [
  body('email')
    .trim()
    .notEmpty().withMessage('חובה להזין כתובת מייל')
    .isEmail().withMessage('כתובת המייל שהוזנה אינה תקינה')
    .normalizeEmail(),

  body('password')
    .matches(STRONG_PASSWORD_PATTERN).withMessage(STRONG_PASSWORD_MESSAGE),

  body('name')
    .trim()
    .notEmpty().withMessage('חובה להזין שם'),

  body('phone')
    .trim()
    .notEmpty().withMessage('חובה להזין מספר טלפון')
    .bail()
    .matches(PHONE_PATTERN).withMessage(PHONE_INVALID_MESSAGE),

  body('token')
    .trim()
    .notEmpty().withMessage('חסר טוקן הרשמה'),

  handleValidationErrors
];

export const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('חובה להזין כתובת מייל')
    .isEmail().withMessage('כתובת המייל שהוזנה אינה תקינה')
    .normalizeEmail(),

  handleValidationErrors
];

export const validateResetPassword = [
  body('token')
    .trim()
    .notEmpty().withMessage('חסר טוקן איפוס סיסמה'),

  body('password')
    .matches(STRONG_PASSWORD_PATTERN).withMessage(STRONG_PASSWORD_MESSAGE),

  handleValidationErrors
];

export const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('חובה להזין את הסיסמה הנוכחית'),

  body('newPassword')
    .matches(STRONG_PASSWORD_PATTERN).withMessage(STRONG_PASSWORD_MESSAGE),

  handleValidationErrors
];

// 🛡️ חוקי אימות לעדכון תפקיד משתמש קיים
export const validateUpdateUserRole = [
  body('role')
    .isIn(['SUPER_ADMIN', 'INTAKE_ADMIN', 'SCHEDULER_ADMIN', 'VOLUNTEER']).withMessage('תפקיד המשתמש אינו תקין'),

  handleValidationErrors
];

// 🛡️ חוקי אימות לכניסת משתמש (login)
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('חובה להזין כתובת מייל')
    .isEmail().withMessage('כתובת המייל שהוזנה אינה תקינה')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('חובה להזין סיסמה'),

  handleValidationErrors
];

// 🛡️ חוקי אימות לעדכון סטטוס תיק (Intake)
export const validateUpdateIntakeStatus = [
  body('status')
    .isIn(['NEW', 'NO_ANSWER', 'ACTIVE', 'CLOSED', 'LONG_TERM']).withMessage('סטטוס אינו תקין'),

  handleValidationErrors
];

// 🛡️ חוקי אימות ליצירת תיק (Intake) ידנית על ידי מנהל
export const validateCreateIntake = [
  body('callerName')
    .trim()
    .notEmpty().withMessage('חובה להזין שם פונה'),

  body('phone')
    .trim()
    .notEmpty().withMessage('חובה להזין מספר טלפון')
    .bail()
    .matches(PHONE_PATTERN).withMessage(PHONE_INVALID_MESSAGE),

  body('contactedOtherCenter')
    .trim()
    .notEmpty().withMessage('חובה לציין האם הפונה פנה למרכז אחר'),

  body('caseDescription')
    .trim()
    .isLength({ min: 5, max: 5000 }).withMessage('תיאור המקרה חייב להכיל בין 5 ל-5000 תווים'),

  body('urgency')
    .isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).withMessage('רמת הדחיפות אינה תקינה'),

  body('status')
    .optional()
    .isIn(['NEW', 'NO_ANSWER', 'ACTIVE', 'CLOSED', 'LONG_TERM']).withMessage('סטטוס אינו תקין'),

  handleValidationErrors
];

// 🛡️ חוקי אימות לשיבוץ מתנדב ליום ביומן
export const validateUpsertAssignment = [
  body('date')
    .isISO8601().withMessage('תאריך אינו תקין (נדרש פורמט YYYY-MM-DD)'),

  body('volunteerId')
    .isInt({ min: 1 }).withMessage('מזהה המתנדב אינו תקין'),

  handleValidationErrors
];

// 🛡️ חוקי אימות ליצירת לוח משמרות חודשי
export const validateCreateSchedule = [
  body('month')
    .isInt({ min: 1, max: 12 }).withMessage('חודש אינו תקין (נדרש ערך בין 1 ל-12)'),

  body('year')
    .isInt({ min: 2020, max: 2100 }).withMessage('שנה אינה תקינה'),

  handleValidationErrors
];

// 🛡️ חוקי אימות לחיפוש לוח משמרות לפי חודש ושנה
export const validateScheduleLookup = [
  query('month')
    .isInt({ min: 1, max: 12 }).withMessage('חודש אינו תקין (נדרש ערך בין 1 ל-12)'),

  query('year')
    .isInt({ min: 2020, max: 2100 }).withMessage('שנה אינה תקינה'),

  handleValidationErrors
];

// 🛡️ חוקי אימות לשיבוץ מתנדב למשמרת על ידי מנהל
export const validateAdminAssignShift = [
  body('volunteerId')
    .isInt({ min: 1 }).withMessage('מזהה המתנדב אינו תקין'),

  handleValidationErrors
];