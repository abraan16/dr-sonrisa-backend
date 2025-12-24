import axios from 'axios';

export class TelegramService {
    private static botToken = process.env.TELEGRAM_BOT_TOKEN;
    private static chatId = process.env.TELEGRAM_CHAT_ID;

    static async notifyError(context: string, error: any) {
        if (!this.botToken || !this.chatId) {
            console.warn('[Telegram] No configuration found. Skipping alert.');
            return;
        }

        try {
            const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
            const timestamp = new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' });

            const text = `
🚨 *SYSTEM ALERT (Dr. Sonrisa AI)*
📅 ${timestamp}
📂 Context: ${context}

❌ *Error:*
\`${errorMessage}\`
            `.trim();

            await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                chat_id: this.chatId,
                text,
                parse_mode: 'Markdown'
            });

            console.log('[Telegram] Error alert sent successfully.');
        } catch (err) {
            console.error('[Telegram] Failed to send alert:', err);
        }
    }

    static async notifyDeployment(msg: string) {
        if (!this.botToken || !this.chatId) return;
        try {
            await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                chat_id: this.chatId,
                text: `🚀 *Deployment info:* ${msg}`,
                parse_mode: 'Markdown'
            });
        } catch { }
    }
}
