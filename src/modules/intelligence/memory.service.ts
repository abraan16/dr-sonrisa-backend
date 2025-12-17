import prisma from '../../database/prisma';

export class MemoryService {

    /**
     * Retrieves the last N interactions for a patient to build context.
     */
    static async getContext(patientId: string, limit: number = 10) {
        const interactions = await prisma.interaction.findMany({
            where: { patientId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        // Reverse to chronological order for the LLM
        return interactions.reverse().map(interaction => ({
            role: interaction.role as 'user' | 'assistant' | 'system',
            content: interaction.content,
        }));
    }

    /**
     * (Future) Search vector embeddings for relevant past info.
     */
    static async searchSemanticMemory(query: string, patientId: string) {
        // TODO: Implement pgvector search
        return [];
    }
}
