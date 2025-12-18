import app from './app';
import { ReactivationService } from './modules/reactivation/reactivation.service';

const PORT = process.env.PORT || 3000;

// Initialize lead follow-up system
ReactivationService.init();

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
