import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const TAG_LENGTH = 16

// In production, this should be stored in environment variables
// For now, we'll derive it from NEXTAUTH_SECRET
function getEncryptionKey(): Buffer {
    const secret = process.env.NEXTAUTH_SECRET || 'default-secret-key'
    return crypto.scryptSync(secret, 'salt', KEY_LENGTH)
}

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    // Return iv + tag + encrypted data
    return iv.toString('hex') + tag.toString('hex') + encrypted
}

export function decrypt(encryptedData: string): string {
    const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex')
    const tag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, (IV_LENGTH + TAG_LENGTH) * 2), 'hex')
    const encrypted = encryptedData.slice((IV_LENGTH + TAG_LENGTH) * 2)

    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv)
    decipher.setAuthTag(tag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}

export function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const bcrypt = require('bcryptjs')
        bcrypt.hash(password, 12, (err: Error, hash: string) => {
            if (err) reject(err)
            else resolve(hash)
        })
    })
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        const bcrypt = require('bcryptjs')
        bcrypt.compare(password, hash, (err: Error, result: boolean) => {
            if (err) reject(err)
            else resolve(result)
        })
    })
}
