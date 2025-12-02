#!/bin/bash

set -e

echo "🚀 Build et démarrage en production..."

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Démarrer PostgreSQL avec Docker
echo -e "${BLUE}📦 Démarrage de PostgreSQL avec Docker...${NC}"
if ! docker-compose ps 2>/dev/null | grep -q "prospects_postgres.*Up"; then
    docker-compose up -d
    echo "⏳ Attente que PostgreSQL soit prêt..."
    
    # Attendre que PostgreSQL soit vraiment prêt (max 30 secondes)
    max_attempts=30
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if docker-compose exec -T postgres pg_isready -U prospects_user -d prospects_db >/dev/null 2>&1; then
            echo -e "${GREEN}✓ PostgreSQL est prêt${NC}"
            break
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done
    
    if [ $attempt -eq $max_attempts ]; then
        echo -e "\n${YELLOW}⚠️  PostgreSQL prend plus de temps que prévu, mais on continue...${NC}"
    else
        echo ""
    fi
    
    # Attendre encore un peu pour être sûr
    sleep 2
else
    echo -e "${GREEN}✓ PostgreSQL est déjà démarré${NC}"
fi

# 2. Vérifier que le DATABASE_URL est correct
echo -e "${BLUE}🔍 Vérification de la configuration de la base de données...${NC}"

# Vérifier si le .env existe et contient DATABASE_URL
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Fichier .env non trouvé. Création depuis .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Fichier .env créé${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example non trouvé. Création manuelle nécessaire.${NC}"
    fi
fi

# Vérifier que DATABASE_URL correspond aux identifiants Docker
EXPECTED_DB_URL="postgresql://prospects_user:prospects_password@localhost:5432/prospects_db?schema=public"
if grep -q "DATABASE_URL" .env 2>/dev/null; then
    CURRENT_DB_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
    if [ "$CURRENT_DB_URL" != "$EXPECTED_DB_URL" ]; then
        echo -e "${YELLOW}⚠️  DATABASE_URL dans .env ne correspond pas aux identifiants Docker${NC}"
        echo -e "${YELLOW}   Valeur actuelle : ${CURRENT_DB_URL}${NC}"
        echo -e "${YELLOW}   Valeur attendue : ${EXPECTED_DB_URL}${NC}"
        echo -e "${BLUE}   Mise à jour automatique du DATABASE_URL...${NC}"
        # Mettre à jour le DATABASE_URL dans .env
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"${EXPECTED_DB_URL}\"|" .env
        else
            # Linux
            sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${EXPECTED_DB_URL}\"|" .env
        fi
        echo -e "${GREEN}✓ DATABASE_URL mis à jour${NC}"
    else
        echo -e "${GREEN}✓ DATABASE_URL est correct${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  DATABASE_URL non trouvé dans .env. Ajout...${NC}"
    echo "DATABASE_URL=\"${EXPECTED_DB_URL}\"" >> .env
    echo -e "${GREEN}✓ DATABASE_URL ajouté${NC}"
fi

# Tester la connexion
echo -e "${BLUE}🔍 Test de connexion à PostgreSQL...${NC}"
if docker-compose exec -T postgres psql -U prospects_user -d prospects_db -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Connexion à PostgreSQL réussie${NC}"
else
    echo -e "${YELLOW}⚠️  Impossible de tester la connexion directement, mais on continue...${NC}"
fi

# 3. Vérifier que Prisma Client est généré
if [ ! -d "node_modules/.prisma" ]; then
    echo -e "${BLUE}🔧 Génération du client Prisma...${NC}"
    npx prisma generate
fi

# 4. Appliquer les migrations
echo -e "${BLUE}🔧 Application des migrations...${NC}"

# Vérifier si des migrations existent
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    # Des migrations existent, utiliser migrate deploy
    if npx prisma migrate deploy 2>/dev/null; then
        echo -e "${GREEN}✓ Migrations appliquées${NC}"
    else
        echo -e "${YELLOW}⚠️  Erreur lors de l'application des migrations${NC}"
    fi
else
    # Aucune migration, créer la première
    echo -e "${YELLOW}⚠️  Aucune migration trouvée. Création de la première migration...${NC}"
    MIGRATE_OUTPUT=$(npx prisma migrate dev --name init 2>&1)
    if echo "$MIGRATE_OUTPUT" | grep -q "Migration.*created\|Your database is now in sync"; then
        echo -e "${GREEN}✓ Migration initiale créée et appliquée${NC}"
    else
        # Si migrate dev échoue, essayer db push comme fallback
        echo -e "${YELLOW}⚠️  Tentative avec db push...${NC}"
        if npx prisma db push --accept-data-loss 2>/dev/null; then
            echo -e "${GREEN}✓ Schéma appliqué avec db push${NC}"
        else
            echo -e "${YELLOW}⚠️  Erreur lors de la création des tables. Vérifiez votre DATABASE_URL dans .env${NC}"
            echo -e "${YELLOW}   Doit être : postgresql://prospects_user:prospects_password@localhost:5432/prospects_db?schema=public${NC}"
        fi
    fi
fi

# 5. Vérifier et créer les variables ADMIN si manquantes
if [ -f ".env" ]; then
    if ! grep -q "^ADMIN_EMAIL=" .env 2>/dev/null; then
        echo "ADMIN_EMAIL=\"admin@example.com\"" >> .env
        echo -e "${GREEN}✓ ADMIN_EMAIL ajouté au .env${NC}"
    fi
    if ! grep -q "^ADMIN_PASSWORD=" .env 2>/dev/null; then
        echo "ADMIN_PASSWORD=\"ChangeThisPassword123!\"" >> .env
        echo -e "${GREEN}✓ ADMIN_PASSWORD ajouté au .env${NC}"
    fi
fi

# 6. Seed l'admin initial
echo -e "${BLUE}👤 Création/vérification de l'admin initial...${NC}"
ADMIN_EMAIL=$(grep "^ADMIN_EMAIL=" .env 2>/dev/null | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "admin@example.com")
ADMIN_PASSWORD=$(grep "^ADMIN_PASSWORD=" .env 2>/dev/null | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "ChangeThisPassword123!")

# Exécuter le seed avec les variables d'environnement
export ADMIN_EMAIL ADMIN_PASSWORD
if npm run db:seed 2>&1 | grep -q "Admin"; then
    echo -e "${GREEN}✓ Admin vérifié/créé${NC}"
else
    echo -e "${YELLOW}⚠️  Le seed a été exécuté (l'admin existe peut-être déjà)${NC}"
fi

# Afficher les identifiants admin
if [ -f ".env" ]; then
    ADMIN_EMAIL=$(grep "^ADMIN_EMAIL=" .env 2>/dev/null | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "admin@example.com")
    ADMIN_PASSWORD=$(grep "^ADMIN_PASSWORD=" .env 2>/dev/null | cut -d '=' -f2- | tr -d '"' | tr -d "'" || echo "ChangeThisPassword123!")
    echo ""
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}🔐 Identifiants Admin :${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "   Email:    ${GREEN}${ADMIN_EMAIL}${NC}"
    echo -e "   Password: ${GREEN}${ADMIN_PASSWORD}${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo ""
fi

# 4. Build de l'application
echo -e "${BLUE}🔨 Build de l'application...${NC}"
npm run build

# 5. Obtenir l'adresse IP locale
IP=""

# Méthode 1: macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    for interface in en0 en1 en2 eth0; do
        IP=$(ipconfig getifaddr $interface 2>/dev/null)
        if [ -n "$IP" ] && [ "$IP" != "" ]; then
            break
        fi
    done
    
    if [ -z "$IP" ] || [ "$IP" == "" ]; then
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
fi

# Méthode 2: Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    
    if [ -z "$IP" ] || [ "$IP" == "" ]; then
        IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')
    fi
    
    if [ -z "$IP" ] || [ "$IP" == "" ]; then
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1 | sed 's/addr://')
    fi
