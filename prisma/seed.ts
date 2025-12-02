import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!'

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 10)

    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        mustChangePassword: true,
        isActive: true,
      },
    })

    console.log(`✅ Admin créé: ${adminEmail}`)
  } else {
    console.log(`ℹ️  Admin existe déjà: ${adminEmail}`)
  }

  // Initialize AppSettings if not exists
  const settings = await prisma.appSettings.findFirst()
  if (!settings) {
    await prisma.appSettings.create({
      data: {
        maintenanceMode: false,
      },
    })
    console.log('✅ Paramètres de l\'application initialisés')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

