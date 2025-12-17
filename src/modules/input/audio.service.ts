import openai from '../../config/openai';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';

export class AudioService {
    static async transcribe(audioUrl: string): Promise<string> {
        try {
            if (!audioUrl) return '';

            console.log(`Downloading audio from: ${audioUrl}`);

            // 1. Download the file
            const response = await axios({
                method: 'GET',
                url: audioUrl,
                responseType: 'stream',
            });

            // Generic temp file path
            const tempApiKey = new Date().getTime();
            const tempFilePath = path.join(os.tmpdir(), `whatsapp_audio_${tempApiKey}.ogg`);

            const writer = fs.createWriteStream(tempFilePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(null));
                writer.on('error', reject);
            });

            // 2. Transcribe with OpenAI
            console.log('Transcribing with Whisper...');
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: 'whisper-1',
            });

            // Cleanup
            fs.unlinkSync(tempFilePath);

            return transcription.text;
        } catch (error) {
            console.error('Error in AudioService.transcribe:', error);
            return '[Error extracting audio transcription]';
        }
    }
}