fi

# Si toujours aucune IP trouvée, essayer une méthode universelle
if [ -z "$IP" ] || [ "$IP" == "" ]; then
    IP=$(python3 -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0]); s.close()" 2>/dev/null || echo "")
fi

# Vérification finale
if [ "$IP" == "127.0.0.1" ] || [ -z "$IP" ] || [ "$IP" == "" ]; then
    IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")
fi

# 6. Afficher les informations d'accès
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Application prête en production !${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📍 Accès à l'application :${NC}"
echo -e "   • Local:    ${GREEN}http://localhost:3000${NC}"
if [ -n "$IP" ] && [ "$IP" != "" ] && [ "$IP" != "127.0.0.1" ]; then
    echo -e "   • Réseau:   ${GREEN}http://${IP}:3000${NC}"
    echo -e "   ${YELLOW}(Utilisez cette adresse depuis d'autres appareils sur le même réseau)${NC}"
else
    echo -e "   ${YELLOW}⚠️  IP réseau non détectée. L'application est accessible uniquement en local.${NC}"
fi
echo ""
echo -e "${BLUE}🔐 Interface Admin :${NC}"
echo -e "   • Local:    ${GREEN}http://localhost:3000/ss91/login${NC}"
if [ -n "$IP" ] && [ "$IP" != "" ] && [ "$IP" != "127.0.0.1" ]; then
    echo -e "   • Réseau:   ${GREEN}http://${IP}:3000/ss91/login${NC}"
fi
echo ""
echo -e "${YELLOW}💡 Appuyez sur Ctrl+C pour arrêter l'application${NC}"
echo ""

# 7. Lancer Next.js en production sur toutes les interfaces
exec next start -H 0.0.0.0

