// The pantheon players can commune with. Persona prompts live in persona/*.md;
// this file only holds the details the module needs to route and display.

export const GODS = {
  blibdoolpoolp: {
    name: "Blibdoolpoolp",
    title: "The Mad Sea Mother",
    domains: "Madness, Sea, Chaos",
    commands: ["msm", "offer", "blibdoolpoolp", "blib"],
    stirring: "The water stirs…",
    silence: "The sea is silent. The offering sinks, unanswered.",
  },
  agni: {
    name: "Agni",
    title: "The Humble Axeman",
    domains: "Fire, Warmth, Justice",
    commands: ["agni"],
    stirring: "The embers brighten…",
    silence: "The fire gutters low. No answer comes.",
  },
  nyxara: {
    name: "Nyxara",
    title: "The Veiled Shadow",
    domains: "Death, Shadow, Secrets",
    commands: ["nyxara"],
    stirring: "The shadows deepen…",
    silence: "Only silence answers from the dark.",
  },
  gaia: {
    name: "Gaia",
    title: "Nature's Shepherd",
    domains: "Nature, Balance, Life",
    commands: ["gaia", "gia"],
    stirring: "The leaves begin to rustle…",
    silence: "The earth is still. No answer comes.",
  },
  chronos: {
    name: "Chronos",
    title: "The Timekeeper",
    domains: "Time, Fate, Destiny",
    commands: ["chronos"],
    stirring: "Somewhere, an hourglass turns…",
    silence: "The moment passes, unanswered.",
  },
};

export const DEFAULT_PLEDGES = "Fiddle: Blibdoolpoolp; Durzo: Nyxara; Gideon: Nyxara, Gaia; Ulrick: Agni; D.E.R.E.K: Chronos";

/** Find a god by command or name, ignoring case. */
export function findGod(word) {
  const w = word.toLowerCase();
  return Object.keys(GODS).find((id) => id === w || GODS[id].commands.includes(w)) ?? null;
}
