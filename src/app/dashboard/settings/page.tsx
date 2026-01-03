'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Download,
    Upload,
    Database,
    FileJson,
    AlertTriangle,
    Loader2,
} from 'lucide-react'
import { api } from '@/lib/trpc/client'
import { useToast } from '@/hooks/use-toast'

export default function SettingsPage() {
    const { toast } = useToast()
    const utils = api.useUtils()
    const [isImporting, setIsImporting] = useState(false)
    const [isExporting, setIsExporting] = useState<string | null>(null)
    const [overwriteMode, setOverwriteMode] = useState(false)

    const { data: backupInfo } = api.data.getBackupInfo.useQuery()

    const importData = api.data.importData.useMutation({
        onSuccess: (result) => {
            toast({
                title: 'Import successful!',
                description: `Imported: ${result.imported.habits} habits, ${result.imported.tasks} tasks, ${result.imported.goals} goals, ${result.imported.events} events`,
            })
            setIsImporting(false)
            void utils.invalidate()
        },
        onError: (error) => {
            toast({
                title: 'Import failed',
                description: error.message,
                variant: 'destructive',
            })
            setIsImporting(false)
        },
    })

    const downloadJson = (data: unknown, filename: string) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `momentum-${filename}-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleExportAll = async () => {
        setIsExporting('all')
        try {
            const data = await utils.data.exportAll.fetch()
            if (data) {
                downloadJson(data, 'full-backup')
                toast({ title: 'Export complete!', description: 'Your full backup has been downloaded.' })
            }
        } catch (error) {
            toast({ title: 'Export failed', description: 'Failed to export data', variant: 'destructive' })
        } finally {
            setIsExporting(null)
        }
    }

    const handleExportSection = async (
        section: 'habits' | 'tasks' | 'journals' | 'goals' | 'events'
    ) => {
        setIsExporting(section)
        try {
            const fetchMap = {
                habits: () => utils.data.exportHabits.fetch(),
                tasks: () => utils.data.exportTasks.fetch(),
                journals: () => utils.data.exportJournals.fetch(),
                goals: () => utils.data.exportGoals.fetch(),
                events: () => utils.data.exportEvents.fetch(),
            }
            const data = await fetchMap[section]()
            if (data) {
                downloadJson(data, section)
                toast({ title: 'Export complete!', description: `Your ${section} have been downloaded.` })
            }
        } catch (error) {
            toast({ title: 'Export failed', description: `Failed to export ${section}`, variant: 'destructive' })
        } finally {
            setIsExporting(null)
        }
    }

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsImporting(true)

        try {
            const text = await file.text()
            const data = JSON.parse(text)

            if (!data.version || !data.data) {
                throw new Error('Invalid backup file format')
            }

            importData.mutate({
                version: data.version,
                data: data.data,
                overwrite: overwriteMode,
            })
        } catch (err) {
            toast({
                title: 'Import failed',
                description: 'Invalid JSON file or format',
                variant: 'destructive',
            })
            setIsImporting(false)
        }

        // Reset file input
        e.target.value = ''
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-2">
                        <a href="/dashboard" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                            ← Dashboard
                        </a>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Settings
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your account and data
                    </p>
                </div>

                {/* Data Overview */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Your Data
                        </CardTitle>
                        <CardDescription>
                            Overview of your stored data
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                                { label: 'Habits', count: backupInfo?.counts.habits || 0, color: 'bg-blue-500' },
                                { label: 'Tasks', count: backupInfo?.counts.tasks || 0, color: 'bg-green-500' },
                                { label: 'Journals', count: backupInfo?.counts.journals || 0, color: 'bg-purple-500' },
                                { label: 'Goals', count: backupInfo?.counts.goals || 0, color: 'bg-orange-500' },
                                { label: 'Events', count: backupInfo?.counts.events || 0, color: 'bg-pink-500' },
                            ].map((item) => (
                                <div key={item.label} className="text-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <div className={`w-3 h-3 ${item.color} rounded-full mx-auto mb-2`} />
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {item.count}
                                    </p>
                                    <p className="text-sm text-gray-500">{item.label}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-center text-sm text-gray-500">
                            Total records: <span className="font-medium">{backupInfo?.totalRecords || 0}</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Export Section */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Export Data
                        </CardTitle>
                        <CardDescription>
                            Download your data as JSON files
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={handleExportAll}
                            className="w-full"
                            disabled={isExporting !== null}
                        >
                            {isExporting === 'all' ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <FileJson className="h-4 w-4 mr-2" />
                            )}
                            Export Full Backup
                        </Button>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {(['habits', 'tasks', 'journals', 'goals', 'events'] as const).map((section) => (
                                <Button
                                    key={section}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleExportSection(section)}
                                    disabled={isExporting !== null}
                                >
                                    {isExporting === section ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        section
                                    )}
                                </Button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Import Section */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Import Data
                        </CardTitle>
                        <CardDescription>
                            Restore data from a backup file
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-amber-800 dark:text-amber-200">
                                        Important
                                    </p>
                                    <p className="text-amber-700 dark:text-amber-300 mt-1">
                                        Importing data will add records to your existing data. Enable overwrite mode to replace existing data.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="overwrite"
                                checked={overwriteMode}
                                onChange={(e) => setOverwriteMode(e.target.checked)}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="overwrite" className="text-sm">
                                Overwrite existing data (delete before import)
                            </Label>
                        </div>

                        <div className="flex items-center gap-4">
                            <Input
                                type="file"
                                accept=".json"
                                onChange={handleFileImport}
                                disabled={isImporting}
                                className="flex-1"
                            />
                            {isImporting && (
                                <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Account Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Account</CardTitle>
                        <CardDescription>
                            Manage your account settings
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Account management features coming soon...
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
