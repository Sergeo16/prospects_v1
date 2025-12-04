const fs = require('fs')
const path = require('path')

console.log('🔍 Vérification du fichier .env...\n')

const envPath = path.join(process.cwd(), '.env')

if (!fs.existsSync(envPath)) {
  console.log('❌ Fichier .env non trouvé!')
  console.log('📝 Créez un fichier .env à la racine du projet avec:')
  console.log(`
DATABASE_URL="postgresql://prospects_user:prospects_password@localhost:5432/prospects_db?schema=public"
JWT_SECRET="votre-clé-secrète-jwt-très-longue-et-aléatoire"
OPENAI_API_KEY="sk-votre-clé-openai"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeThisPassword123!"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
  `)
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf-8')
const lines = envContent.split('\n')

console.log('📋 Variables d\'environnement trouvées:\n')

const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
]

let allPresent = true

requiredVars.forEach((varName) => {
  const line = lines.find((l) => l.trim().startsWith(`${varName}=`))
  if (line) {
    const value = line.split('=')[1]?.trim().replace(/^["']|["']$/g, '')
    if (value && value !== '') {
      if (varName === 'ADMIN_PASSWORD' || varName === 'JWT_SECRET') {
        console.log(`✅ ${varName}: ${'*'.repeat(Math.min(value.length, 20))}`)
      } else if (varName === 'OPENAI_API_KEY') {
        console.log(`✅ ${varName}: ${value.substring(0, 10)}...`)
      } else {
        console.log(`✅ ${varName}: ${value}`)
      }
    } else {
      console.log(`❌ ${varName}: VIDE`)
      allPresent = false
    }
  } else {
    console.log(`❌ ${varName}: MANQUANT`)
    allPresent = false
  }
})

console.log('')

if (!allPresent) {
  console.log('⚠️  Certaines variables sont manquantes ou vides!')
  console.log('📝 Vérifiez votre fichier .env\n')
  process.exit(1)
} else {
  console.log('✅ Toutes les variables requises sont présentes!\n')
}

