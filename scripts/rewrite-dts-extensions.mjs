import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const distDir = new URL("../dist/", import.meta.url);
const distPath = distDir.pathname;

for (const file of readdirSync(distPath)) {
  if (!file.endsWith(".d.ts")) continue;
  const full = join(distPath, file);
  const src = readFileSync(full, "utf8");
  const rewritten = src.replace(/(from\s+["'])(\.[^"']*?)\.ts(["'])/g, "$1$2.js$3");
  if (rewritten !== src) writeFileSync(full, rewritten);
}
