# MSM — Mad Sea Mother

> *"Bring me your offerings, little drowned thing. A picture, a scrap of words, a song half-remembered — the tide takes all of it, and I answer."*

MSM is an experiment in **agentic AI workflows**. You submit an offering, which can be an
**image**, some **text** or a **song**, and the agent replies in the persona of the
**Mad Sea Mother**, Blibdoolpoolp: the chaotic goddess of madness, the sea and
chaos, who is as likely to grant a boon as to bring ruin.

This is a learning project and my first go at building an agent, so expect the
design below to change as it develops.

## What it should do

| You submit | The Mad Sea Mother… |
|------------|---------------------|
| 🖼️ **An image** | Looks at it through the murk and tells you what the sea sees in it: omens, drowned memories, things that belong to her. |
| 📝 **Text** | Reads your words like a message in a bottle and answers it in her voice, with riddles, prophecy, scorn or lullaby. |
| 🎵 **A song** | Listens to the lyrics and the mood and answers in kind, maybe with a verse of her own sung back from the deep. |

Every reply should stay in character: her voice, her moods and her mythology stay
consistent from one exchange to the next.

## How it's intended to work

```
  ┌────────────┐     ┌──────────────────┐     ┌──────────────────────┐     ┌──────────┐
  │  Offering  │ ──▶ │  Input handling  │ ──▶ │  Agent (LLM + tools) │ ──▶ │  Reply   │
  │ image/text │     │  detect type,    │     │  persona prompt,     │     │  in the  │
  │   /song    │     │  preprocess      │     │  memory, reasoning   │     │  voice   │
  └────────────┘     └──────────────────┘     └──────────────────────┘     └──────────┘
```

1. **Input handling:** works out what kind of offering arrived and prepares it.
   - *Images* go straight to a multimodal (vision-capable) model.
   - *Text* is passed through as is.
   - *Songs*: many LLMs can't take raw audio, so a song will probably arrive as
     lyrics, or as audio that is first transcribed to text (and maybe analysed for
     tempo or mood) before it reaches the agent.
2. **Persona:** a system prompt defines who the Mad Sea Mother is, including her
   voice, temperament, lore and the rules she never breaks.
3. **Agent loop:** the model reasons about the offering and can call tools, such as
   transcription, image description or recalling past offerings, before it answers.
4. **Memory (planned):** she remembers what you've given her before and brings it
   up again.

## The persona

**Blibdoolpoolp, the Mad Sea Mother.** Domain: Madness, Sea, Chaos.

- **Form:** a monstrous sea creature, part humanoid, part sea serpent and part
  crustacean, as vast and unfathomable as the ocean depths.
- **Symbols:** a trident, a spiralling shell, a wave.
- **Followers:** outcasts, pirates and the mad-touched. Her priests perform erratic
  rituals in hidden sea-cave temples, and sailors pray to appease her.
- **Personality:** chaotic and mercurial. Very mad, but she always knows exactly
  what she is doing.
- **Extremes only:** she cares nothing for the mundane. Really good or really bad
  offerings make her commune fully and grant a boon or bring ruin. Ordinary ones get
  a bored line or two.
- **Rules:** she never breaks character, always engages with the actual offering,
  and keeps her curses mythic rather than harmful.

The full prompt the agent uses is in [`persona/mad_sea_mother.md`](persona/mad_sea_mother.md).

## Project status

🌊 **Early days, but she speaks.** Players can already commune with her in Foundry VTT.

- [x] Choose the stack: JavaScript, Claude via the Anthropic API
- [x] Write the Mad Sea Mother system prompt
- [x] Text in → in-character reply out, inside Foundry VTT chat
- [x] Memory of each character's earlier offerings (within the chat log)
- [ ] Add image offerings
- [ ] Add song offerings (lyrics first, then audio transcription)

## Foundry VTT module

The `foundry/` folder is a Foundry VTT module (v12 and v13). Players type an offering
into the chat and Blibdoolpoolp answers in the chat log:

```
/msm I offer the skull of the drowned captain
/offer a sea shanty: "Haul away, boys, haul away…"
```

### How it works

1. A player types `/msm <offering>` (or `/offer <offering>`). The module posts it to
   chat as an offering from their character.
2. The **GM's browser** picks it up and sends it to Claude together with the persona
   prompt, a note that she is speaking in a tabletop game, and that character's
   recent offerings and replies (her memory).
3. "*The water stirs…*" appears, then is replaced with her answer.

Only the GM's browser holds the API key and calls the API, so **a GM must be logged
in** for her to answer. Players never see the key.

### Setup

You need [Node.js](https://nodejs.org/) to build the module, and an
[Anthropic API key](https://console.anthropic.com/).

```bash
npm install
npm run build
```

This creates `dist/mad-sea-mother/`. Copy that folder into your Foundry user data's
`Data/modules/` folder, then in Foundry:

1. Enable **Mad Sea Mother** under *Manage Modules* in your world.
2. As the GM, open *Configure Settings → Module Settings* and paste your API key.
3. Type `/msm hello, Mother` in chat.

### Settings (GM only)

| Setting | What it does | Default |
|---------|--------------|---------|
| Anthropic API key | Stored in the GM's browser only | (empty) |
| Claude model | Opus 5.5 (best), Sonnet 5.5 or Haiku 4.5 (cheapest, good for testing) | Opus 5.5 |
| Effort | How hard she thinks: higher is slower and costs more | Medium |
| Memory | How many earlier offerings per character she remembers | 6 |
| Private communion | Whisper offerings and replies between the player and GMs | Off |

**Costs:** every offering is a paid API call to your Anthropic account. Short
offerings cost roughly 1–5 US cents each with the default settings, depending on
effort and memory. You can set a spending limit in the Anthropic Console.

### Development

- Edit the persona in [`persona/mad_sea_mother.md`](persona/mad_sea_mother.md). It is
  built into the module, so run `npm run build` again after changing it.
- Module code lives in `foundry/src/`, and `npm test` runs the unit tests.

## Contributing

This is a personal learning project, but ideas and suggestions are welcome. Open
an issue if the sea speaks to you.
