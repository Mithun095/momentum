export const TASK_PRIORITIES = {
    low: {
        label: 'Low',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        dotColor: 'bg-gray-400',
        weight: 1,
    },
    medium: {
        label: 'Medium',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        dotColor: 'bg-blue-500',
        weight: 2,
    },
    high: {
        label: 'High',
        color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
        dotColor: 'bg-red-500',
        weight: 3,
    },
} as const

export type TaskPriority = keyof typeof TASK_PRIORITIES

export const TASK_CATEGORIES = [
    {
        id: 'work',
        label: 'Work',
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
        icon: '💼',
    },
    {
        id: 'personal',
        label: 'Personal',
        color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        icon: '🏠',
    },
    {
        id: 'health',
        label: 'Health',
        color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
        icon: '💪',
    },
    {
        id: 'learning',
        label: 'Learning',
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
        icon: '📚',
    },
    {
        id: 'finance',
        label: 'Finance',
        color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
        icon: '💰',
    },
    {
        id: 'errands',
        label: 'Errands',
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
        icon: '🛒',
    },
    {
        id: 'other',
        label: 'Other',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
        icon: '📌',
    },
] as const

export type TaskCategoryId = (typeof TASK_CATEGORIES)[number]['id']

export const TASK_STATUS = {
    pending: {
        label: 'Pending',
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    },
    in_progress: {
        label: 'In Progress',
        color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    },
    completed: {
        label: 'Completed',
        color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    },
    cancelled: {
        label: 'Cancelled',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    },
} as const

export type TaskStatus = keyof typeof TASK_STATUS

export function getCategoryById(id: string) {
    return TASK_CATEGORIES.find((c) => c.id === id) || TASK_CATEGORIES[TASK_CATEGORIES.length - 1]
}
