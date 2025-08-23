// scripts/postbuild-guard.mjs
import { rmSync, existsSync, readdirSync, readFileSync, writeFileSync, statSync } from "fs";
import { join } from "path";

const dist = "dist";
const forbid = [
  "public",                 // duplicado incorrecto
  ".htaccess",
  "debug-keyboard.html",
  "debug-tracking.html",
  "debug-tracking-advanced.html",
  "debug-tracking-post-deploy.html",
  "debug-tracking-simple.html",
  "verificacion-post-deploy.js",
  "Cobertura Vita365 - Zinha.pdf",
  "llms.txt"
];

const mustExist = [
  "index.html",
  // Usa solo uno de estos dos:
  "tracking.html" // si eliges archivo único
  // "tracking/index.html" // si eliges carpeta
];

// 1) Prohibir dist/public
if (existsSync(join(dist, "public"))) {
  throw new Error("❌ No debe existir dist/public. Revisa copias/plug-ins que lo generen.");
}

// 2) Borrar archivos prohibidos si existen
for (const f of forbid) {
  const p = join(dist, f);
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log("🧹 Removed:", f);
  }
}

// 3) Verificar indispensables
for (const f of mustExist) {
  const p = join(dist, f);
  if (!existsSync(p)) {
    throw new Error(`❌ Falta indispensable en dist: ${f}`);
  }
}

// 4) Enforce uno solo para tracking (archivo o carpeta, no ambos)
const fileTracking = existsSync(join(dist, "tracking.html"));
const dirTracking  = existsSync(join(dist, "tracking", "index.html"));
if (fileTracking && dirTracking) {
  throw new Error("❌ Hay DOS trackings (tracking.html y tracking/index.html). Deja uno solo.");
}
if (!fileTracking && !dirTracking) {
  throw new Error("❌ No existe tracking.html ni tracking/index.html en dist.");
}

// 5) Si existe tracking-module.js de 0 bytes, eliminar (ruido)
const mod = join(dist, "tracking-module.js");
if (existsSync(mod) && statSync(mod).size === 0) {
  rmSync(mod, { force: true });
  console.log("🧹 Removed: tracking-module.js (0 bytes)");
}

// 6) Inyectar marca de build en tracking
const stamp = new Date();
const tag = `<!-- BUILD:tracking-${stamp.getFullYear()}${String(stamp.getMonth()+1).padStart(2,"0")}${String(stamp.getDate()).padStart(2,"0")}-${String(stamp.getHours()).padStart(2,"0")}${String(stamp.getMinutes()).padStart(2,"0")} -->`;
const targets = fileTracking ? [join(dist, "tracking.html")] : [join(dist, "tracking", "index.html")];
for (const t of targets) {
  const html = readFileSync(t, "utf8");
  if (!html.includes("BUILD:tracking-")) {
    writeFileSync(t, html.replace("</body>", `${tag}\n</body>`), "utf8");
    console.log("🏷️  Build tag injected in", t);
  } else {
    // Actualiza sello si ya existía
    const updated = html.replace(/<!-- BUILD:tracking-[\d-]+ -->/g, tag);
    writeFileSync(t, updated, "utf8");
    console.log("🏷️  Build tag updated in", t);
  }
}

// 7) Recordatorio sobre netlify.toml vs _redirects
const hasToml = existsSync(join(dist, "netlify.toml"));
const hasRedirects = existsSync(join(dist, "_redirects"));
if (hasToml && hasRedirects) {
  console.warn("⚠️ Existen netlify.toml y _redirects. Netlify prioriza toml. Recomiendo eliminar _redirects.");
}

console.log("✅ Postbuild limpio y verificado.");
