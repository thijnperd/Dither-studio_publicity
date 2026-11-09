# Dither Studio · publicity

The launch film for [Dither Studio](https://github.com/thijnperd/dither-studio),
and the page that shows it off. Static files only: no build step, no package
manager, no server. GitHub Pages serves this folder as it is.

**Live:** https://thijnperd.github.io/Dither-studio_publicity/

## What is here

| Path | What it is |
|---|---|
| `index.html` | The page: the poster-first film, the on-demand web demo, the feature plates, the proof shelf and one-page examples library, the offline ledger, the installation sheet and the download band |
| `style.css` | The film's own palette, to the hex: ground `#0B0D12`, press `#121722`, lapis `#7E93BE`, ivory `#EFEADF`; also the paper proof sheet, the specimen-wall examples, the mobile menu, the cursor loupe and the ivory installation notes |
| `site.js` | The scroll stage and its deferred film, the section state, the scroll reveals, the GSAP layer, the mobile menu, the stored reduce-motion switch, the proof loupe, the rail's arrow controls and live count, and the loader that opens the existing web demo on request |
| `assets/mark-64.png` | The film's mark, the God from *The Creation of Adam*, at 64 px: the masthead logo, in the rounded tile the close card gives it |
| `assets/mark-192.png` | The same mark at 192 px, as the Apple touch icon |
| `assets/mark.svg` | The mark condensed to the 32 grid and one bit, as rect runs: the favicon and the tab icon |
| `assets/film-scrub.mp4` | The landscape film on the page. 40 s, 1280 × 720, h264, 24 fps, 8.4 MB, keyed every 12 frames. The 1920 × 1080 master lives in the app's `publicity/out/` |
| `assets/film-phone-scrub.mp4` | The portrait cut for phones. 40 s, 720 × 1280, h264, 24 fps, 8.1 MB, keyed every 12 frames. The 1080 × 1920 master is rendered from `mograph-phone.html` with `--phone` |
| `assets/poster.jpg` | Its landscape poster frame, used as the `og:image` and as the stage's first frame |
| `assets/film-phone-poster.jpg` | The portrait poster, used by a portrait stage and its still fallback |
| `assets/shot-webdemo.png` | The web demo's console at 1440 × 900, used as its poster and framed shot |
| `assets/proof-*.png` | Proofs from the app's own engine |
| `404.html` | The missing-plate not-found page: giant misregistered 404, dark proof frame, paper notes |
| `404.css` | The 404's paper styles and its pointer loupe |
| `examples/` | The shelf's files, captions and folder-driven loader; `examples/index.html` redirects to the shelf on the main page |
| `mascot/` | Mote's unlisted character file and downloadable SVG/PNG plates (`noindex, nofollow, noarchive`, and not linked from the public pages) |

## How the page works

- **The film is the scroll, and the scroll is the only control.** The stage pins
  for four screens and the scroll position is the playhead, so the film runs
  forwards and backwards under the wheel. Six captions cross-fade at the
  montage's real beats.
- **The first paint is a poster, not an 8 MB request.** The stage uses the
  poster as its background and only asks for the encode when the visitor scrolls
  or touches the stage. A visible `Skip to the product` link jumps straight to
  the claim and never requests the film; a navigation jump to Demo, Proofs or
  Examples counts as a skip too, so a product-only visitor can leave the intro
  without paying for it.
- **There is no readout.** No timecode, no progress rule, no chapter timer, no
  numbered markers: the film is watched, not measured.
- **There is no second player.** The film cannot be restarted, replayed or
  scrubbed with a widget, on purpose: one control surface, one film. The
  masthead's section links move the page; the film stays with the scroll.
- **Two encodes feed the stage, one per shape.** Scrubbing means seeking, and
  seeking an ordinary h264 file means decoding from the last keyframe, which
  stutters when the playhead jumps. `assets/film-scrub.mp4` is the landscape
  720p file; `assets/film-phone-scrub.mp4` is the portrait 720 × 1280 cut. Both
  key every 12 frames (`-g 12 -sc_threshold 0`), so every half second is
  independently decodable. A portrait window asks for the portrait file. The
  chosen file is requested only when the intro starts, not on page load:
  ```bash
  # landscape
  ffmpeg -i <app>/publicity/out/dither-studio-mograph-silent.mp4 -an \
    -vf "scale=1280:720:flags=lanczos" \
    -c:v libx264 -preset slow -crf 32 -g 12 -keyint_min 12 \
    -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart assets/film-scrub.mp4

  # portrait, from the phone page's master
  ffmpeg -i <app>/publicity/out/dither-studio-mograph-phone-silent.mp4 -an \
    -vf "scale=720:1280:flags=lanczos" \
    -c:v libx264 -preset slow -crf 32 -g 12 -keyint_min 12 \
    -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart assets/film-phone-scrub.mp4
  ```
- **The proof sheet is the second room.** After the dark film, the page turns to
  ivory paper: oversized catalogue numbers and a sideways
  rail of proofs with hard lapis offsets. Four proofs keep their own aspect
  ratios on one scroll-snapping rail; the first two are console proofs, the last
  two come from `examples/`. The rail is focusable, draggable and keyboard
  scrollable, with previous/next buttons and a live `01 / 04` counter for a
  pointer that does not want to guess. A cursor loupe follows a fine pointer over
  it. The full folder-driven shelf sits below the rail in `#examples`, so the
  page is a complete one-pager rather than a set of disconnected pages.
- **The examples shelf is part of the one-pager.** Its loader waits until the
  shelf is near the viewport, then reads `examples/captions.json` and the folder
  listing through GitHub's contents API. The files are served from this site;
  `examples/index.html` redirects old links to `#examples`.
- **The last act is a product file, not another essay.** The page returns to the
  dark console for a zero ledger: no accounts, no uploads, no network calls. Then
  the installation notes print on ivory paper, set as a numbered sheet with the
  build caveats and file sizes. The closing download band carries the download,
  then a one-line byline closes the page.
- **The counts** above the shelf are the app's catalogue lengths: 46 algorithms, 24 palettes, 13 effects, 11 tone maps, 21 presets.
- **The 404 carries the same print-room idea.** A missing plate is a blank
  sheet: a misregistered 404, a dark proof frame, a paper note and one way back.
  It is public and `noindex`, and it does not link to the unlisted character file.
- **The web demo is the real app.** The demo section opens the web build from
  <https://thijnperd.github.io/dither-studio/> in an iframe when *Start the
  press* is used on a wide screen. The frame adds `?embed=1`, so the console
  drops its splash and masthead and starts on a finished proof. The control is
  still a normal link, so a phone, a middle-click or a browser without
  JavaScript opens it in its own tab. The demo is maintained in the app's
  repository; this site does not rebuild it, and its files are not requested
  until the link is used. Unlike the rest of the page, it cannot draw without a
  connection.
- **Reduced motion** follows the system preference by default, and the
  masthead carries a `Reduce motion` switch beside the section links. Turning it
  on stores `reduce`; turning it off stores `full` over the system preference.
  Either state unpins the stage into a readable list, hides the video, and
  leaves every caption in the flow. The choice survives a reload and is read in
  the head before the page paints; the switch reloads so the stage resets
  cleanly.
- **Phones get the portrait cut.** A portrait window pins the stage and scrubs
  `assets/film-phone-scrub.mp4`, so the paintings keep their composition instead
  of being cropped from a 16:9 frame. The portrait poster is the first frame
  while the film loads and the still fallback when it does not. The phone also
  gets a visible note that the installed app is for Windows and macOS, not a
  phone or tablet. Reduced motion and save-data still get the poster and the
  captions in flow, with no video requested.

GSAP and ScrollTrigger come from jsDelivr; everything else is local. There are
no cookies, no analytics and no third-party fonts. Body copy is set in Instrument
Sans; labels, captions and data use IBM Plex Mono.

## Copy and design checks

Two checkers run over these pages before a publish. They are advisory scanners,
not test suites: review every hit, fix the real ones, and leave a reason for the
ones that are the design.

```bash
# a copy-pattern scanner (installed at ~/.claude/skills/kill-ai-slop)
node ~/.claude/skills/kill-ai-slop/scripts/scan.mjs .

# the design detector from Impeccable
npx impeccable detect --json index.html
```

The copy scanner reports 24 hits across four deliberate families: the paper dot
texture on 404/examples/Mascot and the specimen wall, display tracking read as
“full-sentence headline”, the circular loupe read as glassmorphism, and the
mono face used for labels and data. The three gradient exceptions already carry
scoped ignore comments in `style.css`: the spotlight over the film, the scrim
beneath the type and the demo veil. The catchable copy defects remain fixed: no
decorative chapter numbers, no player chrome, no load curtain, and no eyebrow
kickers; the mono is reserved for labels, captions and data.

`impeccable` exits 0 with four hard-offset-shadow advisories on `index.html`:
they are the proof sheet's lapis registration offsets, kept on purpose rather
than neutralised. The marquee warning disappeared with the catalogue ticker.
The filter and tally labels now meet the 11 px floor, the bar note clears WCAG AA
contrast, and the brand faces and clamp-padding false positives remain waived
with reasons in `.impeccable/config.json`.

## The copy, and why it reads like this

The page follows the site's own voice rules: no negative parallelisms (*not X,
but Y*), no rhetorical rule of three, no "-ing" analysis tails, no puffery about
significance, no em dashes (zero in `index.html`), and no words from the
overused-vocabulary list. Every claim is a number the app can be tested against.
Enumerations that survive are real inventories: the three paintings that ship,
the algorithm families that exist.

