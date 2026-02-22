# Quera-Fablab - Intranet V3

Bienvenue sur le dépôt du projet **Intranet Quera-Fablab**. Cette application complète (Full-Stack) est conçue pour la gestion interne de l'association, incluant la gestion des utilisateurs, des activités, des permanences d'accompagnement (aide aux devoirs) et la réservation de salles.

## 🚀 Fonctionnalités Principales

- **Gestion des Utilisateurs** : Différents rôles disponibles (Administrateur, Bénévole, Service Civique, Bénéficiaire).
- **Gestion des Activités** : Création d'événements avec gestion des inscriptions et quotas dynamiques.
- **Accompagnement & Aide aux devoirs** : Planification de sessions avec gestion des limites de places (ex. 3 bénévoles / 15 jeunes).
- **Réservation de Salles** : Planning et réservation d'espaces.
- **Système d'Authentification** : Rôle basé sur l'accès.

## 🛠️ Stack Technique

- **Frontend** : React 19, Vite, TailwindCSS v4, Framer Motion, Lucide React.
- **Backend** : Node.js, Express.js.
- **Base de données** : SQLite (via `better-sqlite3`). Stockée localement dans `association.db`.
- **Langage** : TypeScript.

---

## 🏃‍♂️ Démarrage du Projet (Commande de Démarrage)

Le serveur Express est configuré pour servir l'API backend **ET** le frontend React (via Vite en mode middleware). Il est donc indispensable de lancer l'application via le point d'entrée du serveur.

### 1. Installation des dépendances
Assurez-vous d'avoir Node.js installé. À la racine du projet, exécutez :
```bash
npm install
```

### 2. Démarrer le serveur (Frontend + Backend)
Utilisez `tsx` (inclus dans les devDependencies) pour exécuter directement le serveur TypeScript :
```bash
npx tsx server.ts
```
*(Le serveur démarrera sur **http://localhost:3000**)*

---

## 🔐 Identifiants de Test (Générés automatiquement)

Au démarrage du serveur, si la base de données est vide, un jeu de données de test est automatiquement généré.

### Administrateur :
- **Email :** `admin@assoc.fr`
- **Mot de passe :** `admin123`

### Utilisateurs de test (Bénévoles, Services Civiques, Bénéficiaires) :
Les profils suivants sont générés (de 1 à 5). Par exemple :
- **Bénévole :** `test_volunteer_1@assoc.fr`
- **Service Civique :** `test_civic_service_1@assoc.fr`
- **Bénéficiaire :** `test_beneficiary_1@assoc.fr`
- **Mot de passe pour tous les tests :** `password123`

## 📂 Structure du projet
- `server.ts` : Point d'entrée principal (Backend Express + Configuration de la base de données + Vite Middleware).
- `/src` : Code source du Frontend (React, Composants, Pages).
- `/public/uploads` : Dossier contenant les images uploadées (généré automatiquement).
- `association.db` : Fichier de la base de données SQLite généré au premier lancement.
