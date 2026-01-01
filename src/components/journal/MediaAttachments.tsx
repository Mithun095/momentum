'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ImagePlus, X, Loader2, Image as ImageIcon, Upload, Cloud } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useUploadThing } from '@/lib/uploadthing'
import { useDropzone } from '@uploadthing/react'
import { generateClientDropzoneAccept } from 'uploadthing/client'

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
    const [uploadProgress, setUploadProgress] = useState<number>(0)
    const { toast } = useToast()

    // Use UploadThing hook for journal images
    const { startUpload, routeConfig } = useUploadThing('journalImage', {
        onClientUploadComplete: (res) => {
            // Add uploaded files to attachments
            const newAttachments: Attachment[] = res.map((file) => ({
                fileName: file.name,
                fileType: file.type || 'image/jpeg',
                filePath: file.ufsUrl,
                fileSize: file.size,
            }))

            onChange([...attachments, ...newAttachments])
            setIsUploading(false)
            setUploadProgress(0)

            toast({
                title: 'Images uploaded',
                description: `${res.length} image(s) uploaded to cloud storage.`,
            })
        },
        onUploadError: (error) => {
            console.error('Upload error:', error)
            setIsUploading(false)
            setUploadProgress(0)

            toast({
                title: 'Upload failed',
                description: error.message || 'Failed to upload images',
                variant: 'destructive',
            })
        },
        onUploadProgress: (progress) => {
            setUploadProgress(progress)
        },
    })

    // Handle file selection/drop
    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            if (acceptedFiles.length === 0) return

            setIsUploading(true)
            setUploadProgress(0)

            try {
                await startUpload(acceptedFiles)
            } catch (error) {
                console.error('Upload error:', error)
                setIsUploading(false)
                setUploadProgress(0)
                toast({
                    title: 'Upload failed',
                    description: 'An error occurred during upload',
                    variant: 'destructive',
                })
            }
        },
        [startUpload, toast]
    )

    // Setup dropzone
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: routeConfig ? generateClientDropzoneAccept(['image']) : undefined,
        disabled: isUploading,
    })

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
                        <span title="Stored in cloud">
                            <Cloud className="h-4 w-4 text-blue-500" />
                        </span>
                    </CardTitle>
                    <div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                // Trigger the dropzone input
                                const input = document.getElementById('dropzone-input')
                                input?.click()
                            }}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    {uploadProgress > 0 ? `${uploadProgress}%` : 'Uploading...'}
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Add Images
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {attachments.length === 0 ? (
                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                            isDragActive
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                            isUploading && "pointer-events-none opacity-50"
                        )}
                    >
                        <input {...getInputProps()} id="dropzone-input" />
                        {isUploading ? (
                            <>
                                <Loader2 className="h-10 w-10 mx-auto text-blue-500 mb-2 animate-spin" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Uploading to cloud... {uploadProgress > 0 ? `${uploadProgress}%` : ''}
                                </p>
                            </>
                        ) : isDragActive ? (
                            <>
                                <Upload className="h-10 w-10 mx-auto text-blue-500 mb-2" />
                                <p className="text-sm text-blue-500">
                                    Drop the images here...
                                </p>
                            </>
                        ) : (
                            <>
                                <ImagePlus className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Click to add images or drag & drop
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    Supports: JPEG, PNG, GIF, WebP (max 4MB per image)
                                </p>
                                <p className="text-xs text-blue-500 mt-2">
                                    <Cloud className="h-3 w-3 inline mr-1" />
                                    Stored securely in the cloud
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
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
                            {/* Add more button with dropzone */}
                            <div
                                {...getRootProps()}
                                className={cn(
                                    "aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors",
                                    isDragActive
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                                    isUploading && "pointer-events-none opacity-50"
                                )}
                            >
                                <input {...getInputProps()} />
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                                ) : (
                                    <ImagePlus className="h-8 w-8 text-gray-400" />
                                )}
                            </div>
                        </div>
                        {/* Upload progress bar */}
                        {isUploading && uploadProgress > 0 && (
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
