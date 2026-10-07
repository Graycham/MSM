// Mad Sea Mother: Foundry VTT module for communing with the gods.
//
// A player types `/<god> <offering>` (for example `/msm`, `/agni`, `/nyxara`)
// or `/commune <god> <offering>` in chat. The offering is posted to the chat
// log, and the active GM's browser sends it to Claude with that god's persona
// and the shared pantheon context, then posts the god's reply.
// Only the GM's browser holds the API key and calls the API.

import Anthropic from "@anthropic-ai/sdk";
import { DEFAULT_PLEDGES, GODS } from "./gods.js";
import { buildMessages, buildPantheonContext, escapeHtml, formatOffering, markdownToHtml, parseOffering } from "./helpers.js";
import { PERSONAS, WORLD } from "./personas.js";

const MODULE_ID = "mad-sea-mother";

// Models that accept server-side refusal fallbacks.
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-fable-5-1", "claude-opus-5", "claude-sonnet-5-5"]);
// Models that reject the `effort` setting.
const NO_EFFORT_MODELS = new Set(["claude-haiku-4-5"]);

const setting = (key) => game.settings.get(MODULE_ID, key);

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "apiKey", {
    name: "Anthropic API key",
    hint: "Only needed in the GM's browser. Stored on this computer only and never shared with players.",
    scope: "client",
    config: true,
    restricted: true,
    type: String,
    default: "",
  });

  game.settings.register(MODULE_ID, "model", {
    name: "Claude model",
    hint: "The model the gods speak through. Haiku is cheapest and good for testing; Opus writes the best replies.",
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    choices: {
      "claude-opus-5-5": "Claude Opus 5.5 (best, ~$4 / $20 per million tokens)",
      "claude-sonnet-5-5": "Claude Sonnet 5.5 (balanced, ~$2 / $10 per million tokens)",
      "claude-haiku-4-5": "Claude Haiku 4.5 (cheapest, ~$1 / $5 per million tokens)",
    },
    default: "claude-opus-5-5",
  });

  game.settings.register(MODULE_ID, "effort", {
    name: "Effort",
    hint: "How hard the gods think before answering. Higher effort is slower and costs more. Ignored by Haiku.",
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    choices: { low: "Low", medium: "Medium", high: "High" },
    default: "medium",
  });

  game.settings.register(MODULE_ID, "memory", {
    name: "Memory (earlier offerings)",
    hint: "How many of a character's earlier offerings each god remembers. 0 means none.",
    scope: "world",
    config: true,
    restricted: true,
    type: Number,
    range: { min: 0, max: 20, step: 1 },
    default: 6,
  });

  game.settings.register(MODULE_ID, "private", {
    name: "Private communion",
    hint: "Offerings and replies are whispered between the player and the GMs instead of shown to everyone.",
    scope: "world",
    config: true,
    restricted: true,
    type: Boolean,
    default: false,
  });

  game.settings.register(MODULE_ID, "pledges", {
    name: "Pledges",
    hint: "Which characters follow which gods, as 'Character: God, God' separated by semicolons. Gods are warmer to their own followers.",
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    default: DEFAULT_PLEDGES,
  });
});

/** The GM's browser is the only one that answers offerings. */
function isAnsweringClient() {
  return game.users.activeGM?.isSelf ?? false;
}

function gmIds() {
  return game.users.filter((u) => u.isGM).map((u) => u.id);
}

function whisperTargets(userId) {
  return setting("private") ? [...new Set([userId, ...gmIds()])] : [];
}

/** A stable key for "who is offering to which god", so memory is kept per character and god. */
function memoryKey(godId, message) {
  return `${godId}:${message.speaker?.actor ?? message.speaker?.alias ?? message.author?.id}`;
}

function replyHtml(godId, inner) {
  return `<div class="msm-reply msm-god-${godId}">${inner}</div>`;
}

