import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load .env file manually
try {
  const envPath = join(process.cwd(), '.env')
  const envFile = readFileSync(envPath, 'utf-8')
  envFile.split('\n').forEach((line) => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
        process.env[key.trim()] = value
      }
    }
  })
} catch (error) {
  console.error('⚠️  Impossible de charger le fichier .env, utilisation des variables système')
}

// Check if required env vars are set
if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.error('❌ ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans .env')
  console.error('\nVérifiez que votre fichier .env contient:')
  console.error('ADMIN_EMAIL="admin@test.com"')
  console.error('ADMIN_PASSWORD="votre-mot-de-passe"')
  process.exit(1)
}

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!'

  console.log('🔍 Diagnostic et réinitialisation de l\'admin...\n')
  console.log(`📧 Email configuré: ${adminEmail}`)
  console.log(`🔑 Mot de passe configuré: ${adminPassword ? '***' : 'NON DÉFINI'}\n`)

  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail.toLowerCase() },
  })

  if (existingAdmin) {
    console.log('✅ Admin trouvé dans la base de données')
    console.log(`   - ID: ${existingAdmin.id}`)
    console.log(`   - Email: ${existingAdmin.email}`)
    console.log(`   - Rôle: ${existingAdmin.role}`)
    console.log(`   - Actif: ${existingAdmin.isActive}`)
    console.log(`   - Doit changer le mot de passe: ${existingAdmin.mustChangePassword}`)
    console.log(`   - Créé le: ${existingAdmin.createdAt}\n`)

    // Test password verification
    const testPassword = adminPassword
    const isValid = await bcrypt.compare(testPassword, existingAdmin.passwordHash)
    
    if (isValid) {
      console.log('✅ Le mot de passe actuel est VALIDE')
    } else {
      console.log('❌ Le mot de passe actuel est INVALIDE')
      console.log('🔄 Réinitialisation du mot de passe...\n')
    }

    // Reset password
    const passwordHash = await bcrypt.hash(adminPassword, 10)
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        passwordHash,
        mustChangePassword: true,
        isActive: true,
        deletedAt: null, // Ensure not deleted
      },
    })

    console.log('✅ Mot de passe réinitialisé avec succès!')
  } else {
    console.log('❌ Admin non trouvé dans la base de données')
    console.log('🆕 Création d\'un nouvel admin...\n')

    const passwordHash = await bcrypt.hash(adminPassword, 10)

    const newAdmin = await prisma.user.create({
      data: {
        email: adminEmail.toLowerCase(),
        passwordHash,
        role: 'ADMIN',
        mustChangePassword: true,
        isActive: true,
      },
    })

    console.log('✅ Admin créé avec succès!')
    console.log(`   - ID: ${newAdmin.id}`)
    console.log(`   - Email: ${newAdmin.email}`)
  }

  console.log('\n' + '='.repeat(50))
  console.log('📋 INFORMATIONS DE CONNEXION')
  console.log('='.repeat(50))
  console.log(`Email: ${adminEmail}`)
  console.log(`Mot de passe: ${adminPassword}`)
  console.log(`URL: http://localhost:3000/ss91/login`)
  console.log('='.repeat(50) + '\n')

  // List all users
  const allUsers = await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
    },
  })

  if (allUsers.length > 0) {
    console.log('👥 Tous les utilisateurs dans la base de données:')
    allUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.email}`)
      console.log(`   - Rôle: ${user.role}`)
      console.log(`   - Actif: ${user.isActive}`)
      console.log(`   - Doit changer le mot de passe: ${user.mustChangePassword}`)
    })
    console.log('')
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

