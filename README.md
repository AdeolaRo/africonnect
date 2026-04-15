# Africonnect - Plateforme Communautaire Africaine

![Africonnect Logo](africonnect-fullstack/africonnect-frontend/src/assets/logo.png)

Une plateforme fullstack complète pour la communauté africaine, offrant des fonctionnalités de forum, marketplace, emplois, événements, et plus encore.

## 🚀 Fonctionnalités

### Backend (Node.js/Express)
- **API RESTful** complète avec JWT authentication
- **Base de données MongoDB** avec Mongoose ODM
- **Socket.io** pour la messagerie en temps réel
- **Upload de fichiers** avec Multer
- **Email service** pour la réinitialisation de mot de passe

### Frontend (Angular 17)
- **Interface utilisateur moderne** et responsive
- **Authentification** (login, register, forgot password)
- **Multiples modules** : Forum, Marketplace, Emplois, Événements, Groupes, Solidarité, Solutions
- **Messagerie en temps réel** entre utilisateurs
- **Dashboard administrateur** pour la gestion des utilisateurs

## 📁 Structure du Projet

```
africonnect/
├── africonnect-fullstack/
│   ├── africonnect-backend/     # API Node.js/Express
│   │   ├── middleware/          # Middleware d'authentification
│   │   ├── models/              # Modèles MongoDB
│   │   ├── routes/              # Routes API
│   │   ├── server.js            # Point d'entrée
│   │   └── uploads/             # Fichiers uploadés
│   └── africonnect-frontend/    # Application Angular
│       ├── src/app/
│       │   ├── core/            # Services et guards
│       │   ├── features/        # Modules fonctionnels
│       │   └── shared/          # Composants partagés
│       └── src/assets/          # Images et ressources
└── README.md
```

## 🛠️ Installation

### Prérequis
- Node.js 18+ et npm
- MongoDB (local ou Atlas)
- Angular CLI 17+

### 1. Backend Setup
```bash
cd africonnect-fullstack/africonnect-backend
cp .env.example .env
# Éditez .env avec vos configurations
npm install
npm start
```

### 2. Frontend Setup
```bash
cd africonnect-fullstack/africonnect-frontend
npm install
ng serve --port 4200
```

### Variables d'Environnement (.env)
```env
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:4200
```

## 🌐 Accès
- **Frontend** : http://localhost:4200
- **Backend API** : http://localhost:3000
- **API Documentation** : Les routes sont disponibles dans `/routes/`

## 📚 Modules Disponibles

### 1. Forum
- Discussions communautaires
- Catégories et tags
- Likes et commentaires

### 2. Marketplace
- Annonces de produits/services
- Recherche et filtres
- Messagerie entre vendeurs/acheteurs

### 3. Emplois
- Offres d'emploi
- CV et profils professionnels
- Alertes par email

### 4. Événements
- Création et gestion d'événements
- Inscriptions en ligne
- Rappels et notifications

### 5. Groupes
- Groupes d'intérêt
- Discussions privées
- Gestion des membres

### 6. Solidarité
- Campagnes de dons
- Projets communautaires
- Suivi des contributions

### 7. Solutions
- Partage de solutions techniques
- Tutoriels et guides
- Questions/Réponses

### 8. Messagerie
- Chat en temps réel
- Messages privés
- Notifications push

## 🔒 Sécurité
- Authentification JWT
- Hashage des mots de passe (bcrypt)
- Validation des inputs
- Protection CORS
- Rate limiting (à implémenter)

## 📦 Déploiement

### Backend (Heroku/Railway)
```bash
# Configurer les variables d'environnement
heroku config:set MONGODB_URI=...
heroku config:set JWT_SECRET=...
```

### Frontend (Vercel/Netlify)
```bash
# Build l'application
ng build --configuration production
# Déployer le dossier dist/
```

## 🤝 Contribution
1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence
Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Auteurs
- **Adeola** - Développeur principal

## 🙏 Remerciements
- Toute la communauté Africonnect pour les retours et suggestions
- Les contributeurs open-source pour les librairies utilisées

---
**Note** : Ce projet est en développement actif. Les fonctionnalités peuvent évoluer.