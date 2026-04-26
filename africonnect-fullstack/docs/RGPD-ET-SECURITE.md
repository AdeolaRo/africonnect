# Registre des traitements (synthèse) & sécurité

Document interne (à compléter avec votre DPO / juridique en cas d’ouverture large).  
*Dernière mise à jour : maintenir la date de déploiement en production.*

## Finalités & bases juridiques (principes)

| Zone | Données | Finalité | Base légale (indicative) | Durée |
|------|---------|----------|----------------------------|-------|
| Compte, profil, messages | identité, contenus, email | exécution du service, messagerie | contrat (Art. 6(1)(b) RGPD) | compte + purge à la suppression |
| Publications (forum, annonces, groupes, etc.) | contenus, lieu optionnel, métadonnées | mise en relation & affichage | contrat + intérêt légitime modération | tant que compte + contenu publié (voir modération) |
| Journal d’accès API | IP, chemin, méthode, user-agent, userId si connecté | sécurité, anti-abus, diagnostic | intérêt légitime (Art. 6(1)(f)) | **~90 jours** (TTL Mongo sur `AccessLog`) |
| Journal d’actions sensibles | rôle, ID acteur, type d’action, cible, IP (audit admin/modération) | traçabilité, réponse en cas d’incident | intérêt légitime sécurité | **~2 ans** (TTL `SecurityAuditLog`) |
| Exports compte (RGPD) | copie des données compte, posts, favoris, messages, demandes pub | exercice des droits | obligation légale / droit d’accès (Art. 15) | par le titulaire (fichier téléchargé) |
| Préférences cookies (si activé) | choix opt-in analytique | respect du consentement | consentement (Art. 6(1)(a)) | durée du compte / révocation |

## Mesures côté application (déployées)

- **Minimisation** : liste d’utilisateurs pour la messagerie = `pseudo`, `fullName`, `avatar` (pas d’email) pour les non-admins. Les admins passent par `/api/admin/users` pour la gestion.
- **Rôles** : seul **admin** accède aux routes `/api/admin/*` (journaux, comptes, etc.). **Modérateur** : suppression / édition de contenus d’autrui (traçu dans `SecurityAuditLog`), pas de gestion des comptes, pas d’export des journaux d’accès. Impossible de supprimer le **dernier** compte `admin` ou de lui retirer le rôle.
- **Limitation** : limitation de fréquence sur authentification (login, inscription, mot de passe oublié) et sur l’espace admin (anti brute-force / abus).
- **Intégrité** : middleware d’erreur central ; `/api/health` renvoie l’état Mongo (Nginx / supervision).

## À tenir manuellement (hors dépôt)

- **Sauvegarde** : exécuter périodiquement le script `africonnect-backend/scripts/backup-mongo.sh` (voir en-tête du script) ou équivalent hébergeur.
- **AIPD / DPIA** : si profilage ou données sensibles massives, valider avec un DPO.
- **Registre papier/Notion** : recopier ce tableau + nom du responsable de traitement + pays d’hébergement + sous-traitants (hébergeur, email, éventuels outils d’analyse).

## Contact responsable (à remplir)

- Responsable de traitement : *à compléter*  
- Contact RGPD : *à compléter*
