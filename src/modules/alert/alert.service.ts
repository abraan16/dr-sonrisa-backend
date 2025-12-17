import axios from 'axios';

export class AlertService {
    private static botToken = process.env.TELEGRAM_BOT_TOKEN;
    private static chatId = process.env.TELEGRAM_ALERT_CHAT_ID;

    static async sendAlert(message: string) {
        if (!this.botToken || !this.chatId) {
            console.warn('Telegram credentials not set. Alert not sent.');
            return;
        }

        try {
            await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
                chat_id: this.chatId,
                text: message,
                parse_mode: 'Markdown'
            });
            console.log('Alert sent to Telegram');
        } catch (error) {
            console.error('Error sending Telegram alert:', error);
        }
    }

    static async notifyOpportunity(patientName: string, score: number) {
        await this.sendAlert(`🚨 *Oportunidad Detectada*\nPaciente: ${patientName}\nScore: ${score}\n_Requiere atención inmediata._`);
    }

    static async notifyConversion(patientName: string, date: string) {
        await this.sendAlert(`✅ *Nueva Cita Agendada*\nPaciente: ${patientName}\nFecha: ${date}\n🎉`);
    }
}
