import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { analyticsRouter } from './routes/analyticsRoutes';
import { assignmentRouter } from './routes/assignmentRoutes';
import { authRouter } from './routes/authRoutes';
import { intakeRouter } from './routes/intakeRoutes';
import { reportRouter } from './routes/reportRoutes';
import { userRouter } from './routes/userRoutes';
import { generalApiLimiter } from './middlewares/rateLimiters';
import { globalErrorHandler, notFoundHandler } from './middlewares/errorHandler';

const app: Application = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';

// 🛡️ שכבת אבטחה גלובלית
app.use(helmet());
app.use(cors({
    origin: CORS_ORIGIN, // מאפשר לאנגולר שלך גישה
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '100kb' }));

// בדיקת תקינות השרת (Health Check)
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'up',
        timestamp: new Date()
    });
});

// Mount API routers under /api
app.use('/api', generalApiLimiter);
app.use('/api', analyticsRouter);
app.use('/api', assignmentRouter);
app.use('/api', authRouter);
app.use('/api', intakeRouter);
app.use('/api', reportRouter);
app.use('/api', userRouter);

// כל נתיב שלא נתפס — 404 מובנה, לא ה-HTML הדיפולטיבי של Express
app.use(notFoundHandler);

// רשת ביטחון אחרונה לכל שגיאה שלא נתפסה קודם — חייבת להיות אחרונה
app.use(globalErrorHandler);

app.listen(PORT, () => {
    console.log(`⚡ [Magen Backend]: השרת רץ בצורה מאובטחת על http://localhost:${PORT}`);
});
