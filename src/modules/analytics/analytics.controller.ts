import { Request, Response } from 'express';
import { ManagerService } from '../intelligence/manager.service';

export class AnalyticsController {

    static async ask(req: Request, res: Response) {
        try {
            const { query } = req.body;

            if (!query) {
                return res.status(400).json({ error: 'Query is required' });
            }

            // Create a mock patient object for admin
            const adminPatient = {
                id: 'admin',
                phone: process.env.ADMIN_WHATSAPP_NUMBER || 'admin',
                name: 'Admin'
            };

            const response = await ManagerService.handleAdminQuery(adminPatient, query);
            res.json({ response });
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
