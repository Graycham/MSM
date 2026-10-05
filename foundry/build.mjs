// Builds the Foundry module into dist/mad-sea-mother, ready to copy into
// Foundry's Data/modules folder.
import { build } from "esbuild";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

// Point Foundry at GitHub Releases so it can install and update the module
// from a manifest URL. The release workflow publishes these files.
const RELEASES = "https://github.com/Graycham/MSM/releases";
const manifest = JSON.parse(readFileSync(join(here, "module.json"), "utf8"));
manifest.manifest = `${RELEASES}/latest/download/module.json`;
manifest.download = `${RELEASES}/download/v${manifest.version}/mad-sea-mother.zip`;
writeFileSync(join(out, "module.json"), `${JSON.stringify(manifest, null, 2)}\n`);
cpSync(join(here, "styles"), join(out, "styles"), { recursive: true });

console.log(`Module built at ${out}`);
