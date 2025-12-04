import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Get email and password from command line arguments or use defaults
  const email = process.argv[2] || process.env.ADMIN_EMAIL || 'admin@test.com'
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || 'admin123'

  console.log('🔍 Création/Réinitialisation de l\'admin...\n')
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Mot de passe: ${password}\n`)

  // Check if admin exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  const passwordHash = await bcrypt.hash(password, 10)

  if (existingAdmin) {
    console.log('✅ Admin trouvé, mise à jour du mot de passe...\n')
    
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        passwordHash,
        mustChangePassword: false, // Set to false so they can login immediately
        isActive: true,
        deletedAt: null,
      },
    })

    console.log('✅ Mot de passe mis à jour avec succès!')
  } else {
    console.log('🆕 Création d\'un nouvel admin...\n')

    const newAdmin = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        role: 'ADMIN',
        mustChangePassword: false, // Set to false so they can login immediately
        isActive: true,
      },
    })

    console.log('✅ Admin créé avec succès!')
    console.log(`   - ID: ${newAdmin.id}`)
    console.log(`   - Email: ${newAdmin.email}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('📋 INFORMATIONS DE CONNEXION')
  console.log('='.repeat(60))
  console.log(`Email    : ${email}`)
  console.log(`Mot de passe: ${password}`)
  console.log(`URL      : http://localhost:3000/ss91/login`)
  console.log('='.repeat(60) + '\n')

  // Verify the password works
  const verifyAdmin = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (verifyAdmin) {
    const isValid = await bcrypt.compare(password, verifyAdmin.passwordHash)
    if (isValid) {
      console.log('✅ Vérification : Le mot de passe fonctionne correctement!\n')
    } else {
      console.log('❌ Erreur : Le mot de passe ne correspond pas!\n')
    }
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

