Correctifs inclus dans camelio/server/app.js :

1. Correction du bug critique getDataAccessContext : dataPk retourne maintenant getUserPk(req) pour le compte principal.
2. Ajout d'un verrouillage temporaire des liens publics après trop d'essais invalides du code d'accès.
3. Réinitialisation des tentatives échouées après un accès réussi au lien public.
4. Ajout de ContentLength dans les commandes S3 presignées pour documents, avatars et photos.
5. Validation obligatoire de fileSize pour les avatars et les photos.

Le dossier .git n'est pas inclus dans ce ZIP.
