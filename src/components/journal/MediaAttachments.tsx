'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImagePlus, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { compressImageToFile, shouldCompress, formatBytes } from '@/lib/utils/imageCompression'

interface Attachment {
    id?: string
    fileName: string
    fileType: string
    filePath: string
    fileSize: number
}

interface MediaAttachmentsProps {
    attachments: Attachment[]
    onChange: (attachments: Attachment[]) => void
    entryId?: string
    className?: string
}

export function MediaAttachments({
    attachments,
    onChange,
    entryId,
    className
}: MediaAttachmentsProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [compressionStatus, setCompressionStatus] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        setCompressionStatus(null)

        try {
            const newAttachments: Attachment[] = []

            for (let i = 0; i < files.length; i++) {
                let file = files[i]
                const originalSize = file.size

                // Compress image if it's over 200KB
                if (shouldCompress(file)) {
                    setCompressionStatus(`Compressing image ${i + 1}/${files.length}...`)
                    try {
                        file = await compressImageToFile(file)
                        console.log(`Compressed: ${formatBytes(originalSize)} → ${formatBytes(file.size)}`)
                    } catch (err) {
                        console.warn('Compression failed, uploading original:', err)
                    }
                }

                setCompressionStatus(`Uploading image ${i + 1}/${files.length}...`)

                const formData = new FormData()
                formData.append('file', file)

                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || 'Upload failed')
                }

                const data = await response.json()
                newAttachments.push({
                    fileName: data.fileName,
                    fileType: data.fileType,
                    filePath: data.filePath,
                    fileSize: data.fileSize,
                })
            }

            onChange([...attachments, ...newAttachments])
            toast({
                title: 'Images uploaded',
                description: `${newAttachments.length} image(s) added successfully.`,
            })
        } catch (error) {
            console.error('Upload error:', error)
            toast({
                title: 'Upload failed',
                description: error instanceof Error ? error.message : 'Failed to upload images',
                variant: 'destructive',
            })
        } finally {
            setIsUploading(false)
            setCompressionStatus(null)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        }
    }

    const handleRemove = (index: number) => {
        const newAttachments = attachments.filter((_, i) => i !== index)
        onChange(newAttachments)
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }

    return (
        <Card className={cn("", className)}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-900 dark:text-gray-100 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Attachments
                    </CardTitle>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="attachment-upload"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <ImagePlus className="h-4 w-4 mr-2" />
                            )}
                            Add Images
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {attachments.length === 0 ? (
                    <div
                        className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImagePlus className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Click to add images or drag & drop
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Supports: JPEG, PNG, GIF, WebP (max 5MB)
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {attachments.map((attachment, index) => (
                            <div
                                key={attachment.id || `${attachment.filePath}-${index}`}
                                className="relative group"
                            >
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    <img
                                        src={attachment.filePath}
                                        alt={attachment.fileName}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleRemove(index)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {formatFileSize(attachment.fileSize)}
                                </p>
                            </div>
                        ))}
                        {/* Add more button */}
                        <div
                            className="aspect-square rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImagePlus className="h-8 w-8 text-gray-400" />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
