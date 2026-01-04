'use client'

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts'

interface CategoryRadarChartProps {
    data: {
        category: string
        value: number
        fullMark: number
    }[]
}

export function CategoryRadarChart({ data }: CategoryRadarChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                No categorical data available
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                    <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <PolarAngleAxis
                        dataKey="category"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        className="dark:fill-gray-400"
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 'dataMax']}
                        tick={false}
                        axisLine={false}
                    />
                    <Radar
                        name="Completions"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    )
}
