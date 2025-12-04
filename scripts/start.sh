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

# Fonction pour vérifier si une IP est valide (exclut Docker/WSL, link-local, loopback)
is_valid_network_ip() {
    local ip=$1
    if [ -z "$ip" ] || [ "$ip" == "" ] || [ "$ip" == "127.0.0.1" ]; then
        return 1
    fi
    
    # Exclure les IPs Docker (172.17.0.0/16 à 172.31.0.0/16)
    if [[ "$ip" =~ ^172\.(1[7-9]|2[0-9]|3[0-1])\..*$ ]]; then
        return 1
    fi
    
    # Exclure les IPs link-local (169.254.x.x)
    if [[ "$ip" =~ ^169\.254\..*$ ]]; then
        return 1
    fi
    
    # Accepter les IPs privées normales (192.168.x.x, 10.x.x.x) et autres
    return 0
}

# Méthode 1: Windows (Git Bash, MSYS, Cygwin) - Collecter toutes les IPs et filtrer
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ -n "$WINDIR" ]]; then
    # Méthode principale : utiliser ipconfig (plus fiable dans Git Bash)
    # Extraire toutes les IPs IPv4 (format: "   Adresse IPv4 . . . . . . . . . . . . : 192.168.1.100")
    ALL_IPS=$(ipconfig 2>/dev/null | grep -i "IPv4" | grep -v "127.0.0.1" | sed -n 's/.*: *\([0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\).*/\1/p' | tr '\n' ' ' | sed 's/  */ /g' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
    
    # Trier les IPs par priorité : 192.168.x.x > 10.x.x.x > autres valides
    PRIORITY_192=""
    PRIORITY_10=""
    OTHER_IPS=""
    
    for candidate_ip in $ALL_IPS; do
        # Trim whitespace
        candidate_ip=$(echo "$candidate_ip" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        if [ -n "$candidate_ip" ] && [ "$candidate_ip" != "" ]; then
            if is_valid_network_ip "$candidate_ip"; then
                if [[ "$candidate_ip" =~ ^192\.168\. ]]; then
                    PRIORITY_192="$PRIORITY_192 $candidate_ip"
                elif [[ "$candidate_ip" =~ ^10\. ]]; then
                    PRIORITY_10="$PRIORITY_10 $candidate_ip"
                else
                    OTHER_IPS="$OTHER_IPS $candidate_ip"
                fi
            fi
        fi
    done
    
    # Prendre la première IP selon la priorité : 192.168.x.x > 10.x.x.x > autres valides
    if [ -n "$PRIORITY_192" ]; then
        IP=$(echo $PRIORITY_192 | awk '{print $1}')
    elif [ -n "$PRIORITY_10" ]; then
        IP=$(echo $PRIORITY_10 | awk '{print $1}')
    elif [ -n "$OTHER_IPS" ]; then
        IP=$(echo $OTHER_IPS | awk '{print $1}')
    fi
    
    # Si aucune IP valide trouvée avec PowerShell, essayer ipconfig
    if [ -z "$IP" ] || [ "$IP" == "" ] || ! is_valid_network_ip "$IP"; then
        # Extraire toutes les IPs depuis ipconfig
        ALL_IPS=$(ipconfig 2>/dev/null | grep -i "IPv4" | grep -v "127.0.0.1" | sed 's/.*: *\([0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\.[0-9]\{1,3\}\).*/\1/' | tr '\n' ' ')
        
        PRIORITY_192=""
        PRIORITY_10=""
        OTHER_IPS=""
        
        for candidate_ip in $ALL_IPS; do
            candidate_ip=$(echo "$candidate_ip" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            if [ -n "$candidate_ip" ] && [ "$candidate_ip" != "" ]; then
                if is_valid_network_ip "$candidate_ip"; then
                    if [[ "$candidate_ip" =~ ^192\.168\. ]]; then
                        PRIORITY_192="$PRIORITY_192 $candidate_ip"
                    elif [[ "$candidate_ip" =~ ^10\. ]]; then
                        PRIORITY_10="$PRIORITY_10 $candidate_ip"
                    else
                        OTHER_IPS="$OTHER_IPS $candidate_ip"
                    fi
                fi
            fi
        done
        
        # Prendre la première IP selon la priorité
        if [ -z "$IP" ] || [ "$IP" == "" ] || ! is_valid_network_ip "$IP"; then
            if [ -n "$PRIORITY_192" ]; then
                IP=$(echo $PRIORITY_192 | awk '{print $1}')
            elif [ -n "$PRIORITY_10" ]; then
                IP=$(echo $PRIORITY_10 | awk '{print $1}')
            elif [ -n "$OTHER_IPS" ]; then
                IP=$(echo $OTHER_IPS | awk '{print $1}')
            fi
        fi
    fi
fi

# Méthode 2: macOS - Collecter et filtrer
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Essayer toutes les interfaces réseau
    for interface in en0 en1 en2 eth0; do
        candidate_ip=$(ipconfig getifaddr $interface 2>/dev/null)
        if is_valid_network_ip "$candidate_ip"; then
            IP="$candidate_ip"
            break
        fi
    done
    
    # Si aucune interface n'a fonctionné, utiliser ifconfig et filtrer
    if [ -z "$IP" ] || [ "$IP" == "" ] || ! is_valid_network_ip "$IP"; then
        ALL_IPS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | tr '\n' ' ')
        for candidate_ip in $ALL_IPS; do
            candidate_ip=$(echo "$candidate_ip" | tr -d ' \r\n')
            if is_valid_network_ip "$candidate_ip"; then
                IP="$candidate_ip"
                break
            fi
        done
    fi
fi

# Méthode 3: Linux - Collecter et filtrer
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Collecter toutes les IPs avec hostname -I
    ALL_IPS=$(hostname -I 2>/dev/null | tr ' ' '\n' | tr '\n' ' ')
    for candidate_ip in $ALL_IPS; do
        candidate_ip=$(echo "$candidate_ip" | tr -d ' \r\n')
        if is_valid_network_ip "$candidate_ip"; then
            IP="$candidate_ip"
            break
        fi
    done
    
    # Si ça ne fonctionne pas, utiliser ip route
    if [ -z "$IP" ] || [ "$IP" == "" ] || ! is_valid_network_ip "$IP"; then
        candidate_ip=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')
        if is_valid_network_ip "$candidate_ip"; then
            IP="$candidate_ip"
        fi
    fi
    
    # Dernière tentative avec ifconfig
    if [ -z "$IP" ] || [ "$IP" == "" ] || ! is_valid_network_ip "$IP"; then
        ALL_IPS=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | sed 's/addr://' | tr '\n' ' ')
        for candidate_ip in $ALL_IPS; do
            candidate_ip=$(echo "$candidate_ip" | tr -d ' \r\n')
            if is_valid_network_ip "$candidate_ip"; then
                IP="$candidate_ip"
                break
            fi
        done
    fi
fi

# Méthode 0: Python (méthode cross-platform de secours)
if [ -z "$IP" ] || [ "$IP" == "" ] || ! is_valid_network_ip "$IP"; then
    # Utiliser Python pour obtenir l'IP (fonctionne sur tous les systèmes)
    candidate_ip=$(python3 -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0]); s.close()" 2>/dev/null || python -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); print(s.getsockname()[0]); s.close()" 2>/dev/null || echo "")
    if is_valid_network_ip "$candidate_ip"; then
        IP="$candidate_ip"
    fi
