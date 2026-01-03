import 'dotenv/config'
import { GoogleGenerativeAI, type Part, type Content } from '@google/generative-ai'
import { AI_TOOLS } from './ai/tools'
import { AI_SYSTEM_PROMPT, executeAiTool, type UserContext, type DbOperations } from './ai/agent'

// Initialize the Gemini client lazily
let genAI: GoogleGenerativeAI | null = null

function getGenAI() {
    if (genAI) return genAI

    const key = process.env.GEMINI_API_KEY
    if (key) {
        genAI = new GoogleGenerativeAI(key)
    }
    return genAI
}

export interface AiMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

export interface AiResponseWithTools {
    text: string
    toolCalls?: Array<{
        name: string
        args: Record<string, unknown>
        result?: unknown
    }>
}

/**
 * Get the Gemini model (legacy - without tools)
 */
export function getGeminiModel() {
    const ai = getGenAI()
    if (!ai) return null
    return ai.getGenerativeModel({ model: 'gemini-1.5-flash' })
}

/**
 * Get the Gemini model with function calling enabled
 */
export function getGeminiModelWithTools() {
    const ai = getGenAI()
    if (!ai) return null

    return ai.getGenerativeModel({
        model: 'gemini-1.5-flash',
        tools: [{ functionDeclarations: AI_TOOLS as any }],
    })
}

/**
 * Generate a response using Gemini with function calling support
 */
export async function generateAiResponseWithTools(
    messages: AiMessage[],
    userContext: UserContext,
    db: DbOperations
): Promise<AiResponseWithTools> {
    const model = getGeminiModelWithTools()

    if (!model) {
        throw new Error('AI service not configured. Set GEMINI_API_KEY in your environment.')
    }

    // Build context info string
    const contextParts = []
    if (userContext.todayHabitsCompleted !== undefined && userContext.totalActiveHabits !== undefined) {
        contextParts.push(`Habits today: ${userContext.todayHabitsCompleted}/${userContext.totalActiveHabits}`)
    }
    if (userContext.currentStreak > 0) {
        contextParts.push(`Current streak: ${userContext.currentStreak} days`)
    }
    if (userContext.pendingTasks !== undefined) {
        contextParts.push(`Pending tasks: ${userContext.pendingTasks}`)
    }
    if (userContext.recentMood) {
        contextParts.push(`Recent mood: ${userContext.recentMood}`)
    }

    const contextInfo = contextParts.length > 0
        ? `\n\n[User context: ${contextParts.join(', ')}]`
        : ''

    // Convert messages to Gemini format
    const history: Content[] = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }))

    // Start chat with system prompt and tools
    const chat = model.startChat({
        history: [
            { role: 'user', parts: [{ text: 'Initialize' }] },
            { role: 'model', parts: [{ text: AI_SYSTEM_PROMPT + contextInfo }] },
            ...history
        ],
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
        }
    })

    const latestMessage = messages[messages.length - 1]
    let response
    try {
        console.log('[Gemini] Sending message:', latestMessage.content.slice(0, 100))
        response = await chat.sendMessage(latestMessage.content)
        console.log('[Gemini] Got response, checking for function calls...')
    } catch (error) {
        console.error('[Gemini] API Error:', error)
        throw new Error(`Gemini API error: ${error instanceof Error ? error.message : String(error)}`)
    }

    let responseText = ''
    const toolCalls: AiResponseWithTools['toolCalls'] = []

    // Handle function calls in a loop (agent can call multiple tools)
    while (response.response.functionCalls()?.length) {
        const functionCalls = response.response.functionCalls()!

        // Execute each function call
        const functionResponses: Part[] = []

        for (const call of functionCalls) {
            try {
                const result = await executeAiTool(
                    call.name,
                    call.args as Record<string, unknown>,
                    userContext,
                    db
                )

                toolCalls.push({
                    name: call.name,
                    args: call.args as Record<string, unknown>,
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

        // Send function results back to the model
        response = await chat.sendMessage(functionResponses)
    }

    // Get the final text response
    responseText = response.response.text()

    return {
        text: responseText,
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    }
}

/**
 * Generate a response using Gemini (legacy - without tools)
 */
export async function generateAiResponse(
    messages: AiMessage[],
    userContext?: {
        todayHabitsCompleted?: number
        totalHabits?: number
        recentMood?: string
        pendingTasks?: number
    }
): Promise<string> {
    const model = getGeminiModel()

    if (!model) {
        throw new Error('AI service not configured. Set GEMINI_API_KEY in your environment.')
    }

    // Build context from user data
    let contextInfo = ''
    if (userContext) {
        const parts = []
        if (userContext.todayHabitsCompleted !== undefined && userContext.totalHabits !== undefined) {
            parts.push(`Today's habits: ${userContext.todayHabitsCompleted}/${userContext.totalHabits} completed`)
        }
        if (userContext.recentMood) {
            parts.push(`Recent mood: ${userContext.recentMood}`)
        }
        if (userContext.pendingTasks !== undefined) {
            parts.push(`Pending tasks: ${userContext.pendingTasks}`)
        }
        if (parts.length > 0) {
            contextInfo = `\n\n[User context: ${parts.join(', ')}]`
        }
    }

    const SYSTEM_PROMPT = `You are Momentum AI, a helpful personal assistant for the Momentum life management platform.

Your capabilities include:
- Helping users plan their day and manage tasks
- Providing motivation and encouragement for habits
- Offering insights on productivity and wellness
- Answering questions about using the Momentum platform
- Helping users reflect on their journal entries
- Suggesting healthy habits and routines

Guidelines:
- Be concise but helpful - prefer shorter responses unless detail is needed
- Be encouraging and positive, but not overly enthusiastic
- When users mention tasks, habits, or goals, offer actionable suggestions
- If a user seems stressed, offer calming and practical advice
- Use markdown formatting for lists and emphasis when helpful
- Ask clarifying questions when the user's request is unclear

Remember: You're a supportive companion helping users build better habits and achieve their goals.`

    // Convert messages to Gemini format
    const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
        parts: [{ text: msg.content }]
    }))

    // Start chat with system prompt
    const chat = model.startChat({
        history: [
            { role: 'user' as const, parts: [{ text: 'Initialize' }] },
            { role: 'model' as const, parts: [{ text: SYSTEM_PROMPT + contextInfo }] },
            ...history
        ],
        generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
        }
    })

    const latestMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(latestMessage.content)
    return result.response.text()
}

