import { Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';

const analyticsService = new AnalyticsService();

export const getAnalyticsSummary = async (req: Request, res: Response) => {
    try {
        const summary = await analyticsService.getSummary();
        return res.status(200).json({ success: true, data: summary });
    } catch (error) {
        console.error('⛔ Analytics controller error:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
