# 🔐 Guide de Dépannage - Connexion Admin

## Problème : Les identifiants ne fonctionnent pas

### Étape 1 : Vérifier les variables d'environnement

Exécutez cette commande pour vérifier que toutes les variables sont bien configurées :

```bash
npm run check-env
```

Cela affichera toutes les variables d'environnement requises et indiquera celles qui manquent.

### Étape 2 : Vérifier le fichier .env

Assurez-vous que votre fichier `.env` contient bien :

```env
ADMIN_EMAIL="votre-email@example.com"
ADMIN_PASSWORD="votre-mot-de-passe"
```

**Important :**
- L'email doit être exactement celui défini dans `.env`
- Le mot de passe doit être exactement celui défini dans `.env`
- Pas d'espaces avant/après les valeurs
- Utilisez des guillemets si votre mot de passe contient des caractères spéciaux

### Étape 3 : Réinitialiser l'admin

Si les identifiants ne fonctionnent toujours pas, réinitialisez l'admin avec cette commande :

```bash
npm run db:reset-admin
```

Cette commande va :
1. ✅ Vérifier si l'admin existe dans la base de données
2. ✅ Tester le mot de passe actuel
3. ✅ Réinitialiser le mot de passe avec celui du `.env`
4. ✅ Créer l'admin s'il n'existe pas
5. ✅ Afficher toutes les informations de connexion

### Étape 4 : Vérifier la base de données

Si le problème persiste, vérifiez directement la base de données :

```bash
npm run db:studio
```

Cela ouvrira Prisma Studio où vous pourrez voir tous les utilisateurs.

### Causes courantes

1. **Email en majuscules/minuscules** : L'email est converti en minuscules lors de la connexion
2. **Espaces dans le mot de passe** : Vérifiez qu'il n'y a pas d'espaces avant/après dans `.env`
3. **Admin désactivé** : L'admin peut être marqué comme `isActive: false`
4. **Admin supprimé** : L'admin peut avoir un `deletedAt` non null
5. **Mot de passe hashé incorrect** : Le hash peut être corrompu

### Solution rapide

1. Ouvrez votre fichier `.env`
2. Notez exactement `ADMIN_EMAIL` et `ADMIN_PASSWORD`
3. Exécutez : `npm run db:reset-admin`
4. Utilisez exactement les mêmes identifiants pour vous connecter

### Test de connexion

Après réinitialisation, essayez de vous connecter sur :
- **Local** : http://localhost:3000/ss91/login
- **Réseau** : http://VOTRE_IP:3000/ss91/login

### Informations affichées

Le script `db:reset-admin` affichera :
- ✅ L'email configuré
- ✅ Si l'admin existe
- ✅ Si le mot de passe est valide
- ✅ Tous les utilisateurs dans la base de données

### Si rien ne fonctionne

1. Vérifiez que PostgreSQL est bien démarré : `docker-compose ps`
2. Vérifiez la connexion à la base : `npm run db:studio`
3. Vérifiez les logs de l'application pour voir les erreurs exactes
4. Essayez de créer un nouvel admin manuellement via Prisma Studio

---

**Note** : Après la première connexion, vous serez redirigé vers `/ss91/change-password` pour changer votre mot de passe.

