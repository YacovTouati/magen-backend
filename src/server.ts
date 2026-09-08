import app from './app';
import { startIntakeRetentionJob } from './jobs/intakeRetentionJob';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`⚡ [Magen Backend]: השרת רץ בצורה מאובטחת על http://localhost:${PORT}`);
    startIntakeRetentionJob();
});
