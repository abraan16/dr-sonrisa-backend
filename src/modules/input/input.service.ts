import prisma from '../../database/prisma';
import { AudioService } from './audio.service';
import { IntelligenceService } from '../intelligence/intelligence.service';

interface MessageData {
    remoteJid: string;
    pushName: string;
    messageType: string;
    content: any; // content from Evolution API can be complex
}

export class InputService {

    /**
     * Normalización de Identidad: Buscamos al paciente por teléfono.
     * Si no existe, lo creamos.
     */
    static async findOrCreatePatient(remoteJid: string, pushName: string) {
        // remoteJid format is '5215555555555@s.whatsapp.net', we usually want the number
        const phone = remoteJid.split('@')[0];

        let patient = await prisma.patient.findUnique({
            where: { phone }
        });

        if (!patient) {
            console.log(`Creating new patient for phone: ${phone}`);
            patient = await prisma.patient.create({
                data: {
                    phone,
                    pushName,
                    name: pushName // Default name to pushName initially
                }
            });
        } else {
            // Update pushName if changed (optional)
            if (pushName && patient.pushName !== pushName) {
                await prisma.patient.update({
                    where: { id: patient.id },
                    data: { pushName }
                });
            }
        }

        return patient;
    }

    static async processMessage(data: MessageData) {
        const { remoteJid, pushName, messageType, content } = data;

        // 1. Normalize Identity
        const patient = await this.findOrCreatePatient(remoteJid, pushName);

        // 2. Extract Text (or Transcribe Audio)
        let textBody = '';

        if (messageType === 'conversation') {
            textBody = content; // Simple text
        } else if (messageType === 'extendedTextMessage') {
            textBody = content.text;
        } else if (messageType === 'audioMessage') {
            if (content?.url) {
                textBody = await AudioService.transcribe(content.url);
            } else {
                textBody = '[AUDIO NO URL]';
            }
            console.log(`[InputService] Transcription result: ${textBody}`);
        } else {
            console.log(`[InputService] Unhandled message type: ${messageType}`);
            return; // Skip other types for now
        }

        // 3. Log Interaction
        await prisma.interaction.create({
            data: {
                patientId: patient.id,
                role: 'user',
                content: textBody,
                mediaType: messageType === 'audioMessage' ? 'audio' : 'text'
            }
        });

        console.log(`[Input] Processed message for ${patient.phone}: "${textBody}"`);

        // 4. Trigger Intelligence Core (Async)
        IntelligenceService.handleInteraction(patient, textBody);
    }
}
