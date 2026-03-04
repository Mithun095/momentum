'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Sparkles, ArrowLeft, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { HabitList } from '@/components/habits/HabitList'
import { CreateHabitModal } from '@/components/habits/CreateHabitModal'
import { HabitTemplatesModal } from '@/components/habits/HabitTemplatesModal'
import { HABIT_CATEGORIES } from '@/lib/constants/habitCategories'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { startOfDay, endOfDay, format, subDays, addDays, isToday, isYesterday } from 'date-fns'

export default function HabitsPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false)
    const [selectedDate, setSelectedDate] = useState(new Date())

    const { data: habits, isLoading } = api.habit.getAll.useQuery()

    // Fetch completions for the selected date
    const dateRange = useMemo(() => ({
        startDate: startOfDay(selectedDate),
        endDate: endOfDay(selectedDate),
    }), [selectedDate])

    const { data: completions } = api.habit.getAllCompletions.useQuery(dateRange)

    // Calculate progress — filter completions to only count active habit IDs
    const activeHabitIds = new Set(habits?.filter(h => h.isActive).map(h => h.id) ?? [])
    const totalHabits = activeHabitIds.size
    const completedCount = completions?.filter(c => activeHabitIds.has(c.habitId)).length ?? 0
    const progress = totalHabits > 0 ? Math.min((completedCount / totalHabits) * 100, 100) : 0

    // Date navigation
    const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1))
    const goToNextDay = () => {
        if (!isToday(selectedDate)) {
            setSelectedDate(prev => addDays(prev, 1))
        }
    }
    const goToToday = () => setSelectedDate(new Date())

    const dateLabel = isToday(selectedDate)
        ? 'Today'
        : isYesterday(selectedDate)
            ? 'Yesterday'
            : format(selectedDate, 'EEE, MMM d')

    // Filter habits based on search and category
    const filteredHabits = habits?.filter((habit) => {
        const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || habit.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="min-h-screen">
            {/* Page Header */}
            <div className="bg-white/70 dark:bg-[oklch(0.12_0.025_265/70%)] backdrop-blur-xl border-b border-gray-200/60 dark:border-[oklch(0.25_0.04_265/40%)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <a href="/dashboard">
                                <Button variant="ghost" size="icon" className="-ml-2 flex-shrink-0">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </a>
                            <h1
                                className="text-xl font-semibold text-gray-900 dark:text-gray-100"
                                style={{ fontFamily: 'var(--font-heading)' }}
                            >
                                Habits
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button
                                variant="outline"
                                onClick={() => setIsTemplatesModalOpen(true)}
                                className="hidden sm:flex"
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Templates
                            </Button>
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Date Navigation */}
                <div className="flex items-center justify-between mb-6 animate-fade-in-up">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={goToPreviousDay} className="h-9 w-9">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2 min-w-[140px] justify-center px-3 py-1.5 rounded-lg bg-white dark:bg-[oklch(0.15_0.025_265)] border border-gray-200/60 dark:border-[oklch(0.25_0.04_265/40%)]">
                            <CalendarDays className="h-4 w-4 text-indigo-500" />
                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                {dateLabel}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={goToNextDay}
                            disabled={isToday(selectedDate)}
                            className="h-9 w-9"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    {!isToday(selectedDate) && (
                        <Button variant="ghost" size="sm" onClick={goToToday} className="text-indigo-600 dark:text-indigo-400">
                            Jump to Today
                        </Button>
                    )}
                </div>

                {/* Daily Progress */}
                <div className="mb-8 p-4 bg-white dark:bg-[oklch(0.15_0.025_265)] rounded-xl border border-gray-200/60 dark:border-[oklch(0.25_0.04_265/40%)] shadow-sm animate-fade-in-up">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {isToday(selectedDate) ? 'Daily Progress' : `Progress for ${dateLabel}`}
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                            {completedCount}/{totalHabits} · {Math.min(Math.round(progress), 100)}%
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search habits..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-white dark:bg-[oklch(0.15_0.025_265)] border-gray-200/60 dark:border-[oklch(0.25_0.04_265/40%)]"
                        />
                    </div>

                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-[oklch(0.15_0.025_265)] border-gray-200/60 dark:border-[oklch(0.25_0.04_265/40%)]">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {HABIT_CATEGORIES.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                    <span className="flex items-center gap-2">
                                        <span>{category.icon}</span>
                                        <span>{category.label}</span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Habit List */}
                <div className="animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
                    <HabitList habits={filteredHabits} isLoading={isLoading} onCreateClick={() => setIsCreateModalOpen(true)} />
                </div>

                <CreateHabitModal
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                />

                <HabitTemplatesModal
                    open={isTemplatesModalOpen}
                    onOpenChange={setIsTemplatesModalOpen}
                />
            </div>
        </div>
    )
}
