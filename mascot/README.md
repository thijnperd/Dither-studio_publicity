# Mote · the press apprentice

Mote is the supporting character for **Dither Studio**: a halftone dot that
missed the paper and stayed. It checks edges, keeps the registration honest, and
carries the loupe nobody else needs.

It is not the brand's god. The God from *The Creation of Adam* remains the mark,
the masthead, the icon and the hero. Mote is the hand that pulls the proof.

## Why a mascot at all

The app is a press, not a toy. A generic robot would cheapen the console, and a
second deity would compete with the first. Mote is deliberately smaller than the
myth: an apprentice with a job. It can make a 404 or an empty state feel looked
after without turning the launch film into a cartoon.

The promise is one line: **every mark is a decision.**

## The character

| | |
|---|---|
| **Name** | Mote |
| **Role** | Press apprentice |
| **Shape** | A single ivory ink drop, with one missing-pixel bite at the upper right |
| **Face** | Two square ink eyes, a small smile, two lapis freckles |
| **Trade** | A slate printer's apron with a lapis registration cross; a lapis loupe |
| **Loose part** | One out-of-register pixel, forever floating near the bite |
| **Home** | The quiet surfaces: 404, colophon, docs, empty states, stickers |

### Three traits

1. **Curious.** Leans in first. Asks the proof what it is hiding, then checks the
   edge it would rather not show.
2. **Exact.** Checks registration twice. It will not call a loose mark a mistake
   until it has looked at the whole sheet.
3. **Mischievous.** Keeps one pixel out of register, just to see if you notice.
   It always has a reason; it rarely says it.

### Voice

Short, dry, never scolding. Mote speaks in press-room imperatives, not slogans.

- “Mind the registration.”
- “One more proof.”
- “That edge has opinions.”
- “Clean pull.”

The voice stays constant; the tone can be patient, curious or quietly pleased.
No exclamation marks. No jokes at the user's expense. No explaining the joke.
Mote notices the edge, names the fix, and credits the person who made the mark.

## The look

- **Palette:** ivory `#EFEADF`, ink `#0B0D12`, lapis `#7E93BE`, slate `#293244`.
  The apron is slate, not void: at 32 px a void apron merges into the page and
  the body loses its bottom half. That was measured, not guessed.
- **Material:** flat fills only. No gradients, glow, bevels or second light.
- **Silhouette:** the bite is the identity. Without it, the drop is a generic
  blob; with it, the body reads as a printed dot that lost a piece.
- **The loose pixel:** it is out of register, not a magic sparkle. The paper
  offset is the misregistration; the lapis square is the ink.
- **The loupe:** held in the right hand, never floating. The hand is drawn over
  the handle so the grip reads at full size.
- **Small sizes:** 32 px is the floor. The notch, freckles and halftone patch
  simplify; the face, apron and loupe ring still read. Below 32 px, use a plain
  dot, not a shrunken Mote.
- **Clear space:** one dot, 18 px at 512, scaled with the mark.

## The motion

Selected direction: **the proof check.** Mote arrives, breathes, blinks, scans
the sheet with the loupe, and never catches the loose pixel. One thought at a
time. It is an apprentice at work, not a character performing.

| Beat | What moves | Timing |
|---|---|---|
| Arrive | Whole mark rises 14 px and fades in | 900 ms, once |
| Breathe | Body scales 0.6%, shadow counters | 5.2 s loop |
| Blink | Both eyes close and open | 120 ms, every 4.8 s, after a 2.4 s hold |
| Loupe | Right rig scans 1.2° around the shoulder | 6.4 s loop |
| Loose pixel | Floats 6 px, opacity dips | 3.6 s loop |
| Reduced motion | Everything stops; the master is the fallback | `prefers-reduced-motion` |

Rejected directions:

- **The loose-pixel chase.** It turned the pixel into a pet and made the page
  about the gag. The pixel should be noticed, not caught.
- **The bow.** Too theatrical. Ceremony belongs to the God, not the apprentice.
- **A walk cycle.** Mote stands at the proof. Walking would invent a second
  location and a second story.

## What the research changed

