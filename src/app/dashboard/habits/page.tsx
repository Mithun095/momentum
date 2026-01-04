'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Sparkles, ArrowLeft } from 'lucide-react'
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
import { startOfDay, endOfDay } from 'date-fns'

export default function HabitsPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false)

    const { data: habits, isLoading } = api.habit.getAll.useQuery()
    // Fetch today's completions for progress bar
    const today = new Date()
    const { data: completions } = api.habit.getAllCompletions.useQuery({
        startDate: startOfDay(today),
        endDate: endOfDay(today)
    })

    // Calculate progress
    const totalHabits = habits?.filter(h => h.isActive).length ?? 0
    const completedCount = completions?.length ?? 0
    const progress = totalHabits > 0 ? (completedCount / totalHabits) * 100 : 0

    // Filter habits based on search and category
    const filteredHabits = habits?.filter((habit) => {
        const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || habit.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Top Navigation */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <a href="/dashboard">
                                <Button variant="ghost" size="icon" className="-ml-2">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </a>
                            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                Habits
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsTemplatesModalOpen(true)}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                From Templates
                            </Button>
                            <Button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="bg-gray-800 hover:bg-gray-700 dark:bg-gray-200 dark:hover:bg-gray-300 dark:text-gray-900"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Habit
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Subtitle */}
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Track and manage your daily habits to build a better you
                </p>

                {/* Daily Progress */}
                <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Progress</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search habits..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Category Filter */}
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-48">
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
                <HabitList habits={filteredHabits} isLoading={isLoading} />

                {/* Create Modal */}
                <CreateHabitModal
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                />

                {/* Templates Modal */}
                <HabitTemplatesModal
                    open={isTemplatesModalOpen}
                    onOpenChange={setIsTemplatesModalOpen}
                />
            </div>
        </div>
    )
}
