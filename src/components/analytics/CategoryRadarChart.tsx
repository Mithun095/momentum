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

    // Ensure we have a valid domain max
    const maxValue = Math.max(...data.map(d => d.value), 5)

    return (
        <div className="h-[300px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                    <defs>
                        <linearGradient id="radarFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>

                    {/* 
                       For Dark Mode:
                       - We use 'stroke-gray-200' for light and 'stroke-gray-700' (or 600) for dark.
                       - Tailwind classes on SVG elements in Recharts work reliably if we don't pass an explicit color hex that overrides it,
                         OR we can use CSS variables.
                       - However, passing 'stroke=""' allows class to take effect? Recharts validation might complain.
                       - Safer bet: use explicit stroke with `className` and `!important` logic via tailwind or just standard CSS class.
                       - Actually, Recharts renders these as paths. 
                       - Let's use `stroke` as "currentColor" and wrap in a div with color? No, different elements need different colors.
                       - Simple fix: Use a standard hex but allow the class to override via specificity if possible, 
                         or just rely on the fact that we can't easily switch HEX in JS without a hook.
                       - Wait, I can't use hooks here easily without refactoring. 
                       - BUT, I can use the CSS variable approach if I define it.
                       - EASIEST: Just use `stroke="var(--radar-grid)"` and define it or use Tailwind's `className` with `!important` (e.g. `!stroke-gray-700`).
                    */}
                    <PolarGrid
                        gridType="polygon"
                        className="stroke-gray-200 dark:stroke-gray-600"
                        strokeWidth={1}
                    />

                    <PolarAngleAxis
                        dataKey="category"
                        tick={({ payload, x, y, textAnchor, stroke, radius }) => {
                            return (
                                <text
                                    x={x}
                                    y={y}
                                    textAnchor={textAnchor}
                                    fill="currentColor"
                                    className="text-gray-500 dark:text-gray-300 text-[10px] font-medium"
                                >
                                    {payload.value}
                                </text>
                            );
                        }}
                    />

                    <PolarRadiusAxis
                        angle={90}
                        domain={[0, maxValue]}
                        tick={false}
                        axisLine={false}
                    />

                    <Radar
                        name="Completions"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        fill="url(#radarFill)"
                        fillOpacity={0.6}
                        isAnimationActive={true}
                    />

                    <Tooltip
                        cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeOpacity: 0.2 }}
                        contentStyle={{
                            backgroundColor: 'rgba(23, 23, 23, 0.95)',
                            borderRadius: '12px',
                            border: '1px solid rgba(75, 85, 99, 0.4)',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                            color: '#f3f4f6'
                        }}
                        itemStyle={{ color: '#c4b5fd' }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    )
}
