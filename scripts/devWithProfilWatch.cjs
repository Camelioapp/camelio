const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { execFile } = require("child_process");

const root = path.join(__dirname, "..");
const generatorPath = path.join(root, "scripts", "generateProfilManifest.cjs");
const watchedFolders = [
  path.join(root, "public", "Profil", "Fille"),
  path.join(root, "public", "Profil", "Garcon"),
  path.join(root, "public", "Profil", "Parent", "Mere"),
  path.join(root, "public", "Profil", "Parent", "Pere"),
];

let debounceTimer = null;

function generateManifest() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    execFile(process.execPath, [generatorPath], { cwd: root }, (error, stdout, stderr) => {
      if (error) {
        console.error("Erreur génération profil-manifest.json :", error.message);
        return;
      }

      if (stdout) process.stdout.write(stdout);
      if (stderr) process.stderr.write(stderr);
    });
  }, 150);
}

console.log("Surveillance automatique des avatars Camelio activée.");
generateManifest();

for (const folder of watchedFolders) {
  if (!fs.existsSync(folder)) {
    console.warn(`Dossier introuvable, surveillance ignorée : ${folder}`);
    continue;
  }

  fs.watch(folder, { persistent: true }, (eventType, filename) => {
    if (!filename) return;
    generateManifest();
  });
}

const viteCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const vite = spawn(viteCommand, ["vite"], {
  cwd: root,
  stdio: "inherit",
  shell: false,
});

vite.on("exit", (code) => {
  process.exit(code || 0);
});

process.on("SIGINT", () => {
  vite.kill("SIGINT");
  process.exit(0);
});
