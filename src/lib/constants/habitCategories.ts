export const HABIT_CATEGORIES = [
    { value: 'health', label: 'Health', icon: '🏃', color: 'text-green-600' },
    { value: 'fitness', label: 'Fitness', icon: '💪', color: 'text-blue-600' },
    { value: 'productivity', label: 'Productivity', icon: '⚡', color: 'text-yellow-600' },
    { value: 'learning', label: 'Learning', icon: '📚', color: 'text-purple-600' },
    { value: 'mindfulness', label: 'Mindfulness', icon: '🧘', color: 'text-pink-600' },
    { value: 'social', label: 'Social', icon: '👥', color: 'text-orange-600' },
    { value: 'creativity', label: 'Creativity', icon: '🎨', color: 'text-red-600' },
    { value: 'finance', label: 'Finance', icon: '💰', color: 'text-emerald-600' },
    { value: 'sleep', label: 'Sleep', icon: '😴', color: 'text-indigo-600' },
    { value: 'nutrition', label: 'Nutrition', icon: '🥗', color: 'text-lime-600' },
    { value: 'other', label: 'Other', icon: '📌', color: 'text-gray-600' },
] as const

export type HabitCategory = (typeof HABIT_CATEGORIES)[number]['value']

export function getCategoryInfo(category: string) {
    return HABIT_CATEGORIES.find((c) => c.value === category) || HABIT_CATEGORIES[HABIT_CATEGORIES.length - 1]
}
