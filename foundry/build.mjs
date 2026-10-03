// Builds the Foundry module into dist/mad-sea-mother, ready to copy into
// Foundry's Data/modules folder.
import { build } from "esbuild";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(root, "dist", "mad-sea-mother");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

await build({
  entryPoints: [join(here, "src", "main.js")],
  outfile: join(out, "scripts", "main.js"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  // The persona markdown is embedded into the bundle as a string.
  loader: { ".md": "text" },
  logLevel: "info",
});

cpSync(join(here, "module.json"), join(out, "module.json"));
cpSync(join(here, "styles"), join(out, "styles"), { recursive: true });

console.log(`Module built at ${out}`);
