# MSM — Mad Sea Mother

> *"Bring me your offerings, little drowned thing. A picture, a scrap of words, a song half-remembered — the tide takes all of it, and I answer."*

MSM is an experiment in **agentic AI workflows**. You submit an offering, which can be an
**image**, some **text** or a **song**, and the agent replies in the persona of the
**Mad Sea Mother**: an ancient, unpredictable spirit of the deep who is sometimes
tender, sometimes furious, and never entirely sane.

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

## The persona (draft)

- **Voice:** archaic and tidal. She rolls between whispering and roaring.
- **Moods:** maternal, wrathful, mournful, playful, often within the same reply.
- **Themes:** salt, storms, drowned sailors, lost things, the moon, the patience of water.
- **Rules:** she never breaks character, never admits to being a program, and
  always treats what you submit as an *offering*.

## Project status

🌊 **Early days.** The repository has been set up and this README describes where
it's heading. Planned next steps:

- [ ] Choose the language/stack and the LLM provider
- [ ] Write the Mad Sea Mother system prompt
- [ ] Text in → in-character reply out (the simplest working loop)
- [ ] Add image offerings
- [ ] Add song offerings (lyrics first, then audio transcription)
- [ ] Add memory of past offerings
- [ ] A simple interface (CLI, then perhaps a web page)

## Getting started

Setup instructions will go here once the stack is chosen. You will almost
certainly need an API key for the model provider. Keep it in a local `.env` file,
which is already ignored by git, and **never commit it**.

## Contributing

This is a personal learning project, but ideas and suggestions are welcome. Open
an issue if the sea speaks to you.
