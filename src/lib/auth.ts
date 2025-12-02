import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'

export interface AuthUser {
  id: string
  email: string
  role: string
  mustChangePassword: boolean
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser
    return decoded
  } catch {
    return null
  }
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return null
  }

  const user = verifyToken(token)

  if (!user) {
    return null
  }

  // Verify user still exists and is active
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  })

  if (!dbUser || !dbUser.isActive || dbUser.deletedAt) {
    return null
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    mustChangePassword: dbUser.mustChangePassword,
  }
}

export function setAuthCookie(token: string): string {
  return `auth-token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
}

export function clearAuthCookie(): string {
  return `auth-token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

