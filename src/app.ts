import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { validateCallReport } from './middlewares/validators';
import { authRouter } from './routes/authRoutes';
import { intakeRouter } from './routes/intakeRoutes';
import { reportRouter } from './routes/reportRoutes';
import { userRouter } from './routes/userRoutes';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// 🛡️ שכבת אבטחה גלובלית
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:4200', // מאפשר לאנגולר שלך גישה
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// בדיקת תקינות השרת (Health Check)
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'up',
        timestamp: new Date()
    });
});

// Mount API routers under /api
app.use('/api', authRouter);
app.use('/api', intakeRouter);
app.use('/api', reportRouter);
app.use('/api', userRouter);

app.listen(PORT, () => {
    console.log(`⚡ [Magen Backend]: השרת רץ בצורה מאובטחת על http://localhost:${PORT}`);
});