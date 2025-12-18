import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import OpenAI from 'openai';

// Direct OpenAI client for Whisper (OpenRouter doesn't support audio transcription)
const whisperClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: 'https://api.openai.com/v1'
});

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

            // 2. Transcribe with OpenAI Whisper (direct, not through OpenRouter)
            console.log('Transcribing with Whisper...');
            const transcription = await whisperClient.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: 'whisper-1',
            });

            // Cleanup
            fs.unlinkSync(tempFilePath);

            console.log(`[AudioService] Transcription successful: "${transcription.text}"`);
            return transcription.text;
        } catch (error) {
            console.error('Error in AudioService.transcribe:', error);
            return '[Error extracting audio transcription]';
        }
    }
}
