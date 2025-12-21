import app from './app';
import { ReactivationService } from './modules/reactivation/reactivation.service';
import { HandoffService } from './modules/handoff/handoff.service';
import cron from 'node-cron';

const PORT = process.env.PORT || 3000;

// Initialize lead follow-up system
ReactivationService.init();

// Initialize handoff timeout monitoring (every 30 minutes)
cron.schedule('*/30 * * * *', async () => {
    console.log('[Handoff] Running timeout check...');
    await HandoffService.checkTimeouts();
}, {
    timezone: 'America/Santo_Domingo'
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
