# Registre des traitements (synthèse) & sécurité

**Service** : African Connect (plateforme en ligne : forum, petites annonces, emploi, solidarité, événements, groupes, messagerie).  
**Dernière mise à jour** : 2026-04-26 (à maintenir à chaque changement d’hébergeur ou de finalité).

---

## 1. Responsable de traitement & contacts

| Rôle | Valeur (à personnaliser si besoin) |
|------|------------------------------------|
| **Dénomination** | **African Connect** |
| **Responsable de traitement (personne morale)** | African Connect — *représentant légal : indiquer nom, prénom et qualité* |
| **Adresse du siège** | *À compléter (rue, code postal, pays)* — préférence **Union européenne** si possible |
| **Contact général** | **contact@africanconnect.net** |
| **Contact données personnelles (RGPD)** | **privacy@africanconnect.net** *(créer cette boîte et la faire suivre par le responsable ou un DPO / mandataire)* |
| **Hébergeur du site / de l’API** | *Nom du prestataire, localisation des serveurs (UE recommandé), lien vers sa politique de sous-traitance* |
| **Base de données (MongoDB)** | *Même hébergeur ou préciser — accès restreint (SSH, réseau privé), sauvegardes chiffrées en transit* |

> **Note** : les adresses e-mail ci-dessus sont des **canaux publics** attendus sur le site ; remplacez-les par vos adresses réelles opérationnelles. Ne commitez pas de secrets (SMTP, mots de passe) dans ce dépôt.

---

## 2. Finalités & bases juridiques (rappel)

| Zone | Données | Finalité | Base légale (indicative) | Durée |
|------|---------|----------|----------------------------|-------|
| Compte, profil, messages | identité, contenus, email | exécution du service, messagerie | contrat (Art. 6(1)(b) RGPD) | compte + purge à la suppression |
| Publications (forum, annonces, groupes, etc.) | contenus, lieu optionnel, métadonnées | mise en relation & affichage | contrat + intérêt légitime modération | tant que compte + contenu publié (voir modération) |
| Journal d’accès API | IP, chemin, méthode, user-agent, userId si connecté | sécurité, anti-abus, diagnostic | intérêt légitime (Art. 6(1)(f)) | **~90 jours** (TTL Mongo sur `AccessLog`) |
| Journal d’actions sensibles | acteur, rôle, action, cible, IP (audit) | traçabilité, réponse en cas d’incident | intérêt légitime sécurité | **~2 ans** (TTL `SecurityAuditLog`) |
| Exports compte (RGPD) | copie des données compte, posts, favoris, messages, demandes pub | exercice des droits | droit d’accès (Art. 15) | par le titulaire (fichier téléchargé) |
| Préférences cookies (si activé) | choix opt-in analytique | respect du consentement | consentement (Art. 6(1)(a)) | durée du compte / révocation |

---

## 3. Mesures côté application (déployées)

- **Minimisation** : liste d’utilisateurs pour la messagerie = `pseudo`, `fullName`, `avatar` (pas d’email) pour les non-admins. Les admins passent par `/api/admin/users` pour la gestion.
- **Rôles** : seul **admin** accède aux routes `/api/admin/*` (journaux, comptes, etc.). **Modérateur** : suppression / édition de contenus d’autrui (traçu dans `SecurityAuditLog`), pas de gestion des comptes, pas d’export des journaux d’accès. Impossible de supprimer le **dernier** compte `admin` ou de lui retirer le rôle.
- **Limitation** : limitation de fréquence sur l’authentification et l’espace admin.
- **Intégrité** : middleware d’erreur central ; `/api/health` indique l’état de la base.
- **Sauvegarde** : script `africonnect-backend/scripts/backup-mongo.sh` + planification **cron** (voir §5).

---

## 4. Analyse d’impact (AIPD / DPIA) — données de santé, EHPAD, personnes vulnérables

Si la plateforme est utilisée pour des **contenus liés à la santé** (citations de dossiers, coordonnées de résidents, noms d’EHPAD associés à des personnes, etc.) ou un **trafic important** vers des thématiques sensibles, le RGPD peut imposer une **AIPD** (DPIA en anglais) **avant** le traitement (Art. 35), en particulier si le traitement comporte un **risque élevé** (profilage, données sensibles Art. 9 à grande échelle, surveillance systématique, etc.).

**Grille de décision (simplifiée)**  
- S’agit-il de données de **santé** ou d’**origine** / **vie sexuelle** / **condamnations** au sens Art. 9 ? **Oui** → AIPD fortement recommandée ; consulter un **DPO** ou un avocat.  
- S’agit-il uniquement d’**échanges généraux** (solidarité, emploi) **sans** données de santé identifiantes ? **Risque** souvent modéré, mais **documentez** l’analyse.  
- **EHPAD / résidents** : même sans données de santé, l’**identification** d’une personne vulnérable + lieu peut être **sensible** → réduire les contenus, modération renforcée, durées de conservation courtes, procédure d’exercice des droits claire.

**Contenu type d’AIPD (à formaliser dans un tableur / document séparé)**  
1. **Description** du traitement (finalité, public, types de données).  
2. **Nécessité** et **proportionnalité** (champs limités, durées, pseudonymisation si possible).  
3. **Risques** pour les personnes (fuite, discriminations, stigmatisation).  
4. **Mesures** (chiffrement, accès restreint, journal d’audit, formation modérateurs, CGU, signalement).  
5. **Validation** par le responsable de traitement et avis DPO (si DPO obligatoire ou désigné).  
6. **Réexamen** annuel ou lors d’un changement majeur (nouvelle rubrique, nouveau pays, partenariat).

*Ce paragraphe ne remplace pas un conseil juridique.*

---

## 5. Planification de la sauvegarde (cron)

Prérequis sur le **serveur** : `mongodump` (paquet *MongoDB Database Tools*), variable `MONGODB_URI` présente dans `africonnect-backend/.env` (ou exportée avant l’exécution du script).

### Exemple de tâche cron (tous les jours à 3 h 15, fuseau du serveur)

Ouvrez la crontab : `crontab -e` (utilisateur dédié au service, **sans** `root` si possible) et ajoutez une ligne du type :

```cron
# African Connect — sauvegarde MongoDB (ajuster le chemin absolu du dépôt sur le serveur)
15 3 * * * /bin/bash /var/www/africonnect/africonnect-fullstack/africonnect-backend/scripts/backup-mongo.sh >> /var/log/africanconnect/backup-mongo.log 2>&1
```

**Recommandations** :  
- Créer le répertoire de logs (`/var/log/africanconnect/`) et le faire **rotater** (logrotate).  
- Stocker les fichiers `*.archive` **hors** du serveur de production (stockage objet, autre machine, chiffrement).  
- Tester une **restauration** `mongorestore` sur un environnement de **préproduction** une fois.

Un fichier d’exemple est aussi fourni : **`docs/crontab-backup.example`**.

---

## 6. Registre complémentaire (papier, DPO, sous-traitants)

- **Registre des traitements** (Art. 30) tenu en parallèle : copier/adapter le tableau de la section 2, ajouter **transferts hors UE** (s’il y a lieu) et **sous-traitants** (hébergeur, e-mail, Stripe, etc.).  
- **Procédure en cas de violation** : who to notify (CNIL / utilisateurs) sous 72h si risque, selon la doctrine applicable.

## 7. Contact (récapitulatif)

- **Général** : contact@africanconnect.net  
- **Données personnelles** : privacy@africanconnect.net  

*Remplacez par vos adresses réelles si différentes.*
