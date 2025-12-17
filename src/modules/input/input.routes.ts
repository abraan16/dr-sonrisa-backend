import { Router } from 'express';
import { InputController } from './input.controller';

const router = Router();

// Webhook endpoint for Evolution API
router.post('/webhook', InputController.handleWebhook);

export default router;
