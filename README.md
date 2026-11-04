# Dither Studio · publicity

The launch film for [Dither Studio](https://github.com/thijnperd/dither-studio),
and the page that shows it off. Static files only: no build step, no package
manager, no server. GitHub Pages serves this folder as it is.

**Live:** https://thijnperd.github.io/Dither-studio_publicity/

## What is here

| Path | What it is |
|---|---|
| `index.html` | The page: a pinned stage the scroll drives, the chapter strip, the proofs band, the download band |
| `style.css` | The film's own palette, to the hex: ground `#0B0D12`, press `#121722`, lapis `#7E93BE`, ivory `#EFEADF` |
| `site.js` | The scroll stage, the chapter jumps, the ghost pointer demonstration, the section state in the masthead, the GSAP layer |
| `assets/mark-64.png` | The film's mark, the God from *The Creation of Adam*, at 64 px: the masthead logo, in the rounded tile the close card gives it |
| `assets/mark-192.png` | The same mark at 192 px, as the Apple touch icon |
| `assets/mark.svg` | The mark condensed to the 32 grid and one bit, as rect runs: the favicon and the tab icon |
| `assets/film.mp4` | The film. 40 s, 1920 × 1080, h264, 24 fps, 27 MB. The archival copy, linked from the colophon |
| `assets/film-scrub.mp4` | The same film at 1280 × 720, 8 MB, keyed every 12 frames. This is the one the page plays |
| `assets/poster.png` | Its poster frame, used as the `og:image` and as the stage's first frame |
| `assets/proof-*.png` | Two proofs from the app's own engine |
| `404.html` | The designed not-found page |

## How the page works

- **The film is the scroll, and the scroll is the only control.** The stage pins
  for three and a half screens and the scroll position is the playhead, so the
  film runs forwards and backwards under the wheel. Five captions cross-fade at
  the montage's real beats.
- **There is no readout.** No timecode, no progress rule, no chapter timer, no
  numbered markers: the film is watched, not measured. The chapter strip names
  its six stops and nothing else.
- **There is no second player.** The film cannot be restarted, replayed or
  scrubbed with a widget, on purpose: one control surface, one film. The chapter
  strip below the stage does not play anything either. Each button tweens the
  page to the scroll position that corresponds to that frame, so the film
  follows the page.
- **A second encode feeds the stage.** Scrubbing means seeking, and seeking an
  ordinary h264 file means decoding from the last keyframe, which stutters when
  the playhead jumps. `assets/film-scrub.mp4` is 720p with a keyframe every 12
  frames (`-g 12 -sc_threshold 0`), so every half second is independently
  decodable:
  ```bash
  ffmpeg -i assets/film.mp4 -an -vf "scale=1280:-2:flags=lanczos" \
    -c:v libx264 -preset veryfast -crf 25 -g 12 -keyint_min 12 \
    -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart assets/film-scrub.mp4
  ```
- **The ghost pointer** moves to the second chapter, presses it, and then points
  at the download button, so the page demonstrates its own interaction. It is a
  demonstration of a pointer, drawn as one (lapis arrow, ivory label); the
  native cursor is never hidden. Any real input stops it, and *Show me again*
  restarts it.
- **The counts** in the proofs band are the app's catalogue lengths: 46
  algorithms, 24 palettes, 13 effects, 11 tone maps, 21 recipes.
- **Reduced motion** unpins the stage into a readable list, turns off the ghost,
  and leaves the chapter jumps as plain jumps.

GSAP and ScrollTrigger come from jsDelivr; everything else is local. There are
no cookies, no analytics and no third-party fonts. Labels are set in the text
face, not in monospace.

## The deslop passes

Two checkers run over this page, and both must be clean before a publish.

```bash
# the AI-tells scanner from https://github.com/yetone/kill-ai-slop
# installed at ~/.claude/skills/kill-ai-slop
node ~/.claude/skills/kill-ai-slop/scripts/scan.mjs .

# the design detector from the impeccable skill
~/.claude/skills/impeccable/scripts/impeccable detect --json index.html
```

`kill-ai-slop` reports 35 tells; two hits here are deliberate and carry scoped
`deslop-ignore-next-line` comments in `style.css` with the reason on the line:
the spotlight vignette over the film (the page's whole visual idea is a
spotlight, and the gradient is what keeps a caption legible on a bright frame)  and the 50% radius on the pointer ripple (a click reads as a ring, not a card).
Everything it did catch was fixed: eleven monospace labels moved to the text
face, the player and its CSS were deleted, the `01/02/03` markers came off the
chapter cards (tell 30, decorative numbering), and the load curtain went
altogether.

`impeccable` reports only `cramped-padding` on the hairline grids whose cells
already carry 16 to 24 px of padding, which is a false positive on that
construction.

## The copy, and why it reads like this

The page is checked against [Wikipedia's *Signs of AI writing*](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing):
no negative parallelisms (*not X, but Y*), no rhetorical rule of three, no
"-ing" analysis tails, no puffery about significance, no em dashes (zero in
`index.html`), no words from the overused-vocabulary list. Every claim is a
number the app can be tested against. Enumerations that survive are real
inventories: the three paintings that ship, the algorithm families that exist.

## Motion

The rules are Emil Kowalski's ([emilkowal.ski](https://emilkowal.ski), the
`emil-design-eng` skill):

- An animation has to explain something. The film scrub, the caption changes,
  the pointer demonstration and the press feedback do; scroll-triggered fades on
every heading do not, so they were removed, along with the counting numbers.
- Nothing animates on load. The words are the page; a stalled transition must
  never be what keeps them off screen.
- Under 300 ms for interface motion: presses 120–160 ms, chapter jumps 600 ms
  because they are navigation.
- Strong curves, not the built-in easings: `cubic-bezier(0.23, 1, 0.32, 1)` for
  entries and colour, `cubic-bezier(0.77, 0, 0.175, 1)` for on-screen movement.
- `transform`, `opacity` and colour only; hover styles sit behind
  `@media (hover: hover) and (pointer: fine)`; every pressable element answers
  with `scale(0.98)`.
- `prefers-reduced-motion` still unpins the stage into a readable list.

## The film's source

The film is not recorded. It is one HTML page in the app's repository,
`publicity/launch.html`, where every frame is a function of time; `render.js`
seeks it frame by frame in Playwright and encodes the result with ffmpeg.

```bash
# in the app's repository
node publicity/render.js                     # writes publicity/out/dither-studio-launch.mp4
cp publicity/out/dither-studio-launch.mp4  <this repo>/assets/film.mp4
cp publicity/out/poster.png                <this repo>/assets/poster.png
# then rebuild the scrub encode with the ffmpeg line above
```

Re-render it whenever the app's interface changes, or the film will show a
window that no longer exists. If the scene times move, update `CHAPTERS` in
`site.js`: the caption timing and the chapter jumps both read it.

## Deploying

Pages is configured for this repository's `main` branch at the site root.
Pushing to `main` publishes; there is no workflow and nothing to install.

```bash
git add -A && git commit -m "…" && git push
```

`.nojekyll` is here so Pages serves the files untouched instead of running them
through Jekyll, which would ignore paths starting with an underscore and add a
build delay to every publish.

## Checking a change

```bash
npx serve .            # or: python -m http.server 8080
```

Open `http://localhost:8080/` and confirm: the stage pins while you scroll and
the film advances with it, a chapter button moves the page and the film
together, the ghost runs once and stops when you move, no video can be replayed
anywhere on the page, no timecode appears anywhere, the film's own mark is in
the masthead and the browser tab, and the layout holds at 390 px wide.
Serve with a Range-capable server: Python's `http.server` ignores `Range`, so
the video cannot seek and the stage will look frozen.

## Licence

The film and the proofs are made with Dither Studio and shown here with the
app's artwork: *The Creation of Adam*, *Tor's Fight with the Giants* and
*Oedipus and the Sphinx*, all long out of copyright. The code is the author's.
