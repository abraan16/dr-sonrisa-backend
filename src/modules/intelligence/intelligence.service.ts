import { OutputService } from '../output/output.service';

// ... (previous imports)

// 5. Send back to user (Via Output/WhatsApp Service)
console.log(`[Diana] Response to ${patient.phone}: ${aiResponse}`);
await OutputService.sendMessage(patient.phone, aiResponse);
import openai from '../../config/openai';
import { MemoryService } from './memory.service';
import { SchedulerService } from '../scheduler/scheduler.service';

export class IntelligenceService {

    static async handleInteraction(patient: any, userMessage: string) {
        try {
            // 1. Get Context
            const history = await MemoryService.getContext(patient.id);

            // 2. Prepare System Prompt (Diana Persona)
            const systemPrompt = `
Eres Diana, la asistente virtual de "Dr. Sonrisa".
Tu objetivo es gestionar citas, responder dudas sobre tratamientos dentales y ser amable.
NO envíes links.
Si el usuario quiere agendar, propón horarios o pregunta disponibilidad.
Estilo: Empático, profesional pero cercano. Usa emojis ocasionalmente.

Hoy es: ${new Date().toLocaleString()}
Datos del paciente: ${patient.name} (${patient.phone})
      `;

            const messages: any[] = [
                { role: 'system', content: systemPrompt },
                ...history,
                { role: 'user', content: userMessage }
            ];

            // Tools Definition
            const tools: any[] = [
                {
                    type: 'function',
                    function: {
                        name: 'check_availability',
                        description: 'Check available slots for a given date',
                        parameters: {
                            type: 'object',
                            properties: {
                                date: { type: 'string', description: 'Date in YYYY-MM-DD format (e.g. 2023-10-27)' }
                            },
                            required: ['date']
                        }
                    }
                },
                {
                    type: 'function',
                    function: {
                        name: 'book_appointment',
                        description: 'Book an appointment for the patient',
                        parameters: {
                            type: 'object',
                            properties: {
                                startTime: { type: 'string', description: 'ISO 8601 start time (e.g. 2023-10-27T10:00:00)' }
                            },
                            required: ['startTime']
                        }
                    }
                }
            ];

            // 3. Call LLM
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: messages,
                temperature: 0.7,
                tools: tools,
                tool_choice: 'auto'
            });

            const responseMessage = completion.choices[0].message;
            let aiResponse = responseMessage?.content || '';

            // Handle Tool Calls
            if (responseMessage.tool_calls) {
                messages.push(responseMessage); // Add assistant's tool call intention to history

                for (const toolCall of responseMessage.tool_calls) {
                    const toolCallAny = toolCall as any;
                    const functionName = toolCallAny.function.name;
                    const functionArgs = JSON.parse(toolCallAny.function.arguments);
                    let functionResponse = '';

                    console.log(`[Diana] Calling tool: ${functionName} with args:`, functionArgs);

                    try {
                        if (functionName === 'check_availability') {
                            const slots = await SchedulerService.checkAvailability(new Date(functionArgs.date));
                            if (slots.length > 0) {
                                functionResponse = JSON.stringify({ available_slots: slots });
                            } else {
                                functionResponse = JSON.stringify({ message: "No slots available for this date." });
                            }
                        } else if (functionName === 'book_appointment') {
                            await SchedulerService.createAppointment(patient.id, functionArgs.startTime);
                            functionResponse = JSON.stringify({ status: 'confirmed', time: functionArgs.startTime });
                        }
                    } catch (e: any) {
                        functionResponse = JSON.stringify({ error: e.message });
                    }

                    messages.push({
                        tool_call_id: toolCall.id,
                        role: 'tool',
                        name: functionName,
                        content: functionResponse,
                    });
                }

                // Second Call to Client to generate natural response
                const secondResponse = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                });
                aiResponse = secondResponse.choices[0].message?.content || 'Entendido.';
            }

            // 4. Save Response
            await prisma.interaction.create({
                data: {
                    patientId: patient.id,
                    role: 'assistant',
                    content: aiResponse,
                }
            });

            // 5. Send back to user
            console.log(`[Diana] Response to ${patient.phone}: ${aiResponse}`);
            await OutputService.sendMessage(patient.phone, aiResponse);

            return aiResponse;

        } catch (error) {
            console.error('Error in IntelligenceService:', error);
            return null;
        }
    }
}
