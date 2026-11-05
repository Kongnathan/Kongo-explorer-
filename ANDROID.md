# Kongo Explorer en application Android

Le site est « emballé » dans une vraie application Android avec Capacitor. Le site web (Vercel) ne change pas.

## Ce qu'il faut sur votre PC (une seule fois)
1. Node.js 20 ou plus récent
2. Android Studio (avec le SDK Android proposé à l'installation)
3. Ce projet téléchargé depuis GitHub (`git pull` pour avoir la dernière version)

## Première installation
```
npm install
npm run android:setup
npm run android:open
```
`android:setup` installe Capacitor, construit le site, crée le dossier `android/` et autorise la localisation.
`android:open` ouvre le projet dans Android Studio : branchez un téléphone (débogage USB) ou lancez un émulateur, puis appuyez sur ▶.

## Après chaque modification du site
```
npm run android:sync
```
Puis relancez l'application dans Android Studio (▶).

## Fichier `.env` (facultatif)
- `VITE_API_BASE_URL` : adresse du site qui fournit l'API (par défaut https://kongo-explorer.vercel.app).
- `GOOGLE_MAPS_PLATFORM_KEY` : votre clé Google Maps, comme pour le site.

## Points d'attention
- **Identifiant de l'application** (`appId` dans `capacitor.config.json`, par défaut `com.kongoexplorer.app`) : choisissez-le AVANT la première publication sur le Play Store, il ne peut plus changer ensuite.
- **Connexion Google** : la fenêtre de connexion Google peut ne pas fonctionner dans l'application. La connexion par e-mail fonctionne. Pour Google, il faudra ajouter un plugin de connexion native plus tard.
- **Clé Google Maps** : si la carte Google est vide dans l'application, vérifiez les restrictions de la clé dans Google Cloud.
- **API** : l'application appelle `/api/...` sur le site en ligne. Il faut donc que le serveur de l'API soit bien en ligne (vérifiez que Vercel le sert).
- **Localisation** : le site ne peut pas ouvrir les réglages du téléphone. Une fenêtre d'aide explique quoi faire (fermer les applis superposées, activer la position).
- **Publication** : Android Studio → Build → Generate Signed Bundle (.aab) pour le Play Store. Gardez précieusement votre fichier de clé (keystore).
