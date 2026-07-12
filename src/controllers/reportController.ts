import { Request, Response } from 'express';
import { ReportService } from '../services/reportService';

const reportService = new ReportService();

export const createCallReport = async (req: Request, res: Response) => {
    try {
        // חילוץ כל השדות הישנים והחדשים שעברו את ה-Validator בהצלחה
        const {
            callDuration, callerType, callPurpose, summaryNotes,
            callerName, phone, email, region, gender, sector, contactedOtherCenterBefore,
            reportingDuty
        } = req.body;

        // העברת האובייקט המלא לשכבת הלוגיקה (Service)
        const savedReport = await reportService.processAndSaveReport({
            callDuration,
            callerType,
            callPurpose,
            summaryNotes,
            callerName,
            phone,
            email,
            region,
            gender,
            sector,
            contactedOtherCenterBefore
            , reportingDuty
        });

        return res.status(201).json({
            success: true,
            message: 'הדיווח המורחב עבר ולידציה מלאה ונשמר בהצלחה',
            data: savedReport
        });

    } catch (error) {
        console.error('⛔ שגיאה חמורה ב-Controller:', error);
        return res.status(500).json({
            success: false,
            message: 'שגיאת שרת פנימית - הבקשה נחסמה מטעמי אבטחה'
        });
    }
};