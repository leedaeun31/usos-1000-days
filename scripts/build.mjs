import { cp, mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
for (const file of ["index.html", "app.js", "style.css"]) {
  await readFile(join(root, "public", file));
}
await mkdir(join(root, "dist"), { recursive: true });
await cp(join(root, "public"), join(root, "dist"), { recursive: true });
console.log("UsOS build complete: dist/");