## Motion

The rules are Emil Kowalski's ([emilkowal.ski](https://emilkowal.ski), the
`emil-design-eng` skill):

- An animation has to explain something. The film scrub, the caption changes,
  the pointer demonstration and the press feedback do; scroll-triggered fades on
every heading do not, so they were removed, along with the counting numbers.
- Nothing animates on load. The words are the page; a stalled transition must
  never be what keeps them off screen.
- Under 300 ms for interface motion: presses 120–160 ms, section jumps 600 ms
  because they are navigation.
- Strong curves, not the built-in easings: `cubic-bezier(0.23, 1, 0.32, 1)` for
  entries and colour, `cubic-bezier(0.77, 0, 0.175, 1)` for on-screen movement.
- `transform`, `opacity` and colour only; hover styles sit behind
  `@media (hover: hover) and (pointer: fine)`; every pressable element answers
  with `scale(0.98)`.
- `prefers-reduced-motion` still unpins the stage into a readable list. The
  stored motion switch overrides the system preference in either direction; the
  film's encode is deferred until the intro actually starts.

## The film's source

The film is not recorded. It is one HTML page in the app's repository, with a
portrait companion on the same clock. `render-mograph.js` seeks each frame in
Playwright and encodes the result with ffmpeg.

```bash
# in the app's repository
node publicity/render-mograph.js --notext          # 1920 × 1080 master
node publicity/render-mograph.js --phone --notext  # 1080 × 1920 master
# copy the poster frames, then build the two scrub encodes with the ffmpeg
# lines above
```

