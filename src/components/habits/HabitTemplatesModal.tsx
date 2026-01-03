'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Search, Plus } from 'lucide-react'
import { habitTemplates, habitCategories, type HabitTemplate } from '@/lib/constants/habitTemplates'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'

interface HabitTemplatesModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function HabitTemplatesModal({ open, onOpenChange }: HabitTemplatesModalProps) {
    const { toast } = useToast()
    const utils = api.useUtils()
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const createHabit = api.habit.create.useMutation({
        onSuccess: (data) => {
            toast({
                title: 'Habit added!',
                description: `"${data.name}" has been added to your habits.`,
            })
            void utils.habit.getAll.invalidate()
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: error.message || 'Failed to add habit',
                variant: 'destructive',
            })
        },
    })

    const filteredTemplates = habitTemplates.filter((template) => {
        const matchesSearch = template.name.toLowerCase().includes(search.toLowerCase()) ||
            template.description.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = !selectedCategory || template.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const handleAddTemplate = (template: HabitTemplate) => {
        createHabit.mutate({
            name: template.name,
            description: template.description,
            category: template.category,
            frequency: template.frequency,
            color: template.color,
            icon: template.icon,
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Habit Templates</DialogTitle>
                    <DialogDescription>
                        Choose from our curated collection of habits to get started quickly.
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search templates..."
                        className="pl-10"
                    />
                </div>

                {/* Category Filters */}
                <div className="flex gap-2 flex-wrap">
                    <Badge
                        variant={selectedCategory === null ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory(null)}
                    >
                        All
                    </Badge>
                    {habitCategories.map((cat) => (
                        <Badge
                            key={cat.id}
                            variant={selectedCategory === cat.id ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.icon} {cat.name}
                        </Badge>
                    ))}
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {filteredTemplates.map((template) => (
                            <div
                                key={template.id}
                                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <span className="text-2xl">{template.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 dark:text-white truncate">
                                        {template.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {template.description}
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                            style={{ backgroundColor: `${template.color}20`, color: template.color }}
                                        >
                                            {template.category}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                            {template.frequency}
                                        </Badge>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleAddTemplate(template)}
                                    disabled={createHabit.isPending}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No templates found matching your search.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
