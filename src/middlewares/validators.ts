import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

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
    .isMobilePhone('any').withMessage('מספר הטלפון שהוזן אינו תקין'),

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

  // פונקציית ניתוח תוצאות הבדיקה
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // חסימה מיידית במידה ויש שדות לא תקינים
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({ field: (err as any).path, message: err.msg }))
      });
    }
    next();
  }
];