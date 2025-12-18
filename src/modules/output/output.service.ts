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

            const payload = {
                number: phone,
                options: {
                    delay: 1200,
                    presence: "composing",
                    linkPreview: false
                },
                textMessage: {
                    text: text
                }
            };

            const headers = {
                'apikey': this.apiKey,
                'Content-Type': 'application/json'
            };

            console.log(`[Output] Sending message to ${phone}...`);
            const response = await axios.post(url, payload, { headers });

            console.log(`[Output] Message sent successfully: ${response.data?.key?.id}`);
            return response.data;

        } catch (error: any) {
            console.error('[Output] Error sending message via Evolution API:', error.response?.data || error.message);
            // Non-blocking error for main flow, but we log it.
            return null;
        }
    }
}
