import { Request, Response } from 'express';
import { InputService } from './input.service';

export class InputController {

    static async handleWebhook(req: Request, res: Response) {
        try {
            const { body } = req;

            // Verification logic for Evolution API (if needed anywhere)
            // Usually Evolution API just sends the payload

            console.log('Webhook Received:', JSON.stringify(body, null, 2));

            // Extract relevant data
            const data = body.data;
            if (!data) {
                return res.status(200).send('OK'); // Ack to avoid retries
            }

            const messageType = data.messageType;
            const remoteJid = data.key?.remoteJid;
            const pushName = data.pushName;

            if (!remoteJid) {
                return res.status(200).send('No JID found');
            }

            // Async processing
            InputService.processMessage({
                remoteJid,
                pushName,
                messageType,
                fromMe: data.key?.fromMe || false, // Detect if message is from receptionist
                content: messageType === 'conversation' ? data.message?.conversation :
                    messageType === 'extendedTextMessage' ? data.message?.extendedTextMessage :
                        messageType === 'audioMessage' ? data.message?.audioMessage :
                            data.message
            }).catch(err => console.error('Error processing message:', err));

            return res.status(200).json({ status: 'received' });
        } catch (error) {
            console.error('Error in webhook:', error);
            return res.status(500).send('Internal Server Error');
        }
    }
}
