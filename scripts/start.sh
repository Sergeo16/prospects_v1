#!/bin/bash

set -e

echo "🚀 Démarrage de Prospects v1..."

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
    sleep 8
else
    echo -e "${GREEN}✓ PostgreSQL est déjà démarré${NC}"
fi

# 2. Vérifier que Prisma Client est généré
if [ ! -d "node_modules/.prisma" ]; then
    echo -e "${BLUE}🔧 Génération du client Prisma...${NC}"
    npx prisma generate
fi

# 3. Vérifier si les migrations ont été appliquées (tentative simple)
echo -e "${BLUE}🔧 Vérification des migrations...${NC}"
npx prisma migrate deploy 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Première migration nécessaire...${NC}"
    npx prisma migrate dev --name init || true
}

# 4. Seed l'admin (le script seed vérifie déjà s'il existe)
echo -e "${BLUE}👤 Vérification de l'admin initial...${NC}"
npm run db:seed 2>/dev/null || true

# 5. Créer le dossier uploads s'il n'existe pas
mkdir -p public/uploads

# 6. Obtenir l'adresse IP locale (méthode améliorée)
IP=""

# Méthode 1: macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Essayer toutes les interfaces réseau
    for interface in en0 en1 en2 eth0; do
        IP=$(ipconfig getifaddr $interface 2>/dev/null)
        if [ -n "$IP" ] && [ "$IP" != "" ]; then
            break
        fi
    done
    
    # Si aucune interface n'a fonctionné, utiliser une méthode alternative
    if [ -z "$IP" ] || [ "$IP" == "" ]; then
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
fi

# Méthode 2: Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Essayer hostname -I d'abord
    IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    
    # Si ça ne fonctionne pas, utiliser ip route
    if [ -z "$IP" ] || [ "$IP" == "" ]; then
        IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')
    fi
    
    # Dernière tentative avec ifconfig
    if [ -z "$IP" ] || [ "$IP" == "" ]; then
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1 | sed 's/addr://')
    fi
fi

# Si toujours aucune IP trouvée, essayer une méthode universelle
if [ -z "$IP" ] || [ "$IP" == "" ]; then
    # Utiliser Python pour obtenir l'IP (méthode cross-platform)
    IP=$(python3 -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0]); s.close()" 2>/dev/null || echo "")
fi

# Vérification finale : si l'IP est 127.0.0.1 ou vide, essayer une autre méthode
if [ "$IP" == "127.0.0.1" ] || [ -z "$IP" ] || [ "$IP" == "" ]; then
    # Dernière tentative avec une connexion réseau
    IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "")
fi

# 7. Afficher les informations d'accès
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Application prête !${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📍 Accès à l'application :${NC}"
echo -e "   • Local:    ${GREEN}http://localhost:3000${NC}"
if [ -n "$IP" ] && [ "$IP" != "" ] && [ "$IP" != "127.0.0.1" ]; then
    echo -e "   • Réseau:   ${GREEN}http://${IP}:3000${NC}"
    echo -e "   ${YELLOW}(Utilisez cette adresse depuis d'autres appareils sur le même réseau)${NC}"
else
    echo -e "   ${YELLOW}⚠️  IP réseau non détectée. L'application est accessible uniquement en local.${NC}"
    echo -e "   ${YELLOW}   Pour accéder depuis le réseau, trouvez votre IP avec:${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "   ${YELLOW}   ifconfig | grep 'inet ' | grep -v 127.0.0.1${NC}"
    else
        echo -e "   ${YELLOW}   hostname -I${NC}"
    fi
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

# 8. Lancer Next.js sur toutes les interfaces (0.0.0.0 = toutes les interfaces réseau)
exec next dev -H 0.0.0.0

