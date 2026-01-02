import { GoogleGenerativeAI, FunctionCallingMode } from '@google/generative-ai'
import { AI_TOOLS, type ToolResult, type TaskCreationResult, type HabitCreationResult, type HabitSuggestion, type InsightResult, type MoodAnalysisResult } from './tools'
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, subDays } from 'date-fns'

/**
 * User context for AI personalization
 */
export interface UserContext {
    userId: string
    userName?: string
    todayHabitsCompleted: number
    totalActiveHabits: number
    currentStreak: number
    pendingTasks: number
    completedTasksToday: number
    recentMood?: string
    recentMoods: { date: string; mood: string }[]
}

/**
 * Database operations interface (injected dependency)
 */
export interface DbOperations {
    createTask: (userId: string, data: {
        title: string
        description?: string
        dueDate?: Date
        priority?: string
        category?: string
    }) => Promise<{ id: string }>

    createHabit: (userId: string, data: {
        name: string
        description?: string
        frequency?: string
        category?: string
        reminderTime?: string
    }) => Promise<{ id: string }>

    getUserStats: (userId: string, period: 'today' | 'week' | 'month') => Promise<{
        habitsCompleted: number
        tasksCompleted: number
        totalHabits: number
        totalTasks: number
        streakDays: number
    }>

    getMoodData: (userId: string, days: number) => Promise<{
        moods: { date: string; mood: string }[]
    }>
}

/**
 * Parse relative date strings
 */
function parseRelativeDate(dateStr: string): Date {
    const today = new Date()
    const lower = dateStr.toLowerCase()

    if (lower === 'today') return today
    if (lower === 'tomorrow') return addDays(today, 1)
    if (lower.includes('next week')) return addDays(today, 7)

    // Try parsing as YYYY-MM-DD
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) return parsed

    return today
}

/**
 * Execute AI tool and return result
 */
