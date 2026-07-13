import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'הנתיב המבוקש לא נמצא' });
};

// חייב 4 פרמטרים כדי ש-Express יזהה זאת כ-error handler.
// זו רשת הביטחון האחרונה: תופסת גם שגיאות פענוח JSON וגם כל שגיאה
// שברחה מבלוקי try/catch של ה-controllers, ולעולם לא חושפת stack/error.message ללקוח.
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
        return res.status(400).json({ success: false, message: 'גוף הבקשה אינו JSON תקין' });
    }

    console.error('⛔ Unhandled error:', err);
    return res.status(500).json({ success: false, message: 'שגיאת שרת פנימית' });
};
