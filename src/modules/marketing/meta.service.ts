import axios from 'axios';
import crypto from 'crypto';

export class MetaService {
    private static ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    private static PIXEL_ID = process.env.META_PIXEL_ID;
    private static API_VERSION = 'v18.0';

    /**
     * Send conversion event to Meta (CAPI)
     */
    static async sendEvent(eventName: string, patient: any, eventSourceUrl: string = '') {
        try {
            if (!this.ACCESS_TOKEN || !this.PIXEL_ID) {
                console.warn('[MetaService] Missing Meta credentials. Skipping event.');
                return;
            }

            // Hash sensitive data (SHA-256)
            const hash = (data: string) => crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');

            const payload = {
                data: [
                    {
                        event_name: eventName,
                        event_time: Math.floor(Date.now() / 1000),
                        action_source: 'system_generated',
                        user_data: {
                            ph: [hash(patient.phone.replace(/\D/g, ''))],
                            // fn: patient.name ? [hash(patient.name.split(' ')[0])] : undefined,
                            // ln: patient.name && patient.name.split(' ').length > 1 ? [hash(patient.name.split(' ').pop() || '')] : undefined,
                        },
                        custom_data: {
                            currency: 'DOP',
                            value: eventName === 'Purchase' ? 1000 : 1, // Optional: adjust based on business value
                        },
                        event_source_url: eventSourceUrl || 'https://wa.me/' + patient.phone
                    }
                ]
            };

            const url = `https://graph.facebook.com/${this.API_VERSION}/${this.PIXEL_ID}/events?access_token=${this.ACCESS_TOKEN}`;

            await axios.post(url, payload);
            console.log(`[MetaService] Event '${eventName}' sent for ${patient.phone}`);

        } catch (error: any) {
            console.error('[MetaService] Error sending event to Meta:', error.response?.data || error.message);
        }
    }
}
