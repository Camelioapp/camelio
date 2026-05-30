Correctifs sécurité Camelio 1.45

Fichiers inclus :
- server/app.js
- server/package.json
- package.json
- render.yaml

Corrections incluses :
1. Réactivation d'une CSP Helmet minimale compatible Stripe/Cognito/S3/Resend.
2. Route /api/test-email protégée par requireAuth et désactivée en production.
3. Ajout des routes backend du Carnet souvenir :
   - GET /api/memory-book
   - POST /api/memory-book
   - PUT /api/memory-book/:memoryId
   - DELETE /api/memory-book/:memoryId
4. Sauvegarde du Carnet souvenir côté DynamoDB avec permissions invitées.
5. Filtrage du Carnet souvenir selon les enfants partagés.
6. Accès invité mieux protégé pour /api/children.
7. Un invité ne peut pas créer, modifier ou supprimer un profil enfant.
8. /api/events utilise maintenant getDataAccessContext avec la section calendar.
9. Filtrage des événements selon les enfants partagés.
10. Annulation Stripe ajoutée lors de la suppression du compte.
11. Suppression locale de l'abonnement après suppression de compte.
12. Logs serveur moins détaillés en production.
13. Engines Node assouplies à >=20 <21 pour éviter le blocage Render/npm.
14. render.yaml conserve npm install && npm run build et ne force pas NODE_VERSION.

Validation effectuée :
- node --check server/app.js : OK

Note : ce patch améliore fortement la sécurité du MVP. Un vrai 100/100 absolu demande aussi des éléments d'infrastructure : antivirus S3, monitoring, sauvegardes testées, pentest externe, IAM minimal, et vérification AWS/Render/Stripe en production.
