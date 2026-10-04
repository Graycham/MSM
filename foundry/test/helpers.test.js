import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { DEFAULT_PLEDGES, GODS, findGod } from "../src/gods.js";
import {
  buildMessages,
  buildPantheonContext,
  extractSystemPrompt,
  formatOffering,
  markdownToHtml,
  parseOffering,
  pledgeLines,
} from "../src/helpers.js";

test("parseOffering routes each god's command", () => {
  assert.deepEqual(parseOffering("/msm a shiny pearl"), { godId: "blibdoolpoolp", offering: "a shiny pearl" });
  assert.deepEqual(parseOffering("/OFFER  a song\nwith two lines "), { godId: "blibdoolpoolp", offering: "a song\nwith two lines" });
  assert.deepEqual(parseOffering("/agni bread"), { godId: "agni", offering: "bread" });
  assert.deepEqual(parseOffering("/Nyxara a coin"), { godId: "nyxara", offering: "a coin" });
  assert.deepEqual(parseOffering("/gia a seed"), { godId: "gaia", offering: "a seed" });
  assert.deepEqual(parseOffering("/chronos a record"), { godId: "chronos", offering: "a record" });
});

test("parseOffering supports /commune <god>", () => {
  assert.deepEqual(parseOffering("/commune Gaia an acorn"), { godId: "gaia", offering: "an acorn" });
  assert.equal(parseOffering("/commune Gaia"), null);
  assert.equal(parseOffering("/commune Zeus thunder"), null);
});

test("parseOffering ignores other chat", () => {
  assert.equal(parseOffering("/msm"), null);
  assert.equal(parseOffering("/msmx hello"), null);
  assert.equal(parseOffering("/w Gideon psst"), null);
  assert.equal(parseOffering("hello /agni there"), null);
});

test("every god has a persona file whose prompt starts with their name", () => {
  for (const [id, god] of Object.entries(GODS)) {
    const doc = readFileSync(new URL(`../../persona/${id}.md`, import.meta.url), "utf8");
    const prompt = extractSystemPrompt(doc);
    assert.ok(prompt.startsWith(`You are **${god.name}**`), id);
    assert.ok(!prompt.includes("persona prompt"), id);
  }
});

test("findGod matches names and commands case-insensitively", () => {
  assert.equal(findGod("BLIB"), "blibdoolpoolp");
  assert.equal(findGod("Chronos"), "chronos");
  assert.equal(findGod("zeus"), null);
});

test("pledgeLines splits the setting", () => {
  assert.deepEqual(pledgeLines(DEFAULT_PLEDGES), [
    "Fiddle: Blibdoolpoolp",
    "Durzo: Nyxara",
    "Gideon: Nyxara, Gaia",
    "Ulrick: Agni",
    "D.E.R.E.K: Chronos",
  ]);
  assert.deepEqual(pledgeLines(""), []);
  assert.deepEqual(pledgeLines(undefined), []);
});

test("buildPantheonContext names the god, the others and the pledges", () => {
  const ctx = buildPantheonContext("agni", DEFAULT_PLEDGES);
  assert.ok(ctx.includes("You are Agni, The Humble Axeman"));
  assert.ok(ctx.includes("**Nyxara, The Veiled Shadow**"));
  assert.ok(!ctx.includes("**Agni, The Humble Axeman**"));
  assert.ok(ctx.includes("- Ulrick: Agni"));
  assert.ok(buildPantheonContext("gaia", "").includes("(none recorded)"));
});

test("buildMessages keeps only the most recent exchanges", () => {
  const exchanges = [1, 2, 3].map((n) => ({ offering: `o${n}`, reply: `r${n}` }));
  assert.deepEqual(buildMessages(exchanges, "new", 2), [
    { role: "user", content: "o2" },
    { role: "assistant", content: "r2" },
    { role: "user", content: "o3" },
    { role: "assistant", content: "r3" },
    { role: "user", content: "new" },
  ]);
  assert.deepEqual(buildMessages(exchanges, "new", 0), [{ role: "user", content: "new" }]);
});

test("formatOffering names the character", () => {
  assert.equal(formatOffering("Captain Rook", "a gold coin"), "Captain Rook makes an offering:\n\na gold coin");
});

test("markdownToHtml handles the personas' formatting and escapes HTML", () => {
  assert.equal(
    markdownToHtml("WHAT is *this*?\n**Boon:** dry socks.\n\n> *sung softly*\n> line two"),
    "<p>WHAT is <em>this</em>?<br><strong>Boon:</strong> dry socks.</p><p><em>sung softly</em><br>line two</p>",
  );
  assert.equal(markdownToHtml("<script>alert(1)</script>"), "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  assert.equal(markdownToHtml("*click… click…* yes"), "<p><em>click… click…</em> yes</p>");
});
