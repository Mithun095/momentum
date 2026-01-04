'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import Skeleton from '@/components/ui/Skeleton'
import { format, sub, eachDayOfInterval } from 'date-fns'

interface HabitCompletion {
    completionDate: Date
    status: string
}

interface HabitProgressChartProps {
    completions: HabitCompletion[]
    habitName: string
}

export const HabitProgressChart = React.memo(function HabitProgressChart({ completions, habitName }: HabitProgressChartProps) {
    // Prepare data for exactly 14 days (matching the title)
    const today = useMemo(() => new Date(), [])

    const dailyData = useMemo(() => {
        const daysInRange = eachDayOfInterval({
            start: sub(today, { days: 13 }), // 13 days ago + today = 14 days
            end: today
        })

        return daysInRange.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd')
            const completion = completions.find(
                (c) => format(new Date(c.completionDate), 'yyyy-MM-dd') === dayStr
            )

            return {
                date: format(day, 'EEE'),
                fullDate: format(day, 'MMM dd'),
                completed: completion?.status === 'completed' ? 1 : 0,
                skipped: completion?.status === 'skipped' ? 1 : 0,
                failed: completion?.status === 'failed' ? 1 : 0,
            }
        })
    }, [completions, today])

    // Calculate monthly completion rate with useMemo
    const completionRates = useMemo(() => {
        const last30Days = eachDayOfInterval({
            start: sub(today, { days: 30 }),
            end: today,
        })

        const rates = []
        for (let i = 0; i < last30Days.length; i += 7) {
            const weekDays = last30Days.slice(i, Math.min(i + 7, last30Days.length))
            const weekCompletions = weekDays.filter((day) =>
                completions.some(
                    (c) =>
                        format(new Date(c.completionDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') &&
                        c.status === 'completed'
                )
            )
            const rate = (weekCompletions.length / weekDays.length) * 100

            rates.push({
                week: `Week ${Math.floor(i / 7) + 1}`,
                rate: Math.round(rate),
            })
        }
        return rates
    }, [completions, today])

    return (
        <div className="space-y-6">
            {/* Weekly Bar Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Last 14 Days</CardTitle>
                    <CardDescription>Daily completion status for {habitName}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis domain={[0, 1]} ticks={[0, 1]} className="text-xs" />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload
                                        return (
                                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                                <p className="font-semibold text-sm">{data.fullDate}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {data.completed ? '✅ Completed' : data.skipped ? '⏭️ Skipped' : data.failed ? '❌ Failed' : '⚪ Not done'}
                                                </p>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Bar dataKey="completed" stackId="a" fill="#10b981" />
                            <Bar dataKey="skipped" stackId="a" fill="#eab308" />
                            <Bar dataKey="failed" stackId="a" fill="#ef4444" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Monthly Trend Line */}
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Trend</CardTitle>
                    <CardDescription>Completion rate over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={completionRates}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis dataKey="week" className="text-xs" />
                            <YAxis domain={[0, 100]} className="text-xs" />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                                                <p className="font-semibold text-sm">{payload[0].payload.week}</p>
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {payload[0].value}% completion rate
                                                </p>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="rate"
                                stroke="url(#colorGradient)"
                                strokeWidth={3}
                                dot={{ fill: '#8b5cf6', r: 5 }}
                            />
                            <defs>
                                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#3b82f6" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
})
