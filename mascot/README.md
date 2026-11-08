# Mote · the press apprentice

Mote is the supporting character for **Dither Studio**: one halftone dot that
missed the paper and stayed. It checks edges, keeps the registration honest, and
carries the loupe nobody else needs.

It is not the brand's god. The God from *The Creation of Adam* remains the mark,
the masthead, the icon and the hero. Mote is the hand that pulls the proof.

The promise is one line: **every mark is a decision.**

## The character

| | |
|---|---|
| **Name** | Mote |
| **Role** | Press apprentice |
| **Shape** | A tall ivory ink drop with one missing-pixel bite at the upper right |
| **Face** | Two square ink eyes, a small smile, a lapis freckle and one lapis cheek mark |
| **Trade** | A black printer's apron with a lapis registration cross and a tape label; a lapis loupe |
| **Loose part** | One out-of-register pixel, forever floating near the bite |
| **Stage** | The unlisted character sheet at `/mascot/`, on paper with one black plate |

The body is deliberately larger and simpler than the old character. The
silhouette has to survive at 32 px: the bite is the identity, the black apron is
the trade, and the loupe ring is the only tool.

### Three traits

1. **Curious.** Leans in first. Asks the proof what it is hiding, then checks the
   edge it would rather not show.
2. **Exact.** Checks registration twice. It will not call a loose mark a mistake
   until it has looked at the whole sheet.
3. **Mischievous.** Keeps one pixel out of register, just to see if you notice.
   It always has a reason; it rarely says it.

### Voice

Short, dry, never scolding. Mote speaks in press-room imperatives, not slogans.

- "Mind the registration."
- "One more proof."
- "That edge has opinions."
- "Clean pull."

No exclamation marks. No jokes at the user's expense. No explaining the joke.
Mote notices the edge, names the fix, and credits the person who made the mark.

## The look

- **Palette:** ivory `#EFEADF`, ink `#0B0D12`, lapis `#7E93BE`, press `#121722`.
  The apron is ink; the paper body and the lapis loupe keep it readable at
  thumbnail sizes. At 32 px it is a body, a dark block, a blue ring and a face.
- **Material:** flat fills only. No gradients, glow, bevels or second light.
- **Silhouette:** the bite is the identity. Without it the drop is a generic
  blob; with it the body reads as a printed dot that lost a piece.
- **The loose pixel:** it is out of register, not a magic sparkle. The paper
  square is the misregistration; the lapis square is the ink.
- **The loupe:** held in the right hand, never floating. The hand is drawn over
  the handle so the grip reads at full size.
- **Small sizes:** 32 px is the floor. The loose pixel, freckles and halftone
  patch simplify; the face, apron and loupe ring still read. Below 32 px, use a
  plain dot, not a shrunken Mote.
- **Clear space:** one dot, 18 px at 512, scaled with the mark.

The master is **640 × 640**; the earlier 512 master and its old slate apron are
gone. The new art is one body, one apron, one loupe, one loose pixel.

## The motion

The selected direction is **the proof check**: Mote arrives, breathes, blinks,
scans the sheet with the loupe, and never catches the loose pixel. One thought at
a time. It is an apprentice at work, not a character performing.

| Beat | What moves | Timing |
|---|---|---|
| Arrive | Whole mark rises 14 px and fades in | 900 ms, once |
| Breathe | Body scales 0.4–1%, shadow counters | 5.2 s loop |
| Blink | Both eyes close and open | 120 ms, every 4.8 s, after a 2.4 s hold |
| Loupe | Right rig scans around the shoulder | 6.4 s loop |
| Loose pixel | Floats 6 px, opacity dips | 3.6 s loop |
| Reduced motion | Everything stops; the master is the fallback | `prefers-reduced-motion` |

The page defaults to the animated SVG. **Hold still** swaps the image to
`mote-master.svg` and sets `aria-pressed`; the same thing happens automatically
when the reader asks for reduced motion. The motion is CSS only, so the SVG can
be downloaded and used without JavaScript.

Rejected directions:

- **The loose-pixel chase.** It turned the pixel into a pet and made the page
  about the gag. The pixel should be noticed, not caught.
- **The bow.** Too theatrical. Ceremony belongs to the God, not the apprentice.
- **A walk cycle.** Mote stands at the proof. Walking would invent a second
  location and a second story.

## The page

The character file is a paper sheet, not a long spec document:

- **The opening** sets Mote in the largest type on the page beside a black proof
  stage: dot grid, ghost `MOTE`, hard lapis offset, and the live SVG.
- **The character** is a black band with the three traits and the voice. It is
  the only dark interruption between the stage and the paper.
- **The specimen** shows the 512, 128, 64 and 32 px rasters on black tiles, so
  the ivory body does not disappear into the paper.
- **The files** lists the six downloadable assets and the use/do-not rules.

The animation toggle is the only control on the page. Everything else is a
download or a way back to the film.

Mote is drawn for quiet surfaces. The God remains the hero.

## Hidden by design

This page is unlisted. It is not linked from the film, the 404, the examples
shelf, the colophon, the main README, or any navigation. `mascot/index.html`
carries `noindex, nofollow, noarchive`. The URL is the only door.

GitHub Pages is static, so this is unlisted, not access-controlled: anyone who
has the exact URL can open it. If the page needs a real lock, that requires a
server or an authentication layer.

## Files

| File | What it is |
|---|---|
| `mote-master.svg` | The untouched 640 × 640 source. No CSS motion. |
| `mote.svg` | The animated copy. CSS-only; identical geometry and paint. |
| `mote-512.png`, `mote-128.png`, `mote-64.png`, `mote-32.png` | Transparent rasters cut from the master. |
| `index.html` | The character file / paper proof sheet. |
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

The build prints a count of paths, paint values and IDs preserved, and fails if
any `d` attribute, six-digit paint value or `id` in `mote.svg` differs from the
master, in order. It never redraws, traces or substitutes the character.

The renderer writes the four transparent PNGs and `preview-still.png`,
`preview-motion.png` and `preview-reduced.png`. The page uses the four PNGs and
the two SVGs; the previews are for inspecting the motion.

## Don't

- Don't add a gradient, glow, bevel or second light source.
- Don't add a hat, a second prop, a new expression or a different loupe.
- Don't animate the mouth, add a speech bubble or make Mote wink.
- Don't put Mote in the masthead, hero or app icon.
- Don't use Mote to explain the interface. It notices; it does not instruct.
- Don't link this page from the public site.

## Research inputs

- Claude Code, the terminal mascot: <https://github.com/anthropics/claude-code>
- Mailchimp's voice and tone guide: <https://styleguide.mailchimp.com/voice-and-tone/>
- Nielsen Norman Group, motion purpose: <https://www.nngroup.com/articles/animation-purpose-ux/>
- The twelve basic principles of animation: <https://en.wikipedia.org/wiki/Twelve_basic_principles_of_animation>

The sources shaped the constraints; the character, copy and motion are original
to Dither Studio.