export async function executeAiTool(
    toolName: string,
    args: Record<string, unknown>,
    context: UserContext,
    db: DbOperations
): Promise<ToolResult> {
    switch (toolName) {
        case 'createTask': {
            const title = args.title as string
            const description = args.description as string | undefined
            const dueDateStr = args.dueDate as string | undefined
            const priority = (args.priority as string) || 'medium'
            const category = args.category as string | undefined

            const dueDate = dueDateStr ? parseRelativeDate(dueDateStr) : undefined

            try {
                const task = await db.createTask(context.userId, {
                    title,
                    description,
                    dueDate,
                    priority,
                    category
                })

                return {
                    tool: 'createTask',
                    result: {
                        success: true,
                        taskId: task.id,
                        title,
                        dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined,
                        message: `Created task "${title}"${dueDate ? ` due ${format(dueDate, 'MMM d')}` : ''}`
                    }
                }
            } catch (error) {
                return {
                    tool: 'createTask',
                    result: {
                        success: false,
                        title,
                        message: `Failed to create task: ${error}`
                    }
                }
            }
        }

        case 'createHabit': {
            const name = args.name as string
            const description = args.description as string | undefined
            const frequency = (args.frequency as string) || 'daily'
            const category = args.category as string | undefined
            const reminderTime = args.reminderTime as string | undefined

            try {
                const habit = await db.createHabit(context.userId, {
                    name,
                    description,
                    frequency,
                    category,
                    reminderTime
                })

                return {
                    tool: 'createHabit',
                    result: {
                        success: true,
                        habitId: habit.id,
                        name,
                        message: `Created ${frequency} habit "${name}"`
                    }
                }
            } catch (error) {
                return {
                    tool: 'createHabit',
                    result: {
                        success: false,
                        name,
                        message: `Failed to create habit: ${error}`
                    }
                }
            }
        }

        case 'suggestHabits': {
            const focusArea = (args.focusArea as string) || 'general'
            const difficulty = (args.difficulty as string) || 'moderate'

            // Generate suggestions based on focus area
            const suggestions: HabitSuggestion[] = getSuggestionsForArea(focusArea, difficulty, context)

            return {
                tool: 'suggestHabits',
                result: suggestions
            }
        }

        case 'getInsights': {
            const period = (args.period as 'today' | 'week' | 'month') || 'week'
            const type = (args.type as string) || 'all'

            try {
                const stats = await db.getUserStats(context.userId, period)

                const completionRate = stats.totalHabits > 0
                    ? Math.round((stats.habitsCompleted / stats.totalHabits) * 100)
                    : 0

                return {
                    tool: 'getInsights',
                    result: {
                        period,
                        habitsCompleted: stats.habitsCompleted,
                        tasksCompleted: stats.tasksCompleted,
                        streakDays: stats.streakDays,
                        summary: `This ${period}, you completed ${stats.habitsCompleted} habits (${completionRate}% rate) and ${stats.tasksCompleted} tasks. Your current streak is ${stats.streakDays} days.`
                    }
                }
            } catch (error) {
                return {
                    tool: 'getInsights',
                    result: {
                        period,
                        habitsCompleted: 0,
                        tasksCompleted: 0,
                        streakDays: 0,
                        summary: 'Unable to fetch insights at this time.'
                    }
                }
            }
        }

        case 'analyzeMood': {
            const days = (args.days as number) || 7

            try {
                const moodData = await db.getMoodData(context.userId, days)

                if (moodData.moods.length === 0) {
                    return {
                        tool: 'analyzeMood',
                        result: {
                            dominantMood: 'unknown',
                            moodTrend: 'stable',
                            entries: 0,
                            summary: 'No mood data available. Start tracking your mood in journal entries!'
                        }
                    }
                }

                const moodValues: Record<string, number> = {
                    'great': 5, 'good': 4, 'okay': 3, 'bad': 2, 'terrible': 1
                }

                const moodCounts: Record<string, number> = {}
                let totalScore = 0

                moodData.moods.forEach(m => {
                    moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1
                    totalScore += moodValues[m.mood] || 3
                })

                const dominantMood = Object.entries(moodCounts)
                    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'okay'

                const avgScore = totalScore / moodData.moods.length

                // Determine trend by comparing first half to second half
                const midpoint = Math.floor(moodData.moods.length / 2)
                const firstHalfAvg = moodData.moods.slice(0, midpoint).reduce((sum, m) => sum + (moodValues[m.mood] || 3), 0) / midpoint || 3
                const secondHalfAvg = moodData.moods.slice(midpoint).reduce((sum, m) => sum + (moodValues[m.mood] || 3), 0) / (moodData.moods.length - midpoint) || 3

                let moodTrend: 'improving' | 'stable' | 'declining' = 'stable'
                if (secondHalfAvg - firstHalfAvg > 0.5) moodTrend = 'improving'
                else if (firstHalfAvg - secondHalfAvg > 0.5) moodTrend = 'declining'

                return {
                    tool: 'analyzeMood',
                    result: {
                        dominantMood,
                        moodTrend,
                        entries: moodData.moods.length,
                        summary: `Over the last ${days} days, your mood has been mostly "${dominantMood}" and is ${moodTrend}. You recorded ${moodData.moods.length} entries.`
                    }
                }
            } catch (error) {
                return {
                    tool: 'analyzeMood',
                    result: {
                        dominantMood: 'unknown',
                        moodTrend: 'stable',
                        entries: 0,
                        summary: 'Unable to analyze mood data at this time.'
                    }
                }
            }
        }

        default:
            throw new Error(`Unknown tool: ${toolName}`)
    }
}

/**
 * Generate habit suggestions based on focus area
 */
