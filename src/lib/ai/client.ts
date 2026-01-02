import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import { Ollama } from 'ollama'
import { AI_TOOLS } from './tools'
import { AI_SYSTEM_PROMPT, executeAiTool, type UserContext, type DbOperations } from './agent'

// Types
export interface AiMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export interface AiResponse {
    text: string
    toolCalls?: Array<{
        name: string
        args: Record<string, any>
        result?: unknown
    }>
}

type AIProvider = 'gemini' | 'groq' | 'ollama'

// Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'

// Clients
const geminiClient = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null
const groqClient = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null
const ollamaClient = new Ollama({ host: OLLAMA_HOST })

/**
 * Main AI generation function with Fallback Strategy
 */
export async function generateAiResponseWithStrategy(
    messages: AiMessage[],
    userContext: UserContext,
    db: DbOperations
): Promise<AiResponse> {
    const errors: Record<string, string> = {}

    // 1. Try Gemini (Primary)
    if (geminiClient) {
        try {
            console.log('[AI Client] Attempting Gemini...')
            return await generateGeminiResponse(messages, userContext, db)
        } catch (error) {
            console.error('[AI Client] Gemini failed:', error)
            errors['gemini'] = String(error)
            // If it's a content safety policy or similar, we might want to stop
            // But if it's a quota/500 error, fall through
        }
    } else {
        errors['gemini'] = 'API Key missing'
    }

    // 2. Try Groq (Secondary)
    if (groqClient) {
        try {
            console.log('[AI Client] Attempting Groq (Fallback)...')
            return await generateGroqResponse(messages, userContext, db)
        } catch (error) {
            console.error('[AI Client] Groq failed:', error)
            errors['groq'] = String(error)
        }
    } else {
        errors['groq'] = 'API Key missing'
    }

    // 3. Try Ollama (Tertiary/Local)
    try {
        console.log('[AI Client] Attempting Ollama (Local)...')
        return await generateOllamaResponse(messages, userContext, db)
    } catch (error) {
        console.error('[AI Client] Ollama failed:', error)
        errors['ollama'] = String(error)
    }

    throw new Error(`All AI providers failed. Errors: ${JSON.stringify(errors)}`)
}

/**
 * Gemini Implementation
 */
async function generateGeminiResponse(
    messages: AiMessage[],
    userContext: UserContext,
    db: DbOperations
): Promise<AiResponse> {
    if (!geminiClient) throw new Error('Gemini client not initialized')

    // Note: We use the 2.0-flash model as requested and verified
    const model = geminiClient.getGenerativeModel({
        model: 'gemini-2.0-flash',
        tools: [{ functionDeclarations: AI_TOOLS as any }],
    })

    const contextInfo = buildContextString(userContext)

    // Convert messages
    const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }))

    const chat = model.startChat({
        history: [
            { role: 'user', parts: [{ text: 'Initialize' }] },
            { role: 'model', parts: [{ text: AI_SYSTEM_PROMPT + contextInfo }] },
            ...history
        ],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
    })

    const latestMessage = messages[messages.length - 1]
    let response = await chat.sendMessage(latestMessage.content)
    const toolCalls: AiResponse['toolCalls'] = []

    // Handle function calls
    while (response.response.functionCalls()?.length) {
        const functionCalls = response.response.functionCalls()!
        const functionResponses = []

        for (const call of functionCalls) {
            try {
                const result = await executeAiTool(call.name, call.args as Record<string, any>, userContext, db)

                toolCalls.push({
                    name: call.name,
                    args: call.args as Record<string, any>,
                    result: result.result
                })

                functionResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: { result: result.result }
                    }
                })
            } catch (error) {
                functionResponses.push({
                    functionResponse: {
                        name: call.name,
                        response: { error: String(error) }
                    }
                })
            }
        }
        response = await chat.sendMessage(functionResponses)
    }

    return {
        text: response.response.text(),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    }
}

/**
 * Groq Implementation
 * Using llama3-70b-8192 or similar
 */
async function generateGroqResponse(
    messages: AiMessage[],
    userContext: UserContext,
    db: DbOperations
): Promise<AiResponse> {
    if (!groqClient) throw new Error('Groq client not initialized')

    const contextInfo = buildContextString(userContext)
    const systemMessage = { role: 'system', content: AI_SYSTEM_PROMPT + contextInfo }

    const formattedMessages = [
        systemMessage,
        ...messages.map(m => ({ role: m.role, content: m.content }))
    ]

    // Note: Groq SDK structure is similar to OpenAI
    const completion = await groqClient.chat.completions.create({
        messages: formattedMessages as any,
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 2048,
        // Tools could be added here if Groq supports the same schema, 
        // but for fallback we might just use text-only or simplified logic initially.
        // For now, let's keep it simple and focus on text response for fallback.
        // If we want tool use, we need to map the tools to OpenAI format.
    })

    const responseText = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."

    // Basic text response for fallback
    return { text: responseText }
}

/**
 * Ollama Implementation
 * Using llama3 or mistral
 */
async function generateOllamaResponse(
    messages: AiMessage[],
    userContext: UserContext,
    db: DbOperations
): Promise<AiResponse> {
    const contextInfo = buildContextString(userContext)
    const systemMessage = { role: 'system', content: AI_SYSTEM_PROMPT + contextInfo }

    const formattedMessages = [
        systemMessage,
        ...messages
    ]

    // Try to use a common model
    const model = 'llama3' // User needs to pull this

    const response = await ollamaClient.chat({
        model: model,
        messages: formattedMessages as any,
        stream: false
    })

    return { text: response.message.content }
}

// Helper
function buildContextString(userContext: UserContext): string {
    const parts = []
    if (userContext.todayHabitsCompleted !== undefined) {
        parts.push(`Habits today: ${userContext.todayHabitsCompleted}/${userContext.totalActiveHabits}`)
    }
    if (userContext.currentStreak > 0) {
        parts.push(`Streak: ${userContext.currentStreak} days`)
    }
    if (userContext.pendingTasks !== undefined) {
        parts.push(`Pending tasks: ${userContext.pendingTasks}`)
    }
    if (userContext.recentMood) {
        parts.push(`Recent mood: ${userContext.recentMood}`)
    }

    return parts.length > 0 ? `\n\n[User context: ${parts.join(', ')}]` : ''
}
