const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const profilDir = path.join(publicDir, "Profil");

const folders = {
  fille: {
    folder: path.join(profilDir, "Fille"),
    publicBasePath: "/Profil/Fille",
  },
  garcon: {
    folder: path.join(profilDir, "Garcon"),
    publicBasePath: "/Profil/Garcon",
  },
  mere: {
    folder: path.join(profilDir, "Parent", "Mere"),
    publicBasePath: "/Profil/Parent/Mere",
  },
  pere: {
    folder: path.join(profilDir, "Parent", "Pere"),
    publicBasePath: "/Profil/Parent/Pere",
  },
};

const validExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function listImages({ folder, publicBasePath }) {
  if (!fs.existsSync(folder)) {
    return [];
  }

  return fs
    .readdirSync(folder)
    .filter((file) => validExtensions.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }))
    .map((file) => `${publicBasePath}/${file}`);
}

const manifest = {
  fille: listImages(folders.fille),
  garcon: listImages(folders.garcon),
  mere: listImages(folders.mere),
  pere: listImages(folders.pere),
  generatedAt: new Date().toISOString(),
};

const outputPath = path.join(publicDir, "profil-manifest.json");
fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(
  `profil-manifest.json généré : ${manifest.fille.length} fille, ${manifest.garcon.length} garçon, ${manifest.mere.length} mère, ${manifest.pere.length} père`
);
