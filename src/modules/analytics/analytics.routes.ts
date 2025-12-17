import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';

const router = Router();

router.post('/ask', AnalyticsController.ask);

export default router;