/**
 * Generate a quick insight based on user data
 */
export async function generateQuickInsight(data: {
    habitsCompletedToday: number
    totalHabits: number
    currentStreak: number
    pendingTasks: number
    mood?: string
}): Promise<string> {
    const model = getGeminiModel()

    if (!model) {
        return "Keep up the great work! Track your habits and tasks to see personalized insights."
    }

    const prompt = `Based on this user's data, provide a brief (1-2 sentences) motivational insight or suggestion:
- Habits completed today: ${data.habitsCompletedToday}/${data.totalHabits}
- Current streak: ${data.currentStreak} days
- Pending tasks: ${data.pendingTasks}
${data.mood ? `- Current mood: ${data.mood}` : ''}

Be encouraging and specific. Focus on one actionable insight.`

    try {
        const result = await model.generateContent(prompt)
        return result.response.text()
    } catch (error) {
        console.error('Failed to generate insight:', error)
        return "You're making progress! Keep tracking your habits and tasks."
    }
}

/**
 * Check if AI is available
 */
export function isAiAvailable(): boolean {
    const key = process.env.GEMINI_API_KEY
    console.log('DEBUG: Checking AI availability. Key loaded:', key ? `${key.substring(0, 5)}...` : 'undefined')

    // Check if it's not the placeholder
    const isAvailable = !!key && key.length > 0 && !key.includes('AIzaSyB8UZays3rpuWZ5uE_wPvAXq258JlmXF0U')

    if (!isAvailable) {
        console.warn('AI Unavailable: GEMINI_API_KEY is missing or invalid.')
    }

    return isAvailable
}
