import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function getStreakFromCompletions(completions: Date[]): number {
  if (completions.length === 0) return 0
  
  const sorted = completions.sort((a, b) => b.getTime() - a.getTime())
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let streak = 0
  let currentDate = new Date(today)
  
  for (const completion of sorted) {
    const compDate = new Date(completion)
    compDate.setHours(0, 0, 0, 0)
    
    if (compDate.getTime() === currentDate.getTime()) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else if (compDate.getTime() < currentDate.getTime()) {
      break
    }
  }
  
  return streak
}
