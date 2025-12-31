'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Lightbulb, AlertTriangle, ListTodo } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Section {
    type: 'mistakes' | 'good_things' | 'planner'
    content: string
}

interface JournalSectionsProps {
    sections?: Section[]
    onChange: (sections: Section[]) => void
    className?: string
}

const SECTION_CONFIG = {
    mistakes: {
        title: 'Mistakes & Lessons',
        icon: AlertTriangle,
        placeholder: 'What mistakes did you make today? What did you learn from them?',
        description: 'Reflect on areas for improvement',
    },
    good_things: {
        title: 'Good Things',
        icon: Lightbulb,
        placeholder: 'What went well today? What are you grateful for?',
        description: 'Celebrate your wins and gratitude',
    },
    planner: {
        title: "Tomorrow's Plan",
        icon: ListTodo,
        placeholder: 'What do you want to accomplish tomorrow?\n- Task 1\n- Task 2\n- Task 3',
        description: 'Items here will become tasks for tomorrow',
    },
}

export function JournalSections({ sections = [], onChange, className }: JournalSectionsProps) {
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

    const toggleSection = (sectionType: string) => {
        const newExpanded = new Set(expandedSections)
        if (newExpanded.has(sectionType)) {
            newExpanded.delete(sectionType)
        } else {
            newExpanded.add(sectionType)
        }
        setExpandedSections(newExpanded)
    }

    const updateSectionContent = (type: Section['type'], content: string) => {
        const existingIndex = sections.findIndex((s) => s.type === type)
        let newSections: Section[]

        if (existingIndex >= 0) {
            newSections = [...sections]
            newSections[existingIndex] = { type, content }
        } else {
            newSections = [...sections, { type, content }]
        }

        onChange(newSections)
    }

    const getSectionContent = (type: Section['type']) => {
        return sections.find((s) => s.type === type)?.content || ''
    }

    return (
        <div className={cn("space-y-3", className)}>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Optional Sections
            </h3>

            {(Object.keys(SECTION_CONFIG) as Array<keyof typeof SECTION_CONFIG>).map((sectionType) => {
                const config = SECTION_CONFIG[sectionType]
                const Icon = config.icon
                const isExpanded = expandedSections.has(sectionType)
                const content = getSectionContent(sectionType)
                const hasContent = content.trim().length > 0

                return (
                    <Card key={sectionType} className="overflow-hidden">
                        <button
                            onClick={() => toggleSection(sectionType)}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            type="button"
                        >
                            <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {config.title}
                                </span>
                                {hasContent && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                        ✓
                                    </span>
                                )}
                            </div>
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                        </button>

                        {isExpanded && (
                            <CardContent className="pt-0 pb-4">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    {config.description}
                                </p>
                                <textarea
                                    value={content}
                                    onChange={(e) => updateSectionContent(sectionType, e.target.value)}
                                    placeholder={config.placeholder}
                                    className="w-full min-h-[120px] p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 resize-y text-sm"
                                />
                            </CardContent>
                        )}
                    </Card>
                )
            })}
        </div>
    )
}
