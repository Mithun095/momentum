export const HABIT_ICONS = [
    '✅', '🏃', '💪', '📚', '🧘', '🎯', '⚡', '🔥',
    '💼', '🎨', '🎵', '✍️', '💡', '🌟', '🚀', '🎓',
    '💰', '🍎', '🥗', '💧', '😴', '🌅', '🌙', '☕',
    '📱', '💻', '📖', '🎮', '🏋️', '🚴', '🏊', '⚽',
    '🎸', '🎹', '📷', '🎯', '🧩', '🎪', '🎭', '🎬',
    '🌱', '🌿', '🌻', '🌈', '⭐', '💫', '✨', '🔮',
] as const

export type HabitIcon = (typeof HABIT_ICONS)[number]

export function getRandomIcon(): HabitIcon {
    return HABIT_ICONS[Math.floor(Math.random() * HABIT_ICONS.length)]
}