fi

# 7. Afficher les informations d'accès
echo ""
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Application prête !${NC}"
echo -e "${GREEN}════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📍 Accès à l'application :${NC}"
echo -e "   • Local:    ${GREEN}http://localhost:3000${NC}"
if is_valid_network_ip "$IP"; then
    echo -e "   • Réseau:   ${GREEN}http://${IP}:3000${NC}"
    echo -e "   ${YELLOW}(Utilisez cette adresse depuis d'autres appareils sur le même réseau)${NC}"
else
    echo -e "   ${YELLOW}⚠️  IP réseau non détectée. L'application est accessible uniquement en local.${NC}"
    echo -e "   ${YELLOW}   Pour accéder depuis le réseau, trouvez votre IP avec:${NC}"
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ -n "$WINDIR" ]]; then
        echo -e "   ${YELLOW}   ipconfig | findstr IPv4${NC}"
        echo -e "   ${YELLOW}   ou: powershell -Command \"Get-NetIPAddress -AddressFamily IPv4\"${NC}"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "   ${YELLOW}   ifconfig | grep 'inet ' | grep -v 127.0.0.1${NC}"
    else
        echo -e "   ${YELLOW}   hostname -I${NC}"
    fi
fi
echo ""
echo -e "${BLUE}🔐 Interface Admin :${NC}"
echo -e "   • Local:    ${GREEN}http://localhost:3000/ss91/login${NC}"
if is_valid_network_ip "$IP"; then
    echo -e "   • Réseau:   ${GREEN}http://${IP}:3000/ss91/login${NC}"
fi
echo ""
echo -e "${YELLOW}💡 Appuyez sur Ctrl+C pour arrêter l'application${NC}"
echo ""

# 8. Lancer Next.js sur toutes les interfaces (0.0.0.0 = toutes les interfaces réseau)
exec next dev -H 0.0.0.0

