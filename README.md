# Prospects v1 - Application de Collecte de Besoins avec IA

Application web complète pour recueillir les besoins réels de clients potentiels avec analyse automatique par IA.

## 🚀 Fonctionnalités

### Interface Publique
- Formulaire intelligent de collecte de besoins
- Support multilingue (FR, EN, ES, DE, IT, PT, AR, ZH, JA)
- Upload de fichiers multiples (images, PDF, audio, vidéo)
- Analyse IA automatique après soumission
- Page de confirmation

### Interface Admin (`/ss91`)
- Authentification sécurisée
- Dashboard avec statistiques
- Gestion complète des besoins (CRUD)
- Visualisation des analyses IA
- Relance d'analyse IA manuelle
- Gestion des statuts et notes internes
- Archivage/restauration (soft delete)
- Gestion des utilisateurs (admins/staff)
- Mode maintenance
- Changement de mot de passe obligatoire

## 📋 Prérequis

- Node.js 18+ 
- Docker et Docker Compose
- Compte OpenAI avec clé API

## 🎨 Design

L'application utilise **DaisyUI** avec le thème **Cyberpunk** pour une interface moderne et futuriste avec des couleurs néon caractéristiques.

## 🛠️ Installation

### 1. Cloner et installer les dépendances

```bash
cd prospects_v1
npm install
```

### 2. Démarrer PostgreSQL avec Docker

```bash
# Démarrer le conteneur PostgreSQL
docker-compose up -d

# Vérifier que le conteneur est bien démarré
docker-compose ps
```

Le conteneur PostgreSQL sera accessible sur `localhost:5432`.

### 3. Configuration de l'environnement

Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

Éditez `.env` et configurez (les identifiants correspondent à ceux du `docker-compose.yml`) :

```env
# Database (correspond aux identifiants du docker-compose.yml)
DATABASE_URL="postgresql://prospects_user:prospects_password@localhost:5432/prospects_db?schema=public"

# JWT Secret (générez une clé aléatoire sécurisée)
JWT_SECRET="votre-clé-secrète-jwt-très-longue-et-aléatoire"

# OpenAI API Key
OPENAI_API_KEY="sk-votre-clé-openai"

# Admin Initial Credentials
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeThisPassword123!"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Configuration de la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Créer les migrations
npx prisma migrate dev --name init

# Seed l'admin initial
npm run db:seed
```

### 5. Créer le dossier d'uploads

```bash
mkdir -p public/uploads
```

### 6. Lancer l'application

#### 🚀 Démarrage rapide (recommandé)

Une seule commande pour tout démarrer (Docker, base de données, migrations, seed) :

```bash
npm run dev:network
```

Cette commande va :
- ✅ Démarrer PostgreSQL avec Docker
- ✅ Générer le client Prisma
- ✅ Appliquer les migrations si nécessaire
- ✅ Créer l'admin initial si nécessaire
- ✅ Lancer l'application sur toutes les interfaces réseau

L'application sera accessible :
- **Localement** : `http://localhost:3000`
- **Sur le réseau** : `http://VOTRE_IP:3000` (l'IP s'affichera dans le terminal)

#### Autres options

```bash
# Mode développement (localhost uniquement)
npm run dev

# Mode production
npm run build
npm start

# Mode production accessible sur le réseau (une seule commande)
npm run build:start
```

> **Note** : Pour arrêter PostgreSQL, utilisez `docker-compose down`. Pour arrêter et supprimer les données, utilisez `docker-compose down -v` (⚠️ attention : cela supprimera toutes les données).

#### 📱 Accès depuis d'autres appareils

Pour accéder à l'application depuis un téléphone, tablette ou autre ordinateur sur le même réseau :

1. Lancez avec `npm run dev:network`
2. Notez l'adresse IP affichée dans le terminal (ex: `192.168.1.100`)
3. Depuis l'autre appareil, ouvrez `http://192.168.1.100:3000` dans le navigateur

**Trouver votre IP manuellement :**
- **macOS/Linux** : `ifconfig | grep "inet "` ou `ipconfig getifaddr en0`
- **Windows** : `ipconfig` (cherchez "IPv4 Address")

## 📁 Structure du Projet

```
prospects_v1/
├── prisma/
│   ├── schema.prisma      # Schéma de base de données
│   └── seed.ts            # Script de seed initial
├── src/
│   ├── app/
│   │   ├── api/           # Routes API
│   │   │   ├── auth/      # Authentification
│   │   │   ├── needs/     # Gestion des besoins
│   │   │   ├── users/     # Gestion utilisateurs
│   │   │   └── settings/  # Paramètres
│   │   ├── ss91/          # Interface admin
│   │   ├── confirmation/  # Page de confirmation
│   │   ├── layout.tsx
│   │   ├── page.tsx       # Formulaire public
│   │   └── globals.css
│   ├── components/        # Composants réutilisables
│   ├── lib/              # Utilitaires
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── storage.ts
│   │   ├── utils.ts
│   │   └── ai/
│   │       └── analyzeNeed.ts
│   └── middleware.ts      # Protection routes admin
├── public/
│   └── uploads/          # Fichiers uploadés
├── docker-compose.yml     # Configuration Docker PostgreSQL
└── package.json
```

## 🔐 Accès Admin

