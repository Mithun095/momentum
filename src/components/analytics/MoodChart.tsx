'use client'

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface MoodData {
    date: string
    mood: string | null
    value: number
}

interface MoodChartProps {
    data: MoodData[]
}

const moodColors: Record<string, string> = {
    'great': '#22c55e',
    'good': '#84cc16',
    'okay': '#eab308',
    'bad': '#f97316',
    'terrible': '#ef4444'
}

const moodEmojis: Record<string, string> = {
    'great': '😄',
    'good': '🙂',
    'okay': '😐',
    'bad': '😔',
    'terrible': '😢'
}

export function MoodChart({ data }: MoodChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="text-4xl mb-2">📊</p>
                    <p>No mood data yet</p>
                    <p className="text-sm">Start journaling with moods to see trends</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                            const date = new Date(value)
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        }}
                    />
                    <YAxis
                        stroke="#9ca3af"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tickFormatter={(value) => {
                            const moods = ['', '😢', '😔', '😐', '🙂', '😄']
                            return moods[value] || ''
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(17, 24, 39, 0.9)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff'
                        }}
                        formatter={(value, name, props) => {
                            const mood = (props.payload as MoodData)?.mood
                            const emoji = moodEmojis[mood || ''] || '😐'
                            return [`${emoji} ${mood || 'okay'}`, 'Mood']
                        }}
                        labelFormatter={(label) => {
                            const date = new Date(label as string)
                            return date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric'
                            })
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="url(#moodGradient)"
                        dot={(props: any) => {
                            const { cx, cy, payload } = props
                            const color = moodColors[payload.mood] || '#8b5cf6'
                            return (
                                <circle
                                    key={`dot-${payload.date}`}
                                    cx={cx}
                                    cy={cy}
                                    r={4}
                                    fill={color}
                                    stroke="#fff"
                                    strokeWidth={2}
                                />
                            )
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
