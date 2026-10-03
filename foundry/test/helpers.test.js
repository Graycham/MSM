import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  buildMessages,
  extractSystemPrompt,
  formatOffering,
  markdownToHtml,
  parseOffering,
} from "../src/helpers.js";

test("parseOffering recognises /msm and /offer", () => {
  assert.equal(parseOffering("/msm a shiny pearl"), "a shiny pearl");
  assert.equal(parseOffering("/OFFER  a song\nwith two lines "), "a song\nwith two lines");
  assert.equal(parseOffering("/msm"), null);
  assert.equal(parseOffering("/msmx hello"), null);
  assert.equal(parseOffering("hello /msm there"), null);
});

test("extractSystemPrompt drops the human notes above the --- line", () => {
  const doc = readFileSync(new URL("../../persona/mad_sea_mother.md", import.meta.url), "utf8");
  const prompt = extractSystemPrompt(doc);
  assert.ok(prompt.startsWith("You are **Blibdoolpoolp**"));
  assert.ok(!prompt.includes("persona prompt"));
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

test("markdownToHtml handles the persona's formatting and escapes HTML", () => {
  assert.equal(
    markdownToHtml("WHAT is *this*?\n**Boon:** dry socks.\n\n> *sung softly*\n> line two"),
    "<p>WHAT is <em>this</em>?<br><strong>Boon:</strong> dry socks.</p><p><em>sung softly</em><br>line two</p>",
  );
  assert.equal(markdownToHtml("<script>alert(1)</script>"), "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>");
  assert.equal(markdownToHtml("*click… click…* yes"), "<p><em>click… click…</em> yes</p>");
});
