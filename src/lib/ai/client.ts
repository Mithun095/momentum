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
    provider?: string
}

// Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434'

// Clients
const groqClient = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null
const ollamaClient = new Ollama({ host: OLLAMA_HOST })

// Map Gemini tools to OpenAI/Groq format
// Map Tools to OpenAI/Groq Format (Convert uppercase types to lowercase)
function convertSchema(schema: any): any {
    if (!schema || typeof schema !== 'object') return schema

    const newSchema = { ...schema }

    if (newSchema.type === 'OBJECT') newSchema.type = 'object'
    if (newSchema.type === 'STRING') newSchema.type = 'string'
    if (newSchema.type === 'NUMBER') newSchema.type = 'number'
    if (newSchema.type === 'BOOLEAN') newSchema.type = 'boolean'
    if (newSchema.type === 'ARRAY') newSchema.type = 'array'

    if (newSchema.properties) {
        const newProperties: any = {}
        for (const key in newSchema.properties) {
            newProperties[key] = convertSchema(newSchema.properties[key])
        }
        newSchema.properties = newProperties
    }

    return newSchema
}

const GROQ_TOOLS = AI_TOOLS.map(tool => ({
    type: 'function' as const,
    function: {
        name: tool.name,
        description: tool.description,
        parameters: convertSchema(tool.parameters)
    }
}))

/**
 * Main AI generation function with Fallback Strategy
 * Priority: Groq -> Ollama
 */
export async function generateAiResponseWithStrategy(
    messages: AiMessage[],
    userContext: UserContext,
    db: DbOperations
): Promise<AiResponse> {
    const errors: Record<string, string> = {}

    // 1. Try Groq (Primary)
    if (groqClient) {
        try {
            console.log('[AI Client] Attempting Groq (Primary)...')
            return await generateGroqResponse(messages, userContext, db)
        } catch (error) {
            console.error('[AI Client] Groq failed:', error)
            errors['groq'] = String(error)
        }
    } else {
        errors['groq'] = 'API Key missing'
    }

    // 2. Try Ollama (Fallback)
    try {
        console.log('[AI Client] Attempting Ollama (Fallback)...')
        return await generateOllamaResponse(messages, userContext, db)
    } catch (error) {
        console.error('[AI Client] Ollama failed:', error)
        errors['ollama'] = String(error)
    }

    throw new Error(`All AI providers failed. Errors: ${JSON.stringify(errors)}`)
}

/**
 * Groq Implementation
 * Using llama-3.3-70b-versatile with Tool Calling
 */
async function generateGroqResponse(
    messages: AiMessage[],
    userContext: UserContext,
    db: DbOperations
): Promise<AiResponse> {
    if (!groqClient) throw new Error('Groq client not initialized')

    const contextInfo = buildContextString(userContext)
    const systemMessage = { role: 'system', content: AI_SYSTEM_PROMPT + contextInfo }

    let currentMessages = [
        systemMessage,
        ...messages.map(m => ({ role: m.role, content: m.content }))
    ]

    const model = 'llama-3.3-70b-versatile'
    const toolCallsResult: AiResponse['toolCalls'] = []

    // First call to get response or tool calls
    let completion = await groqClient.chat.completions.create({
        messages: currentMessages as any,
        model: model,
        temperature: 0.7,
        max_tokens: 2048,
        tools: GROQ_TOOLS,
        tool_choice: 'auto'
    })

    let responseMessage = completion.choices[0]?.message

    // Handle Tool Calls Loop
    while (responseMessage?.tool_calls) {
        const toolCalls = responseMessage.tool_calls

        // Append assistant's too_calls message to history
        currentMessages.push(responseMessage as any)

        for (const toolCall of toolCalls) {
            const functionName = toolCall.function.name
            const functionArgs = JSON.parse(toolCall.function.arguments)

            console.log(`[Groq] Executing tool: ${functionName}`)

            try {
                const result = await executeAiTool(functionName, functionArgs, userContext, db)

                toolCallsResult.push({
                    name: functionName,
                    args: functionArgs,
                    result: result.result
                })

                // Append tool result to history
                currentMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result.result)
                } as any)

            } catch (error) {
                console.error(`[Groq] Tool execution failed: ${error}`)
                currentMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify({ error: String(error) })
                } as any)
            }
        }

        // Get next response from model
        completion = await groqClient.chat.completions.create({
            messages: currentMessages as any,
            model: model,
            temperature: 0.7,
            max_tokens: 2048,
            tools: GROQ_TOOLS
        })

        responseMessage = completion.choices[0]?.message
    }

    return {
        text: responseMessage?.content || "I couldn't generate a response.",
        toolCalls: toolCallsResult.length > 0 ? toolCallsResult : undefined,
        provider: 'groq'
    }
}

/**
 * Ollama Implementation
 * Using llama3 or mistral (Text Only fallback for now)
 */
async function generateOllamaResponse(
    messages: AiMessage[],
    userContext: UserContext,
    db: DbOperations
): Promise<AiResponse> {
    const contextInfo = buildContextString(userContext)
    const FALLBACK_NOTICE = "\n\n[SYSTEM NOTICE: You are running in FALLBACK MODE (Ollama). You DO NOT have access to tools. Do NOT claim to create tasks, habits, or analyze data. Instead, suggest what the user should do.]"

    const systemMessage = { role: 'system', content: AI_SYSTEM_PROMPT + contextInfo + FALLBACK_NOTICE }

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

    return {
        text: response.message.content,
        provider: 'ollama'
    }
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
