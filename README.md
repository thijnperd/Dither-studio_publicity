# Dither Studio · publicity

The launch film for [Dither Studio](https://github.com/thijnperd/dither-studio),
and the page that shows it off. Static files only: no build step, no package
manager, no server. GitHub Pages serves this folder as it is.

**Live:** https://thijnperd.github.io/Dither-studio_publicity/

## What is here

| Path | What it is |
|---|---|
| `index.html` | The page: the pinned film, the on-demand web demo, the feature plates, the proof shelf, the download band |
| `style.css` | The film's own palette, to the hex: ground `#0B0D12`, press `#121722`, lapis `#7E93BE`, ivory `#EFEADF` |
| `site.js` | The scroll stage, the section state, the scroll reveals, the GSAP layer, and the loader that opens the existing web demo on request |
| `assets/mark-64.png` | The film's mark, the God from *The Creation of Adam*, at 64 px: the masthead logo, in the rounded tile the close card gives it |
| `assets/mark-192.png` | The same mark at 192 px, as the Apple touch icon |
| `assets/mark.svg` | The mark condensed to the 32 grid and one bit, as rect runs: the favicon and the tab icon |
| `assets/film-scrub.mp4` | The film on the page. 40 s, 1280 × 720, h264, 24 fps, 8.4 MB, keyed every 12 frames. The 1920 × 1080 master lives in the app's `publicity/out/` |
| `assets/poster.jpg` | Its poster frame, used as the `og:image` and as the stage's first frame |
| `assets/shot-webdemo.png` | The browser build's console, at 2×, used as the web demo's poster |
| `assets/proof-*.png` | Two proofs from the app's own engine |
| `404.html` | The designed not-found page |

## How the page works

- **The film is the scroll, and the scroll is the only control.** The stage pins
  for three and a half screens and the scroll position is the playhead, so the
  film runs forwards and backwards under the wheel. Six captions cross-fade at
  the montage's real beats.
- **There is no readout.** No timecode, no progress rule, no chapter timer, no
  numbered markers: the film is watched, not measured.
- **There is no second player.** The film cannot be restarted, replayed or
  scrubbed with a widget, on purpose: one control surface, one film. The
  masthead's section links move the page; the film stays with the scroll.
- **A second encode feeds the stage.** Scrubbing means seeking, and seeking an
  ordinary h264 file means decoding from the last keyframe, which stutters when
  the playhead jumps. `assets/film-scrub.mp4` is 720p with a keyframe every 12
  frames (`-g 12 -sc_threshold 0`), so every half second is independently
  decodable:
  ```bash
  ffmpeg -i <app>/publicity/out/dither-studio-mograph-silent.mp4 -an \
    -vf "scale=1280:720:flags=lanczos" \
    -c:v libx264 -preset slow -crf 32 -g 12 -keyint_min 12 \
    -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart assets/film-scrub.mp4
  ```
- **The proof shelf runs sideways.** Four proofs keep their own aspect ratios
  on one scroll-snapping rail; the first two are console proofs, the last two
  come from `examples/`. The rail is focusable and its arrows scroll it.
- **The counts** above the shelf are the app's catalogue lengths: 46 algorithms, 24 palettes, 13 effects, 11 tone maps, 34 presets.
- **The web demo is the real app.** The demo section opens the frozen web build
  from <https://thijnperd.github.io/dither-studio/> in an iframe when *Start the
  press* is used on a wide screen. The control is a normal link, so a phone, a
  middle-click or a browser without JavaScript opens it in its own tab. The demo
  is not rebuilt here and its files are not requested until the link is used;
  unlike the rest of the page, it cannot draw without a connection.
- **Reduced motion** unpins the stage into a readable list, removes the video,
  and leaves every caption in the flow.
- **Phones get the poster, not the film.** Under 900 px, or on a coarse pointer,
  the stage unpins into the same readable list, the video element is removed,
  and the film is never requested, so a phone does not download the 8.4 MB encode.

GSAP and ScrollTrigger come from jsDelivr; everything else is local. There are
no cookies, no analytics and no third-party fonts. Labels are set in the text
face, not in monospace.

## The deslop passes

Two checkers run over this page, and both must be clean before a publish.

```bash
# the AI-tells scanner from https://github.com/yetone/kill-ai-slop
# installed at ~/.claude/skills/kill-ai-slop
node ~/.claude/skills/kill-ai-slop/scripts/scan.mjs .

# the design detector from Impeccable
npx impeccable detect --json index.html
```

`kill-ai-slop` reports 35 tells; three hits here are deliberate and carry scoped
`deslop-ignore-next-line` comments in `style.css` with the reason on the line:
the spotlight vignette over the film (the page's whole visual idea is a
spotlight, and the gradient is what keeps a caption legible on a bright frame),
the scrim beneath the type (the same reason, at the foot of the frame), and the
demo veil (a floor for the start card over a busier app shot).
Everything it did catch was fixed: eleven monospace labels moved to the text
face, the player and its CSS were deleted, the `01/02/03` markers came off the
chapter cards (tell 30, decorative numbering), and the load curtain went
altogether.

`impeccable` now reports no findings on the PC page. Two rule classes still
match the source but are false positives on this construction: the brand faces
(Instrument Sans and Instrument Serif are not the generic defaults the rule
targets) and the section top borders (the scan reads the `clamp()` padding
shorthand as no inset, though every section carries 3.5 to 6rem above its first
child). Both are waived with reasons in `.impeccable/config.json`. The scan also
caught two genuinely wide tracking values and one orphaned caption; those are
fixed in `style.css`.

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
`publicity/mograph.html`, where every frame is a function of time;
`render-mograph.js` seeks it frame by frame in Playwright and encodes the result
with ffmpeg.

```bash
# in the app's repository
node publicity/render-mograph.js             # writes publicity/out/dither-studio-mograph-silent.mp4
# export the silent poster to <this repo>/assets/poster.jpg, then rebuild the
# scrub encode with the ffmpeg line above
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

## The examples shelf

`examples/` is the library behind <https://thijnperd.github.io/Dither-studio_publicity/examples/>.
Drop stills (png, jpg, webp, gif, avif) or clips (mp4, webm, mov) into that folder and push:
the page reads the folder through GitHub's contents API, so there is no manifest to edit and no
list that can fall out of step. The file name becomes the caption (`proof-thor-bayer8.png` reads
"Proof thor bayer 8"), and the card reports the real pixel size once the browser has loaded it.
GitHub refuses files over 100 MB; keep clips short.

## Type

Instrument Serif for display, Instrument Sans for text, IBM Plex Mono for labels and data. All
three are OFL and live in `assets/fonts/` with their licence files, so the page fetches no font
from a third party. The stylesheet points at them with `@font-face`, which is also why the site
still works from a local folder.
