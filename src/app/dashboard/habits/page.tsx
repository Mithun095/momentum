'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import { HabitList } from '@/components/habits/HabitList'
import { CreateHabitModal } from '@/components/habits/CreateHabitModal'
import { HABIT_CATEGORIES } from '@/lib/constants/habitCategories'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

export default function HabitsPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    const { data: habits, isLoading } = api.habit.getAll.useQuery()

    // Filter habits based on search and category
    const filteredHabits = habits?.filter((habit) => {
        const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || habit.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                        My Habits
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Track and manage your daily habits to build a better you
                    </p>
                </div>

                {/* Filters and Actions */}
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

                    {/* Create Button */}
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Habit
                    </Button>
                </div>

                {/* Habit List */}
                <HabitList habits={filteredHabits} isLoading={isLoading} />

                {/* Create Modal */}
                <CreateHabitModal
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                />
            </div>
        </div>
    )
}