Re-render it whenever the app's interface changes, or the film will show a
window that no longer exists. If the scene times move, update the caption
timing in `site.js`; the section jumps follow the page, not the film.

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

Open `http://localhost:8080/` and confirm: the stage shows its poster before
any MP4 is requested, the stage pins while you scroll and the film advances with
it, `Skip to the product` reaches the claim without loading the film, a section
link moves the page and the `Film` link returns to the stage and starts it, the
ghost runs once and stops when you move, no video can be replayed anywhere on the page, no timecode appears
anywhere, the film's own mark is in the masthead and the browser tab, the
`Examples` link reaches the inline shelf, the mobile menu fits at 390 px and its
download CTA sits at the bottom, and the desktop nav still reads as one row.
Serve with a Range-capable server: Python's `http.server` ignores `Range`, so
the video cannot seek and the stage will look frozen.

## Licence

The film and the proofs are made with Dither Studio and shown here with the
app's artwork: *The Creation of Adam*, *Tor's Fight with the Giants* and
*Oedipus and the Sphinx*, all long out of copyright. The code is the author's.

## The examples shelf

The shelf lives at `#examples` on the main page. `examples/` holds the files,
`captions.json` and the loader; `examples/index.html` is a noindex redirect for
old links. Drop stills (png, jpg, webp, gif, avif) or clips (mp4, webm, mov)
into that folder and push: the loader reads the folder through GitHub's contents
API, so there is no manifest to edit and no list that can fall out of step. It
waits until the shelf is near the viewport before it asks for the listing or any
image. The section is a specimen wall, not a uniform card grid: a wide lead
plate, a narrow companion, three smaller plates, the same rhythm mirrored, and
a closing pair. The loader assigns that rhythm to the visible items, so the
Stills/Motion filters (shown only for kinds that exist) reflow without holes.
The head carries the live count; the cards carry an index, a crop of the plate
and a link to the full file. Curated display titles live in
`examples/examples.js`; a new file still appears with its file name as the
title. Each card reports the real pixel size once the browser has loaded it.
GitHub refuses files over 100 MB; keep clips short.

## Type

Instrument Serif for display, Instrument Sans for text, IBM Plex Mono for labels and data. All
three are OFL and live in `assets/fonts/` with their licence files, so the page fetches no font
from a third party. The stylesheet points at them with `@font-face`, which is also why the site
still works from a local folder.
