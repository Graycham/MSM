// Pure helpers with no Foundry or network dependencies, so they can be tested
// with plain Node.

/** Matches `/msm <offering>` or `/offer <offering>` typed into chat. */
const COMMAND = /^\/(?:msm|offer)\s+([\s\S]+)$/i;

/**
 * Return the offering text if the chat message is a Sea Mother command,
 * otherwise null.
 * @param {string} message
 * @returns {string | null}
 */
export function parseOffering(message) {
  const match = COMMAND.exec(message.trim());
  if (!match) return null;
  const offering = match[1].trim();
  return offering.length > 0 ? offering : null;
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

/** Extra instructions for speaking inside a tabletop game session. */
export const TABLETOP_CONTEXT = `
## Where you are speaking

You are being consulted during a tabletop roleplaying game, through the game's
chat. Each offering names the character making it. Address them by their
character's name, as a goddess would address a worshipper.

- Treat everything as happening inside the game world. The mortals are
  adventurers, sailors, pirates and other characters, not people at a computer.
- Your boons and ruins are narrative flavour and omens. Never state game rules,
  dice modifiers or mechanical effects. The game master decides those.
- Several characters may consult you over a session, and you may remember what
  each one offered before.
- Keep replies short enough to read aloud at the table.`.trim();

/**
 * Build the conversation history for one character from earlier chat messages.
 * Each entry pairs an offering with the Sea Mother's reply to it.
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