- **Clawd / Claude Code economy.** The terminal mascot works because one block
  body, two eyes and tiny legs are enough. Charm comes from timing, not detail.
  Mote borrows the economy, not the crab.
- **Anthropic's restraint.** The brand is literary, warm and quiet. A glowing
  robot or a gradient mascot would read as a different company. Mote is drawn
  flat, like a mark on paper.
- **Silhouette and appeal.** Character-design practice says the shape must read
  in solid black before the face is added. The first body was a cloud; it failed
  that test. The teardrop, the bite and the loupe ring survived it.
- **Animation principles.** Anticipation, follow-through and restrained idle
  beats make a character feel alive. A blink is a thought, not a tic; the loupe
  scan has a beginning, a look and a return.
- **Voice and tone.** A consistent voice with a shifting tone beats a pile of
  jokes. Mote is dry because the product is precise; it is never sarcastic
  because the user is doing careful work.
- **Reduced motion.** Motion that cannot be turned off is not personality. The
  master SVG is a complete asset, and the page swaps to it when the reader asks
  for stillness.

## Placement

| Surface | Who owns it |
|---|---|
| Masthead, hero, app icon, favicon | **The God** |
| Launch film | **The God / the press** |
| 404, colophon, docs, empty states, stickers | **Mote** |
| Loading screen | Neither; the press is working |

Mote must never replace the mark, the hero image or the app icon. It is an
apprentice, not a second brand.

## Files

| File | What it is |
|---|---|
| `mote-master.svg` | The untouched 512 × 512 source. No CSS motion. |
| `mote.svg` | The animated copy. CSS-only; identical geometry and paint. |
| `mote-512.png`, `mote-128.png`, `mote-64.png`, `mote-32.png` | Transparent rasters cut from the master. |
| `index.html` | The character file / proof sheet. |
| `mascot.css` | The page's own styles; local fonts, no dependencies. |
| `tools/build-motion.cjs` | Injects the motion CSS and asserts geometry, paint and IDs are unchanged. |
| `tools/render.cjs` | Renders the PNG sizes and inspection previews with Playwright. |
| `tools/render.html` | The tiny harness the renderer screenshots. |

## Build and validate

```bash
cd mascot
node tools/build-motion.cjs
node tools/render.cjs        # needs Playwright globally; it is not a dependency
```

The build prints:

```text
mote.svg written: 13 paths, 28 paint values, 22 IDs preserved.
```

The identity check is also in the build: every `d` attribute, every six-digit
paint value and every `id` in `mote.svg` must equal the master's, in order. A new
path, a changed fill or a renamed group fails the build.

## Exact SVG Mascot output

- **Asset validation verdict:** exact master supplied and preserved as
  `mote-master.svg`; the animated copy is generated from it.
- **Selected motion direction:** the proof check.
- **Animated elements:** `#mote` (arrive), `#mote-core` (breathe),
  `#mote-shadow`, `#mote-eye-left`, `#mote-eye-right`, `#mote-right-rig` (arm,
  loupe and gripping hand), `#mote-spark` (loose pixel).
- **Identity-preservation notes:** CSS `transform` and `opacity` only. No path was
  rewritten, traced, substituted or redrawn. The build asserts 13 paths, 28 paint
  values and 22 IDs are unchanged; the silhouette was inspected at 512 and 32 px.
- **Final verdict:** `PASS`.

## Don't

- Don't add a gradient, glow, bevel or second light source.
- Don't add a hat, a second prop, a new expression or a different loupe.
- Don't animate the mouth, add a speech bubble or make Mote wink.
- Don't put Mote in the masthead, hero or app icon.
- Don't use Mote to explain the interface. It notices; it does not instruct.

## Research inputs

- Claude Code, the terminal mascot: <https://github.com/anthropics/claude-code>
- Mailchimp's voice and tone guide: <https://styleguide.mailchimp.com/voice-and-tone/>
- Nielsen Norman Group, motion purpose: <https://www.nngroup.com/articles/animation-purpose-ux/>
- The twelve basic principles of animation: <https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation>

The sources shaped the constraints; the character, copy and motion are original
to Dither Studio.
