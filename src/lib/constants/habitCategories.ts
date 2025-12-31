export const HABIT_CATEGORIES = [
    { value: 'health', label: 'Health', icon: '🏃', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'fitness', label: 'Fitness', icon: '💪', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'productivity', label: 'Productivity', icon: '⚡', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'learning', label: 'Learning', icon: '📚', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'mindfulness', label: 'Mindfulness', icon: '🧘', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'social', label: 'Social', icon: '👥', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'creativity', label: 'Creativity', icon: '🎨', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'finance', label: 'Finance', icon: '💰', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'sleep', label: 'Sleep', icon: '😴', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'nutrition', label: 'Nutrition', icon: '🥗', color: 'text-gray-600 dark:text-gray-400' },
    { value: 'other', label: 'Other', icon: '📌', color: 'text-gray-500 dark:text-gray-500' },
] as const

export type HabitCategory = (typeof HABIT_CATEGORIES)[number]['value']

export function getCategoryInfo(category: string) {
    return HABIT_CATEGORIES.find((c) => c.value === category) || HABIT_CATEGORIES[HABIT_CATEGORIES.length - 1]
}
