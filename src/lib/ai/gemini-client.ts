import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export async function generateWithGemini(
    prompt: string,
    options?: {
        model?: string
        temperature?: number
        maxTokens?: number
    }
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({
            model: options?.model || 'gemini-pro',
        })

        const generationConfig = {
            temperature: options?.temperature || 0.7,
            maxOutputTokens: options?.maxTokens || 2048,
        }

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig,
        })

        const response = result.response
        return response.text()
    } catch (error) {
        console.error('Gemini API Error:', error)
        throw new Error('Failed to generate response with Gemini')
    }
}

export async function chatWithGemini(
    messages: Array<{ role: 'user' | 'model'; content: string }>,
    options?: {
        model?: string
        temperature?: number
    }
): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({
            model: options?.model || 'gemini-pro',
        })

        const chat = model.startChat({
            history: messages.slice(0, -1).map((msg) => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            })),
            generationConfig: {
                temperature: options?.temperature || 0.7,
                maxOutputTokens: 2048,
            },
        })

        const lastMessage = messages[messages.length - 1]
        const result = await chat.sendMessage(lastMessage.content)
        return result.response.text()
    } catch (error) {
        console.error('Gemini Chat Error:', error)
        throw new Error('Failed to chat with Gemini')
    }
}

export { genAI }
