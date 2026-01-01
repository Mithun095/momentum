import 'dotenv/config'
import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai'

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

// System prompt for the AI assistant
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

export interface AiMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
}

/**
 * Get the Gemini model
 */
export function getGeminiModel(): GenerativeModel | null {
    const ai = getGenAI()
    if (!ai) return null
    return ai.getGenerativeModel({ model: 'gemini-1.5-flash' })
}

/**
 * Generate a response using Gemini
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

    // Get the latest user message
    const latestMessage = messages[messages.length - 1]

    const result = await chat.sendMessage(latestMessage.content)
    const response = result.response.text()

    return response
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