1. Connectez-vous sur `/ss91/login`
2. Utilisez les identifiants définis dans `.env` (lignes `ADMIN_EMAIL` et `ADMIN_PASSWORD`)
3. Les identifiants sont affichés dans le terminal lors du démarrage avec `npm run build:start` ou `npm run dev:network`
4. Si la connexion échoue :
   - Vérifiez que `ADMIN_EMAIL` et `ADMIN_PASSWORD` sont bien définis dans `.env`
   - Exécutez `npm run db:seed` pour créer/réinitialiser l'admin
   - Vérifiez que la base de données est accessible (PostgreSQL démarré)
5. Vous serez redirigé vers le changement de mot de passe si c'est la première connexion

## 🎯 Utilisation

### Interface Publique

1. Accédez à `http://localhost:3000` (ou `http://VOTRE_IP:3000` depuis le réseau)
2. Remplissez le formulaire avec les informations du client
3. Ajoutez des fichiers si nécessaire
4. Soumettez le formulaire
5. L'analyse IA se lance automatiquement en arrière-plan
6. Redirection vers la page de confirmation

### Interface Admin

1. **Dashboard** (`/ss91`) : Vue d'ensemble avec statistiques
2. **Besoins** (`/ss91/needs`) : Liste et gestion des besoins
   - Filtrer par statut
   - Voir les besoins archivés
   - Accéder aux détails
3. **Détail d'un besoin** (`/ss91/needs/[id]`) :
   - Voir toutes les informations
   - Consulter les fichiers joints
   - Voir l'analyse IA
   - Relancer l'analyse IA
   - Changer le statut
   - Ajouter des notes internes
   - Archiver/restaurer
4. **Utilisateurs** (`/ss91/users`) : Gestion des admins/staff
5. **Paramètres** (`/ss91/settings`) : Mode maintenance

## 🤖 Analyse IA

L'analyse IA génère automatiquement :
- Résumé du besoin
- Objectifs principaux
- Solution proposée
- Niveau de complexité
- Estimation de durée
- Fourchette budgétaire
- Liste des risques

L'analyse utilise GPT-4 via l'API OpenAI.

## 📝 Scripts Disponibles

```bash
# Développement
npm run dev              # Localhost uniquement
npm run dev:network      # 🚀 DÉMARRAGE COMPLET (Docker + DB + App sur réseau)

# Build production
npm run build

# Production
npm start                # Localhost uniquement
npm run start:network    # Accessible sur le réseau
npm run build:start      # 🚀 Build + Start sur réseau (une seule commande)

# Base de données
npm run db:push          # Push schema sans migration
npm run db:migrate       # Créer migration
npm run db:seed          # Seed admin initial
npm run db:studio        # Ouvrir Prisma Studio

# Docker
docker-compose up -d     # Démarrer PostgreSQL
docker-compose down      # Arrêter PostgreSQL
docker-compose logs      # Voir les logs
docker-compose ps        # Vérifier le statut
```

> **💡 Astuce** : Utilisez `npm run dev:network` pour démarrer tout en une seule commande et rendre l'application accessible sur le réseau local.

## 🔒 Sécurité

- Authentification via JWT (cookies HttpOnly)
- Protection des routes admin via middleware
- Hashage des mots de passe (bcrypt)
- Soft delete pour toutes les entités
- Validation des données côté serveur
- Protection CSRF via SameSite cookies

## 🌐 Déploiement

### Vercel (Recommandé)

1. Connectez votre repo GitHub
2. Configurez les variables d'environnement dans Vercel
3. Ajoutez la variable `DATABASE_URL` (PostgreSQL)
4. Déployez

### Autres plateformes

- Assurez-vous que PostgreSQL est accessible
- Configurez `DATABASE_URL` correctement
- Les fichiers uploadés sont stockés localement (considérez S3 pour la production)
- Configurez `JWT_SECRET` avec une valeur sécurisée

## 🐛 Dépannage

### Erreur de connexion à la base de données
- Vérifiez que le conteneur Docker est démarré : `docker-compose ps`
- Démarrez PostgreSQL si nécessaire : `docker-compose up -d`
- Vérifiez `DATABASE_URL` dans `.env` (doit correspondre aux identifiants du docker-compose.yml)
- Vérifiez les logs : `docker-compose logs postgres`
- Testez la connexion : `docker-compose exec postgres psql -U prospects_user -d prospects_db`

### Erreur OpenAI
- Vérifiez `OPENAI_API_KEY` dans `.env`
- Vérifiez votre quota OpenAI
- Consultez les logs serveur

### Erreur d'upload
- Vérifiez que `public/uploads` existe
- Vérifiez les permissions d'écriture
- Vérifiez la taille maximale des fichiers

### Erreur d'authentification
- Vérifiez `JWT_SECRET` dans `.env`
- Réinitialisez le mot de passe admin via seed
- Vérifiez les cookies dans le navigateur

## 📚 Technologies

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + **DaisyUI** (thème Cyberpunk)
- **Prisma** (ORM)
- **PostgreSQL**
- **OpenAI API** (GPT-4)
- **JWT** (Authentification)
- **bcryptjs** (Hashage)

## 📄 Licence

Ce projet est privé et propriétaire.

## 🆘 Support

Pour toute question ou problème, consultez la documentation ou contactez l'équipe de développement.

---

**Bon développement ! 🚀**

