/**
 * AI Tool Definitions for Gemini Function Calling
 * These tools allow the AI to perform actions on behalf of the user
 */

// Simple schema types for function declarations
export const AI_TOOLS = [
    {
        name: 'createTask',
        description: 'Create a new task for the user. Use this when the user asks to create, add, or schedule a task.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                title: {
                    type: 'STRING' as const,
                    description: 'The title of the task (required)'
                },
                description: {
                    type: 'STRING' as const,
                    description: 'Optional description or details for the task'
                },
                dueDate: {
                    type: 'STRING' as const,
                    description: 'Due date in YYYY-MM-DD format. Use "today" or "tomorrow" relative to current date.'
                },
                priority: {
                    type: 'STRING' as const,
                    description: 'Priority level: must be one of "low", "medium", or "high". Default is "medium".'
                },
                category: {
                    type: 'STRING' as const,
                    description: 'Task category like "work", "personal", "health", "shopping", etc.'
                }
            },
            required: ['title']
        }
    },
    {
        name: 'createHabit',
        description: 'Create a new habit for the user to track. Use this when the user asks to create or start a new habit.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                name: {
                    type: 'STRING' as const,
                    description: 'Name of the habit (required)'
                },
                description: {
                    type: 'STRING' as const,
                    description: 'Optional description of what the habit involves'
                },
                frequency: {
                    type: 'STRING' as const,
                    description: 'How often: must be either "daily" or "weekly". Default is "daily".'
                },
                category: {
                    type: 'STRING' as const,
                    description: 'Category like "health", "productivity", "mindfulness", "learning", etc.'
                },
                reminderTime: {
                    type: 'STRING' as const,
                    description: 'Time to remind in HH:MM format (24 hour)'
                }
            },
            required: ['name']
        }
    },
    {
        name: 'suggestHabits',
        description: 'Suggest personalized habits based on user patterns and goals. Use when user asks for habit recommendations.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                focusArea: {
                    type: 'STRING' as const,
                    description: 'Area to focus on: "health", "productivity", "mindfulness", "fitness", "learning", or "general"'
                },
                difficulty: {
                    type: 'STRING' as const,
                    description: 'Difficulty level: "easy", "moderate", or "challenging". Default is "moderate".'
                }
            },
            required: []
        }
    },
    {
        name: 'getInsights',
        description: 'Get productivity insights and statistics about the user\'s habits, tasks, and mood patterns.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                period: {
                    type: 'STRING' as const,
                    description: 'Time period: must be "today", "week", or "month". Default is "week".'
                },
                insightType: {
                    type: 'STRING' as const,
                    description: 'Type of insights: "habits", "tasks", "mood", or "all". Default is "all".'
                }
            },
            required: []
        }
    },
    {
        name: 'analyzeMood',
        description: 'Analyze mood patterns from journal entries and provide emotional insights.',
        parameters: {
            type: 'OBJECT' as const,
            properties: {
                days: {
                    type: 'NUMBER' as const,
                    description: 'Number of days to analyze. Default is 7.'
                }
            },
            required: []
        }
    }
]

/**
 * Tool result types for type safety
 */
export interface TaskCreationResult {
    success: boolean
    taskId?: string
    title: string
    dueDate?: string
    message: string
}

export interface HabitCreationResult {
    success: boolean
    habitId?: string
    name: string
    message: string
}

export interface HabitSuggestion {
    name: string
    description: string
    category: string
    difficulty: string
    reason: string
}

export interface InsightResult {
    period: string
    habitsCompleted: number
    tasksCompleted: number
    averageMood?: string
    streakDays: number
    summary: string
}

export interface MoodAnalysisResult {
    dominantMood: string
    moodTrend: 'improving' | 'stable' | 'declining'
    entries: number
    summary: string
}

export type ToolResult =
    | { tool: 'createTask'; result: TaskCreationResult }
    | { tool: 'createHabit'; result: HabitCreationResult }
    | { tool: 'suggestHabits'; result: HabitSuggestion[] }
    | { tool: 'getInsights'; result: InsightResult }
    | { tool: 'analyzeMood'; result: MoodAnalysisResult }
