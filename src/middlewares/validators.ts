import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// מספר טלפון: ספרות בלבד, עד 10 תווים (למשל 0501234567)
const PHONE_PATTERN = /^\d{1,10}$/;
const PHONE_INVALID_MESSAGE = 'מספר הטלפון אינו תקין (מקסימום 10 ספרות)';

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

  body('email')
    .trim()
    .notEmpty().withMessage('חובה להזין כתובת מייל')
    .isEmail().withMessage('כתובת המייל שהוזנה אינה תקינה'),

  body('region')
    .isIn(['north', 'center', 'south', 'jerusalem', 'haifa', 'judea_samaria'])
    .withMessage('אזור בארץ אינו תקין'),

  body('gender')
    .isIn(['male', 'female', 'other', 'unknown'])
    .withMessage('המגדר שהוזן אינו תקין'),

  body('sector')
    .isIn(['secular', 'traditional', 'religious', 'ultra_orthodox', 'arab', 'other'])
    .withMessage('המגזר שהוזן אינו תקין'),

  body('contactedOtherCenterBefore')
    .isBoolean().withMessage('השדה האם פנה בעבר למרכז אחר חייב להיות כן או לא (בוליאני)'),

  handleValidationErrors
];

// 🛡️ חוקי אימות ליצירת משתמש חדש
export const validateCreateUser = [
  body('email')
    .trim()
    .notEmpty().withMessage('חובה להזין כתובת מייל')
    .isEmail().withMessage('כתובת המייל שהוזנה אינה תקינה')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 }).withMessage('הסיסמה חייבת להכיל לפחות 8 תווים'),

  body('name')
    .trim()
    .notEmpty().withMessage('חובה להזין שם'),

  body('role')
    .isIn(['ADMIN', 'VOLUNTEER']).withMessage('תפקיד המשתמש אינו תקין'),

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

  body('assignedToId')
    .optional({ nullable: true })
    .isInt({ min: 1 }).withMessage('מזהה המטפל המשויך אינו תקין'),

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