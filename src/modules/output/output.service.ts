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
     * Send a notification to all configured administrators.
     * Unifies: ADMIN_NUMBERS, ADMIN_WHATSAPP_NUMBER, NOTIFICATION_PHONES, OWNER_WHATSAPP_NUMBER
     */
    static async notifyAdmins(text: string, instanceName?: string) {
        const envVars = [
            process.env.ADMIN_NUMBERS,
            process.env.ADMIN_WHATSAPP_NUMBER,
            process.env.NOTIFICATION_PHONES,
            process.env.OWNER_WHATSAPP_NUMBER
        ];

        // Combine all and remove duplicates
        const allNumbers = envVars
            .filter(v => !!v)
            .join(',')
            .split(',')
            .map(n => n.trim())
            .filter(n => n.length > 5); // Basic check for valid number length

        const uniqueNumbers = [...new Set(allNumbers)];

        console.log(`[Output] Notifying ${uniqueNumbers.length} unique admins (Instance: ${instanceName || 'default'})...`);

        for (const adminPhone of uniqueNumbers) {
            // Normalize: Ensure no @s.whatsapp.net for the Evolution API 'number' field
            const cleanNumber = adminPhone.split('@')[0];
            await this.sendMessage(cleanNumber, text, instanceName);
        }
    }
}
