/**
 * Client-side image compression utility
 * Uses Canvas API to resize and compress images before upload
 */

export interface CompressionOptions {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    outputType?: 'image/jpeg' | 'image/webp'
}

const defaultOptions: CompressionOptions = {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    outputType: 'image/webp'
}

/**
 * Compress an image file using Canvas API
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image as a Blob
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<Blob> {
    const opts = { ...defaultOptions, ...options }

    return new Promise((resolve, reject) => {
        const img = new Image()
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
            reject(new Error('Could not get canvas context'))
            return
        }

        img.onload = () => {
            // Calculate new dimensions while maintaining aspect ratio
            let { width, height } = img

            if (width > opts.maxWidth! || height > opts.maxHeight!) {
                const aspectRatio = width / height

                if (width > height) {
                    width = Math.min(width, opts.maxWidth!)
                    height = width / aspectRatio
                } else {
                    height = Math.min(height, opts.maxHeight!)
                    width = height * aspectRatio
                }
            }

            // Set canvas dimensions
            canvas.width = width
            canvas.height = height

            // Draw image to canvas
            ctx.drawImage(img, 0, 0, width, height)

            // Convert to blob with compression
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob)
                    } else {
                        reject(new Error('Failed to compress image'))
                    }
                },
                opts.outputType,
                opts.quality
            )
        }

        img.onerror = () => {
            reject(new Error('Failed to load image'))
        }

        // Load the image from file
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Compress image and return as File object
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image as a File
 */
export async function compressImageToFile(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const opts = { ...defaultOptions, ...options }
    const blob = await compressImage(file, options)

    // Determine new file extension based on output type
    const extension = opts.outputType === 'image/webp' ? 'webp' : 'jpg'
    const originalName = file.name.replace(/\.[^.]+$/, '')
    const newName = `${originalName}_compressed.${extension}`

    return new File([blob], newName, { type: opts.outputType })
}

/**
 * Check if compression would reduce file size
 * Only compress if original is larger than threshold
 */
export function shouldCompress(file: File, thresholdBytes: number = 200 * 1024): boolean {
    return file.size > thresholdBytes
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
