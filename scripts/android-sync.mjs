// Reconstruit le site et le copie dans le projet Android : npm run android:sync
import "dotenv/config";
import { spawnSync } from "node:child_process";

function run(command, args) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", shell: true, cwd: process.cwd(), env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("npx", ["vite", "build"]);
run("npx", ["cap", "sync", "android"]);
console.log("\nTerminé ! Dans Android Studio, relancez l'application (bouton ▶).");
