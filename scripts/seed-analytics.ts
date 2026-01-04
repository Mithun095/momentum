
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Starting analytics data seed...')

    // 1. Get the primary user
    const user = await prisma.user.findFirst()

    if (!user) {
        console.error('❌ No user found! Please sign up in the app first.')
        return
    }

    console.log(`👤 Seeding data for user: ${user.name || user.email} (${user.id})`)

    // 2. Clean up existing relevant data (optional, but good for clean slate testing)
    // Be careful with this on a real app, but for local dev "test" it's often desired.
    // We'll skip deleteMany for safety unless requested, but here we just ADD data.
    // Actually, to avoid duplicates if run multiple times, maybe we should check or just append.
    // Let's just append but try to avoid overlapping dates if possible.

    // 3. Create Habits representing different categories for Radar Chart
    const habitTemplates = [
        { name: 'Morning Jog', category: 'Health', frequency: 'daily' },
        { name: 'Read Documentation', category: 'Learning', frequency: 'daily' },
        { name: 'Deep Work Session', category: 'Productivity', frequency: 'daily' },
        { name: 'Code Review', category: 'Developer', frequency: 'custom' },
        { name: 'Meditation', category: 'Self-care', frequency: 'daily' },
        { name: 'Networking', category: 'Social', frequency: 'weekly' },
    ]

    const createdHabits = []

    for (const template of habitTemplates) {
        const existing = await prisma.habit.findFirst({
            where: { userId: user.id, name: template.name }
        })

        if (existing) {
            createdHabits.push(existing)
        } else {
            const habit = await prisma.habit.create({
                data: {
                    userId: user.id,
                    name: template.name,
                    category: template.category,
                    frequency: template.frequency,
                    description: `seeded for analytics testing`,
                    color: '#10b981'
                }
            })
            createdHabits.push(habit)
        }
    }

    console.log(`✅ Ensure ${createdHabits.length} habits exist.`)

    // 4. Generate Completions (History for Heatmap)
    // Last 3 months (90 days)
    const today = new Date()
    let completionCount = 0

    for (let i = 0; i < 90; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0] // simplified date key

        // Randomize activity level
        // Some days are busy, some lazy
        const dailyActivityLevel = Math.random() // 0-1

        for (const habit of createdHabits) {
            // Higher probability for "Health" or "Productivity"
            const probability = dailyActivityLevel > 0.3 ? 0.7 : 0.2

            if (Math.random() < probability) {
                // Check existence
                const exists = await prisma.habitCompletion.findFirst({
                    where: {
                        habitId: habit.id,
                        completionDate: date
                    }
                })

                if (!exists) {
                    await prisma.habitCompletion.create({
                        data: {
                            habitId: habit.id,
                            completionDate: date,
                            status: 'completed'
                        }
                    })
                    completionCount++
                }
            }
        }
    }

    console.log(`✅ Generated ${completionCount} habit completions.`)

    // 5. Create Tasks (Completed history + Pending)
    const taskCategories = ['Work', 'Personal', 'Shopping', 'Improvement']
    let taskCount = 0

    for (let i = 0; i < 20; i++) {
        const isCompleted = Math.random() > 0.4
        const date = new Date(today)
        if (isCompleted) {
            date.setDate(date.getDate() - Math.floor(Math.random() * 30))
        } else {
            date.setDate(date.getDate() + Math.floor(Math.random() * 7)) // future due date
        }

        await prisma.task.create({
            data: {
                userId: user.id,
                title: `Seeded Task ${i + 1}`,
                status: isCompleted ? 'completed' : 'pending',
                priority: Math.random() > 0.7 ? 'high' : 'medium',
                category: taskCategories[Math.floor(Math.random() * taskCategories.length)],
                completedAt: isCompleted ? date : null,
                dueDate: date
            }
        })
        taskCount++
    }

    console.log(`✅ Generated ${taskCount} tasks.`)

    // 6. Create Journal Entries (for stats + mood)
    const moods = ['great', 'good', 'okay', 'bad', 'terrible']
    let journalCount = 0

    for (let i = 0; i < 30; i++) {
        if (Math.random() > 0.5) continue // Skip some days

        const date = new Date(today)
        date.setDate(date.getDate() - i)

        const exists = await prisma.journalEntry.findUnique({
            where: {
                userId_entryDate: {
                    userId: user.id,
                    entryDate: date
                }
            }
        })

        if (!exists) {
            await prisma.journalEntry.create({
                data: {
                    userId: user.id,
                    entryDate: date,
                    title: `Journal for ${date.toLocaleDateString()}`,
                    mainContent: 'Seeded content for testing analytics visuals.',
                    mood: moods[Math.floor(Math.random() * moods.length)]
                }
            })
            journalCount++
        }
    }

    console.log(`✅ Generated ${journalCount} journal entries.`)
    console.log('🎉 Seeding complete! Go check your Analytics dashboard.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
