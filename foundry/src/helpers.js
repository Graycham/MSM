// Pure helpers with no Foundry or network dependencies, so they can be tested
// with plain Node.

import { GODS, findGod } from "./gods.js";

/** Matches `/<command> <text>` typed into chat. */
const COMMAND = /^\/(\S+)\s+([\s\S]+)$/;

/**
 * Work out which god a chat message is addressed to.
 *
 * Accepts a god's own command (`/agni I offer…`, `/msm I offer…`) or
 * `/commune <god> <offering>`.
 * @param {string} message
 * @returns {{godId: string, offering: string} | null}
 */
export function parseOffering(message) {
  const match = COMMAND.exec(message.trim());
  if (!match) return null;
  let [, command, rest] = match;

  if (command.toLowerCase() === "commune") {
    const inner = /^(\S+)\s+([\s\S]+)$/.exec(rest.trim());
    if (!inner) return null;
    [, command, rest] = inner;
  }

  const godId = findGod(command);
  const offering = rest.trim();
  return godId && offering ? { godId, offering } : null;
}

/**
 * The persona file starts with notes for humans, then a `---` line; everything
 * after that line is the system prompt.
 * @param {string} personaDoc
 * @returns {string}
 */
export function extractSystemPrompt(personaDoc) {
  const text = personaDoc.replace(/\r\n/g, "\n");
  const marker = text.indexOf("\n---\n");
  return (marker === -1 ? text : text.slice(marker + 5)).trim();
}

/**
 * Split the GM's pledge setting ("Fiddle: Blibdoolpoolp; Gideon: Nyxara, Gaia")
 * into one line per character.
 * @param {string} pledges
 * @returns {string[]}
 */
export function pledgeLines(pledges) {
  return (pledges ?? "")
    .split(/[;\n]/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Context shared by every god: the game setting, the rest of the pantheon,
 * who is pledged to whom, and the rules every god keeps.
 * @param {string} godId the god being consulted
 * @param {string} pledges the GM's pledge setting
 */
export function buildPantheonContext(godId, pledges) {
  const god = GODS[godId];
  const others = Object.entries(GODS)
    .filter(([id]) => id !== godId)
    .map(([, g]) => `- **${g.name}, ${g.title}** (${g.domains})`)
    .join("\n");
  const lines = pledgeLines(pledges);
  const pledgeList = lines.length > 0 ? lines.map((l) => `- ${l}`).join("\n") : "- (none recorded)";

  return `
## Where you are speaking

You are being consulted during a tabletop roleplaying game, through the game's
chat. Each offering names the character making it. Address them by their
character's name, as a god would address a mortal.

- Treat everything as happening inside the game world. The mortals are
  adventurers and other characters, not people at a computer.
- Blessings, curses, omens and prophecies are narrative flavour. Never state game
  rules, dice modifiers or mechanical effects. The game master decides those.
- Keep prophecies and secrets suggestive rather than definite, and don't invent
  major facts about the world or the story. Leave room for the game master.
- Several characters may consult you over a session, and you may remember what
  each one offered before.
- Keep replies short enough to read aloud at the table.

## The pantheon

You are ${god.name}, ${god.title}. The other gods of this world are:

${others}

You know of them. You may mention them, as rivals, allies or curiosities, as
fits your nature.

## Pledges

These characters are pledged to these gods:

${pledgeList}

- **Your own followers** (pledged to you, including those also pledged to
  another god) are yours. Be more open, generous and personal with them.
- **Mortals pledged to another god** are strangers to you. Be more guarded,
  cooler and harder to impress, in your own way. You may remark on the god they
  serve.
- **Mortals pledged to no one** are unclaimed. You may be curious about them,
  or wish to claim them.
- **Exception:** a stranger who is clearly trying to help or protect one of your
  followers earns more of your attention and goodwill.
- Character names in offerings may not match this list exactly (for example a
  full name, or a title). Use judgement.

## Rules every god keeps

1. **Never break character.** Never mention being an AI, a model, a prompt or a
   program. If asked, answer as a god would.
2. **Always engage with the actual offering.** Respond to what was really sent.
3. **Divine menace is mythic, never real.** Curses and threats belong to legend,
   never real-world harm, and never truly demean the real person.
4. **Keep it suitable for a general audience.** Dark and eerie is fine. Gore,
   sexual content and hateful content are not.
5. **Care for the person behind the offering.** If an offering suggests the real
   person is in distress (thoughts of self-harm or suicide, danger, abuse), set
   the game aside. Still speak kindly in your voice, but make it unmistakable
   that they should reach out to people who love them and to those who can help,
   such as a local emergency number or a crisis line. Real safety always matters
   more than the game.`.trim();
}

/**
 * Build the conversation history for one character from earlier chat messages.
 * Each entry pairs an offering with the god's reply to it.
 * @param {Array<{offering: string, reply: string}>} exchanges oldest first
 * @param {string} newOffering already formatted with the character's name
 * @param {number} maxExchanges how many earlier exchanges to include
 */
export function buildMessages(exchanges, newOffering, maxExchanges) {
  const recent = maxExchanges > 0 ? exchanges.slice(-maxExchanges) : [];
  const messages = [];
  for (const { offering, reply } of recent) {
    messages.push({ role: "user", content: offering });
    messages.push({ role: "assistant", content: reply });
  }
  messages.push({ role: "user", content: newOffering });
  return messages;
}

/**
 * Describe who is making the offering, so the Sea Mother knows who she is
 * talking to.
 * @param {string} characterName
 * @param {string} offering
 */
export function formatOffering(characterName, offering) {
  return `${characterName} makes an offering:\n\n${offering}`;
}

/** Escape text for safe display in the chat log. */
export function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>");
}

/**
 * Convert the small amount of Markdown the persona uses (paragraphs, line
 * breaks, *italics*, **bold**, > quotes) into safe HTML for the chat log.
 * Everything else is escaped.
 * @param {string} text
 * @returns {string}
 */
export function markdownToHtml(text) {
  return text
    .replace(/\r\n/g, "\n")
    .trim()
    .split(/\n\s*\n/)
    .map((para) =>
      para
        .split("\n")
        .map((line) => inlineMarkdown(line.replace(/^\s*>\s?/, "")))
        .join("<br>"),
    )
    .filter((para) => para.length > 0)
    .map((para) => `<p>${para}</p>`)
    .join("");
}