function getSuggestionsForArea(focusArea: string, difficulty: string, context: UserContext): HabitSuggestion[] {
    const suggestionsByArea: Record<string, HabitSuggestion[]> = {
        health: [
            { name: 'Drink 8 glasses of water', description: 'Stay hydrated throughout the day', category: 'health', difficulty: 'easy', reason: 'Essential for energy and focus' },
            { name: 'Take a 10-minute walk', description: 'Light movement after meals', category: 'health', difficulty: 'easy', reason: 'Aids digestion and mental clarity' },
            { name: 'Sleep by 11 PM', description: 'Maintain a consistent bedtime', category: 'health', difficulty: 'moderate', reason: 'Quality sleep improves all aspects of life' }
        ],
        productivity: [
            { name: 'Morning planning session', description: '5 min to plan your day', category: 'productivity', difficulty: 'easy', reason: 'Starts your day with intention' },
            { name: 'Pomodoro work blocks', description: '25 min work, 5 min break', category: 'productivity', difficulty: 'moderate', reason: 'Maintains focus and prevents burnout' },
            { name: 'Weekly review', description: 'Reflect on accomplishments', category: 'productivity', difficulty: 'easy', reason: 'Helps track progress and adjust goals' }
        ],
        mindfulness: [
            { name: '5-minute meditation', description: 'Quiet time for mental clarity', category: 'mindfulness', difficulty: 'easy', reason: 'Reduces stress and improves focus' },
            { name: 'Gratitude journaling', description: 'Write 3 things you\'re grateful for', category: 'mindfulness', difficulty: 'easy', reason: 'Shifts focus to positivity' },
            { name: 'Digital sunset', description: 'No screens 1 hour before bed', category: 'mindfulness', difficulty: 'challenging', reason: 'Improves sleep quality' }
        ],
        fitness: [
            { name: 'Morning stretching', description: '10 min stretch routine', category: 'fitness', difficulty: 'easy', reason: 'Increases flexibility and energy' },
            { name: '30-minute workout', description: 'Exercise of your choice', category: 'fitness', difficulty: 'moderate', reason: 'Builds strength and endurance' },
            { name: '10,000 steps', description: 'Daily step goal', category: 'fitness', difficulty: 'moderate', reason: 'Cardiovascular health benefit' }
        ],
        learning: [
            { name: 'Read for 20 minutes', description: 'Educational or inspiring content', category: 'learning', difficulty: 'easy', reason: 'Expands knowledge continuously' },
            { name: 'Learn one new thing', description: 'Watch a tutorial or read an article', category: 'learning', difficulty: 'easy', reason: 'Keeps the mind sharp' },
            { name: 'Practice a skill', description: '30 min of deliberate practice', category: 'learning', difficulty: 'moderate', reason: 'Builds expertise over time' }
        ]
    }

    // Get suggestions for the focus area, default to general mix
    let suggestions = suggestionsByArea[focusArea.toLowerCase()] || []

    if (suggestions.length === 0) {
        // Return a mix from all areas
        suggestions = Object.values(suggestionsByArea).flat().slice(0, 5)
    }

    // Filter by difficulty if specified
    if (difficulty !== 'moderate') {
        suggestions = suggestions.filter(s => s.difficulty === difficulty || suggestions.length < 3)
    }

    // Personalize based on context
    if (context.currentStreak > 7) {
        suggestions = suggestions.map(s => ({
            ...s,
            reason: s.reason + ` (Great ${context.currentStreak}-day streak! Keep it going!)`
        }))
    }

    return suggestions.slice(0, 3)
}

/**
 * System prompt for the AI with tool awareness
 */
export const AI_SYSTEM_PROMPT = `You are Momentum AI, a helpful personal assistant for the Momentum life management platform.

You have access to powerful tools that can take real actions:
- **createTask**: Create tasks with due dates and priorities
- **createHabit**: Start new habit tracking
- **suggestHabits**: Get personalized habit recommendations
- **getInsights**: View productivity statistics
- **analyzeMood**: Understand mood patterns from journals

When a user asks you to do something actionable (create a task, start a habit, etc.), USE THE APPROPRIATE TOOL instead of just describing it.

Examples:
- "Remind me to call mom tomorrow" → Use createTask with title "Call mom" and dueDate "tomorrow"
- "I want to start meditating" → Use createHabit with name "Daily meditation"
- "What habits should I try?" → Use suggestHabits
- "How am I doing this week?" → Use getInsights with period "week"

Guidelines:
- Be concise and helpful
- Use tools proactively when they match user intent
- After using a tool, summarize what you did
- Be encouraging about progress
- If unsure, ask clarifying questions

Remember: You're a supportive companion helping users build better habits and achieve their goals.`
