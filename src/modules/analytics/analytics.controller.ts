import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {

    static async ask(req: Request, res: Response) {
        try {
            const { query } = req.body;
            if (!query) return res.status(400).send('Query required');

            const answer = await AnalyticsService.askManager(query);
            return res.json({ answer });
        } catch (error) {
            return res.status(500).json({ error: 'Internal Error' });
        }
    }
}