// 1. Any client: turn `/agni ...`, `/msm ...` etc. into an offering message.
Hooks.on("chatMessage", (_chatLog, content) => {
  const parsed = parseOffering(content);
  if (parsed === null) return true;
  const god = GODS[parsed.godId];

  if (!game.users.activeGM) {
    ui.notifications.warn(`No GM is connected. ${god.name} cannot hear you.`);
    return false;
  }

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content: `<div class="msm-offering msm-god-${parsed.godId}"><span class="msm-label">An offering to ${god.name}, ${god.title}</span>${escapeHtml(parsed.offering)}</div>`,
    whisper: whisperTargets(game.user.id),
    flags: { [MODULE_ID]: { type: "offering", god: parsed.godId, text: parsed.offering } },
  });
  return false;
});

// 2. GM client only: answer each new offering.
Hooks.on("createChatMessage", async (message) => {
  const flags = message.flags?.[MODULE_ID];
  if (flags?.type !== "offering" || !isAnsweringClient()) return;
  // Offerings made before there were several gods have no god recorded.
  await answerOffering(message, flags.god ?? "blibdoolpoolp", flags.text);
});

function earlierExchanges(key, beforeMessageId) {
  const exchanges = [];
  for (const msg of game.messages.contents) {
    if (msg.id === beforeMessageId) break;
    const f = msg.flags?.[MODULE_ID];
    if (f?.type === "reply" && f.key === key && f.prompt && f.reply) {
      exchanges.push({ offering: f.prompt, reply: f.reply });
    }
  }
  return exchanges;
}

async function answerOffering(offeringMessage, godId, offering) {
  const god = GODS[godId];
  if (!god) return;
  const apiKey = setting("apiKey");
  if (!apiKey) {
    ui.notifications.error("Mad Sea Mother: set your Anthropic API key in Module Settings.");
    return;
  }

  const key = memoryKey(godId, offeringMessage);
  const characterName = offeringMessage.speaker?.alias || offeringMessage.author?.name || "A mortal";
  const prompt = formatOffering(characterName, offering);
  const whisper = whisperTargets(offeringMessage.author?.id);

  // Show that the god has heard, then fill in the reply when it arrives.
  const reply = await ChatMessage.create({
    speaker: { alias: god.name },
    content: replyHtml(godId, `<p><em>${god.stirring}</em></p>`),
    whisper,
  });

  try {
    const system = `${PERSONAS[godId]}\n\n${WORLD}\n\n${buildPantheonContext(godId, setting("pledges"))}`;
    const messages = buildMessages(earlierExchanges(key, offeringMessage.id), prompt, setting("memory"));
    const text = await askTheGod(apiKey, system, messages);
    await reply.update({
      content: replyHtml(godId, markdownToHtml(text)),
      flags: { [MODULE_ID]: { type: "reply", god: godId, key, prompt, reply: text } },
    });
  } catch (err) {
    console.error(`${MODULE_ID} |`, err);
    ui.notifications.error(`Mad Sea Mother: ${describeError(err)}`);
    await reply.update({ content: replyHtml(godId, `<p><em>${god.silence}</em></p>`) });
  }
}

async function askTheGod(apiKey, system, messages) {
  const model = setting("model");
  // The key only lives in the GM's browser, so calling from the browser is intended here.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const request = {
    model,
    max_tokens: 16000,
    ...(NO_EFFORT_MODELS.has(model) ? {} : { output_config: { effort: setting("effort") } }),
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages,
  };

  // If a safety check declines the request, let the API retry it on a fallback model.
  const response = FALLBACK_MODELS.has(model)
    ? await client.beta.messages.create({ ...request, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" })
    : await client.messages.create(request);

  if (response.stop_reason === "refusal") {
    throw new Error("the model declined to answer this offering");
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n\n")
    .trim();
  if (!text) throw new Error("the model returned an empty reply");
  return text;
}

function describeError(err) {
  if (err instanceof Anthropic.AuthenticationError) return "the API key was rejected. Check it in Module Settings.";
  if (err instanceof Anthropic.RateLimitError) return "rate limited by the API. Wait a moment and try again.";
  if (err instanceof Anthropic.APIConnectionError) return "could not reach the API. Check your internet connection.";
  if (err instanceof Anthropic.APIError) return `API error ${err.status ?? ""}: ${err.message}`;
  return err?.message ?? String(err);
}
