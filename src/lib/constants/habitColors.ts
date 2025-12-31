export const HABIT_COLORS = [
    { value: 'blue', label: 'Blue', bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-500' },
    { value: 'purple', label: 'Purple', bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-500' },
    { value: 'pink', label: 'Pink', bg: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-500' },
    { value: 'green', label: 'Green', bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-500' },
    { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500' },
    { value: 'orange', label: 'Orange', bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500' },
    { value: 'red', label: 'Red', bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500' },
    { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-500' },
    { value: 'teal', label: 'Teal', bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-500' },
    { value: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-500' },
    { value: 'emerald', label: 'Emerald', bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-500' },
    { value: 'lime', label: 'Lime', bg: 'bg-lime-500', text: 'text-lime-600', border: 'border-lime-500' },
] as const

export type HabitColor = (typeof HABIT_COLORS)[number]['value']

export function getColorClasses(color: string) {
    return HABIT_COLORS.find((c) => c.value === color) || HABIT_COLORS[0]
}
