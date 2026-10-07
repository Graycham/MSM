// Persona prompts, embedded into the bundle at build time.
import agni from "../../persona/agni.md";
import blibdoolpoolp from "../../persona/blibdoolpoolp.md";
import chronos from "../../persona/chronos.md";
import gaia from "../../persona/gaia.md";
import nyxara from "../../persona/nyxara.md";
import world from "../../persona/world.md";
import { extractSystemPrompt } from "./helpers.js";

export const PERSONAS = Object.fromEntries(
  Object.entries({ agni, blibdoolpoolp, chronos, gaia, nyxara }).map(([id, doc]) => [id, extractSystemPrompt(doc)]),
);

/** Campaign lore shared by every god. */
export const WORLD = extractSystemPrompt(world);
