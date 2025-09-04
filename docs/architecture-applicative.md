# Architecture Applicative - Performance ESG (GreenIA)

## 1. Architecture physique et logique

L'architecture de la plateforme Performance ESG a été conçue en intégrant étroitement ses aspects physiques et logiques pour assurer performance, sécurité et maintenabilité dans un contexte de suivi ESG multi-organisationnel.

### Infrastructure physique

Sur le plan physique, la plateforme s'exécute sur une infrastructure web moderne :
- **Serveur web Vite** : Gère les requêtes HTTP entrantes et sert l'application React
- **Application frontend** : Interface utilisateur construite avec React 18 et TypeScript
- **Base de données Supabase** : PostgreSQL hébergé avec authentification intégrée
- **Stockage de fichiers** : Supabase Storage pour les documents, images et rapports
- **Edge Functions** : Fonctions serverless pour l'intégration IA et les traitements

### Architecture logique

D'un point de vue logique, la plateforme adopte une architecture moderne basée sur :

#### Frontend (React + TypeScript)
- **Composants React** : Interface utilisateur modulaire et réactive
- **Stores Zustand** : Gestion d'état centralisée avec persistance
- **Hooks personnalisés** : Logique métier réutilisable
- **Context API** : Partage d'état pour les processus de configuration
- **React Router** : Navigation et protection des routes

#### Backend (Supabase)
- **Base de données PostgreSQL** : Stockage relationnel avec contraintes d'intégrité
- **Row Level Security (RLS)** : Sécurité au niveau des lignes pour l'isolation des données
- **Triggers et fonctions** : Automatisation des processus métier
- **Edge Functions** : Logique serverless pour l'IA et les intégrations externes

#### Modules principaux

**Module Administrateur**
- Configuration des secteurs, normes, enjeux, critères et indicateurs
- Gestion des organisations et utilisateurs
- Processus de configuration en 7 étapes
- Interface d'impersonation pour l'accès aux espaces clients

**Module Pilotage/Performance**
- Collecte mensuelle des indicateurs ESG
- Workflow de validation (brouillon → soumis → validé/rejeté)
- Consolidation hiérarchique (site → filiale → filière → organisation)
- Tableaux de bord avec filtres dynamiques selon les niveaux d'accès

**Module Reporting**
- Génération de rapports ESG structurés
- Modules de contenu personnalisables (mot du dirigeant, profil organisation, etc.)
- Gestion des images et documents PDF
- Export et impression des rapports

**Module Gestion**
- Configuration organisationnelle (SWOT, parties prenantes, stratégie)
- Gestion des utilisateurs et rôles
- Modules de contenu managérial

## 2. Patterns et principes architecturaux

### Séparation des responsabilités
- **Composants de présentation** : Affichage et interaction utilisateur
- **Hooks métier** : Logique de récupération et manipulation des données
- **Stores** : Gestion d'état global et cache
- **Services** : Communication avec l'API Supabase

### Sécurité par conception
- **Authentification JWT** : Tokens sécurisés via Supabase Auth
- **Autorisation basée sur les rôles** : Admin, Enterprise, Contributor, Validator
- **Isolation des données** : RLS PostgreSQL pour séparer les organisations
- **Validation côté client et serveur** : Contrôles de saisie et contraintes DB

### Réactivité et performance
- **Lazy loading** : Chargement à la demande des composants
- **Optimistic updates** : Mise à jour immédiate de l'interface
- **Cache intelligent** : Persistance des données avec Zustand
- **Pagination** : Gestion efficace des grandes listes

## 3. Flux de données et workflows

### Processus de configuration ESG (7 étapes)
1. **Secteurs** : Sélection du domaine et sous-secteur d'activité
2. **Normes** : Choix des standards applicables (ISO, GRI, CSRD, etc.)
3. **Enjeux** : Identification des enjeux ESG pertinents
4. **Critères** : Définition des critères d'évaluation
5. **Indicateurs** : Sélection des KPIs de performance
6. **Organisation** : Configuration de la structure organisationnelle
7. **Utilisateurs** : Création des comptes et attribution des rôles

### Workflow de collecte des données
1. **Saisie** : Les contributeurs renseignent les valeurs mensuelles
2. **Soumission** : Passage du statut "brouillon" à "soumis"
3. **Validation** : Les validateurs approuvent ou rejettent avec commentaires
4. **Consolidation** : Agrégation automatique selon les formules définies
5. **Reporting** : Génération des rapports et tableaux de bord

### Hiérarchie organisationnelle
- **Organisation** : Niveau racine
- **Filières** : Divisions métier (pour les groupes)
- **Filiales** : Entités juridiques distinctes
- **Sites** : Localisations physiques

## 4. Avantages de l'architecture

### Sécurité renforcée et isolation des données
Grâce aux mécanismes de Row Level Security (RLS) PostgreSQL et aux politiques d'accès strictes, l'architecture garantit qu'une organisation ne peut accéder qu'à ses propres données. Le système de rôles (RBAC) avec quatre niveaux (admin, enterprise, contributor, validator) assure un contrôle granulaire des permissions.

### Maintenabilité et évolutivité accrues
La conception modulaire avec séparation claire des responsabilités (composants, hooks, stores, services) facilite la maintenance et l'ajout de nouvelles fonctionnalités. L'utilisation de TypeScript garantit la robustesse du code et facilite les refactorings.

### Performance et réactivité de l'interface
L'architecture React moderne avec gestion d'état optimisée (Zustand) et composants réactifs offre une expérience utilisateur fluide. Le lazy loading et la pagination assurent des performances optimales même avec de gros volumes de données.

### Efficacité et rapidité de développement
L'exploitation de l'écosystème React/TypeScript/Supabase accélère le développement grâce à :
- Composants UI réutilisables avec Tailwind CSS
- Hooks personnalisés pour la logique métier
- Supabase pour l'authentification, la base de données et le stockage
- Edge Functions pour l'intégration IA

### Flexibilité et personnalisation
Le système de modules de contenu permet une personnalisation poussée des rapports ESG selon les besoins de chaque organisation, tout en maintenant une structure cohérente et des standards de qualité élevés.

## 5. Technologies et outils

### Frontend
- **React 18** : Framework UI avec hooks et context
- **TypeScript** : Typage statique pour la robustesse
- **Tailwind CSS** : Framework CSS utilitaire
- **Framer Motion** : Animations fluides
- **React Hook Form** : Gestion des formulaires
- **Zustand** : Gestion d'état légère et performante
- **React Router** : Navigation et protection des routes

### Backend et Infrastructure
- **Supabase** : Backend-as-a-Service avec PostgreSQL
- **PostgreSQL** : Base de données relationnelle avec RLS
- **Supabase Auth** : Authentification et autorisation
- **Supabase Storage** : Stockage de fichiers sécurisé
- **Edge Functions** : Fonctions serverless Deno

### Outils de développement
- **Vite** : Build tool et serveur de développement
- **ESLint** : Analyse statique du code
- **PostCSS** : Traitement CSS avancé
- **React Hot Toast** : Notifications utilisateur

Cette architecture garantit une plateforme ESG robuste, sécurisée et évolutive, capable de gérer efficacement les besoins complexes de suivi et reporting ESG des organisations modernes.