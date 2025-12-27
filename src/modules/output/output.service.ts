import axios from 'axios';

export class OutputService {
    private static get baseUrl() {
        return process.env.EVOLUTION_API_URL;
    }

    private static get apiKey() {
        return process.env.EVOLUTION_API_KEY;
    }

    private static get instanceName() {
        return process.env.EVOLUTION_INSTANCE_NAME;
    }

    static async sendMessage(phone: string, text: string, instanceName?: string) {
        try {
            const finalInstance = instanceName || this.instanceName;
            const url = `${this.baseUrl}/message/sendText/${finalInstance}`;

            // Evolution API expects remoteJid or number.
            const payload = {
                number: phone,
                text: text,
                delay: 1200,
                linkPreview: false
            };

            const headers = {
                'apikey': this.apiKey,
                'Content-Type': 'application/json'
            };

            console.log(`[Output] Sending message to ${phone}...`);
            const response = await axios.post(url, payload, { headers });

            return response.data;
        } catch (error: any) {
            console.error('[Output] Error sending message:', JSON.stringify(error.response?.data || error.message, null, 2));
            return null;
        }
    }

    /**
     * Send a notification to all configured administrators
     */
    static async notifyAdmins(text: string, instanceName?: string) {
        const adminNumbers = (process.env.ADMIN_NUMBERS || process.env.ADMIN_WHATSAPP_NUMBER || '').split(',').map(n => n.trim()).filter(n => n.length > 0);

        console.log(`[Output] Notifying ${adminNumbers.length} admins...`);

        for (const adminPhone of adminNumbers) {
            await this.sendMessage(adminPhone, text, instanceName);
        }
    }
}
