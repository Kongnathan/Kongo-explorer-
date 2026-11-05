// Prépare le projet Android avec Capacitor (à lancer une seule fois) : npm run android:setup
import "dotenv/config";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function run(command, args = []) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: true, cwd: root, env: process.env });
  if (result.status !== 0) {
    console.error(`\nLa commande a échoué : ${command} ${args.join(" ")}`);
    console.error("Corrigez le problème indiqué plus haut, puis relancez : npm run android:setup");
    process.exit(result.status ?? 1);
  }
}

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 20) {
  console.error(`Node.js ${process.versions.node} est trop ancien. Installez Node.js 20 ou plus récent, puis relancez.`);
  process.exit(1);
}

// 1. Installer Capacitor
run("npm", ["install", "@capacitor/core", "@capacitor/android"]);
run("npm", ["install", "-D", "@capacitor/cli"]);

// 2. Construire le site (dossier dist)
run("npx", ["vite", "build"]);

// 3. Créer le projet Android (une seule fois)
const androidDir = path.join(root, "android");
if (!fs.existsSync(androidDir)) {
  run("npx", ["cap", "add", "android"]);
} else {
  console.log("\nLe dossier android existe déjà : on le garde tel quel.");
}

// 4. Autoriser la localisation dans l'application
const manifestPath = path.join(androidDir, "app", "src", "main", "AndroidManifest.xml");
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, "utf8");
  const wanted = [
    '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
    '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
    '<uses-feature android:name="android.hardware.location.gps" android:required="false" />',
  ].filter((line) => !manifest.includes(line.match(/android:name="([^"]+)"/)[1]));

  if (wanted.length > 0) {
    const block = wanted.map((line) => `    ${line}`).join("\n");
    const internet = /<uses-permission android:name="android\.permission\.INTERNET"\s*\/>/;
    manifest = internet.test(manifest)
      ? manifest.replace(internet, (match) => `${match}\n${block}`)
      : manifest.replace("</manifest>", `${block}\n</manifest>`);
    fs.writeFileSync(manifestPath, manifest);
    console.log("\nLocalisation autorisée dans AndroidManifest.xml.");
  }
} else {
  console.warn("\nAndroidManifest.xml introuvable : ajoutez les permissions de localisation à la main (voir ANDROID.md).");
}

// 5. Copier le site dans le projet Android
run("npx", ["cap", "sync", "android"]);

console.log(`
Terminé !
Prochaine étape : npm run android:open   (ouvre le projet dans Android Studio)
Après chaque modification du site : npm run android:sync
`);
