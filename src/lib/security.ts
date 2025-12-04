import { NextRequest } from 'next/server'
import { prisma } from './prisma'

// Rate limiting storage (in-memory for now, can be moved to Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  identifier?: string // Custom identifier (default: IP address)
}

export async function rateLimit(
  request: NextRequest,
  options: RateLimitOptions
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const identifier = options.identifier || ip
  const now = Date.now()
  const key = `${identifier}:${Math.floor(now / options.windowMs)}`

  const current = rateLimitStore.get(key) || { count: 0, resetTime: now + options.windowMs }

  if (current.resetTime < now) {
    // Reset window
    current.count = 0
    current.resetTime = now + options.windowMs
  }

  current.count++

  if (current.count > options.maxRequests) {
    rateLimitStore.set(key, current)
    return {
      success: false,
      remaining: 0,
      resetTime: current.resetTime,
    }
  }

  rateLimitStore.set(key, current)
  return {
    success: true,
    remaining: options.maxRequests - current.count,
    resetTime: current.resetTime,
  }
}

// Anti-spam: Check for suspicious patterns
export function detectSpam(text: string): boolean {
  // Check for excessive repetition
  const words = text.toLowerCase().split(/\s+/)
  const wordCounts = new Map<string, number>()
  
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
  }

  // If any word appears more than 30% of the time, it's likely spam
  const maxCount = Math.max(...Array.from(wordCounts.values()))
  if (maxCount > words.length * 0.3) {
    return true
  }

  // Check for excessive special characters
  const specialCharRatio = (text.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length / text.length
  if (specialCharRatio > 0.3) {
    return true
  }

  // Check for common spam patterns
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters (e.g., aaaaaaaaaaa)
    /(http|https|www\.)/gi, // URLs (might be legitimate, but flag for review)
    /(free|click|buy|now|limited|offer)/gi, // Common spam words
  ]

  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      // URLs are less suspicious, so only flag if combined with other patterns
      if (pattern.source.includes('http') && specialCharRatio < 0.2) {
        continue
      }
      return true
    }
  }

  return false
}

// Anti-bot: Honeypot field check
export function validateHoneypot(formData: FormData): boolean {
  // Check for honeypot fields that should be empty
  const honeypot = formData.get('website') || formData.get('url') || formData.get('homepage')
  return !honeypot || honeypot === ''
}

// Validate email format and domain
export function validateEmail(email: string): { valid: boolean; reason?: string } {
  if (!email) {
    return { valid: true } // Email is optional
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { valid: false, reason: 'Format email invalide' }
  }

  // Check for disposable email domains
  const disposableDomains = [
    'tempmail.com',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'throwaway.email',
  ]

  const domain = email.split('@')[1]?.toLowerCase()
  if (disposableDomains.includes(domain || '')) {
    return { valid: false, reason: 'Domaines email jetables non autorisés' }
  }

  return { valid: true }
}

// Validate phone number format
export function validatePhone(phone: string | null): { valid: boolean; reason?: string } {
  if (!phone) {
    return { valid: true } // Phone is optional
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')

  // Check if it has a reasonable length (between 8 and 15 digits)
  if (digitsOnly.length < 8 || digitsOnly.length > 15) {
    return { valid: false, reason: 'Numéro de téléphone invalide' }
  }

  return { valid: true }
}

// Check for suspicious file uploads
export function validateFileUpload(file: File): { valid: boolean; reason?: string } {
  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    return { valid: false, reason: 'Fichier trop volumineux (max 50MB)' }
  }

  // Check file type
  const allowedTypes = [
    'image/',
    'application/pdf',
    'audio/',
    'video/',
    'text/',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]

  const isAllowed = allowedTypes.some((type) => file.type.startsWith(type))
  if (!isAllowed) {
    return { valid: false, reason: 'Type de fichier non autorisé' }
  }

  // Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase()
  const suspiciousExtensions = ['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js']

  if (extension && suspiciousExtensions.includes(extension)) {
    return { valid: false, reason: 'Extension de fichier non autorisée' }
  }

  return { valid: true }
}

// Get client IP address
export function getClientIP(request: NextRequest): string {
  return (
    request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

// Check if request is from a known bot/crawler
export function isBot(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http/i,
  ]

  return botPatterns.some((pattern) => pattern.test(userAgent))
}

