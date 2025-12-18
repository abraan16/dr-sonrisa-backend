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

    static async sendMessage(phone: string, text: string) {
        try {
            const url = `${this.baseUrl}/message/sendText/${this.instanceName}`;

            // Evolution API expects remoteJid or number.
            // If phone is just number, we might need to append suffix, 
            // but Evolution V2 usually handles just numbers if formatted correctly.
            // Let's assume phone is clean number string.

            // Simplified payload for Evolution API v1.x/v2.x compatibility
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

            console.log(`[Output] Sending message to ${phone}... Payload:`, JSON.stringify(payload));
            const response = await axios.post(url, payload, { headers });

            console.log(`[Output] Message sent successfully: ${response.data?.key?.id}`);
            return response.data;

        } catch (error: any) {
            console.error('[Output] Error sending message via Evolution API:', JSON.stringify(error.response?.data || error.message, null, 2));
            // Non-blocking error for main flow, but we log it.
            return null;
        }
    }
}
