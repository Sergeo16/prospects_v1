import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomBytes } from 'crypto'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

export async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist
  }
}

export async function saveFile(file: File, needId: string): Promise<{ path: string; url: string }> {
  await ensureUploadDir()

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const extension = file.name.split('.').pop() || 'bin'
  const filename = `${needId}-${randomBytes(16).toString('hex')}.${extension}`
  const filepath = join(UPLOAD_DIR, filename)

  await writeFile(filepath, buffer)

  const url = `/uploads/${filename}`

  return { path: filepath, url }
}

export function getFileType(mimeType: string): 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'OTHER' {
  if (mimeType.startsWith('image/')) return 'IMAGE'
  if (mimeType.startsWith('video/')) return 'VIDEO'
  if (mimeType.startsWith('audio/')) return 'AUDIO'
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
    return 'DOCUMENT'
  }
  return 'OTHER'
}

