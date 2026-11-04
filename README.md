# Dither Studio · publicity

The launch film for [Dither Studio](https://github.com/thijnperd/dither-studio),
and the page that shows it off. Static files only: no build step, no package
manager, no server. GitHub Pages serves this folder as it is.

**Live:** https://thijnperd.github.io/Dither-studio_publicity/

## What is here

| Path | What it is |
|---|---|
| `index.html` | The page: a pinned stage the scroll drives, the film with its own controls, the chapter strip, the proofs band, the download band |
| `style.css` | The film's own palette, to the hex: ground `#0B0D12`, press `#121722`, lapis `#7E93BE`, ivory `#EFEADF` |
| `site.js` | The scroll stage, the film controls, the ghost pointer demonstration, the GSAP layer |
| `assets/film.mp4` | The film. 40 s, 1920 × 1080, h264, 24 fps, 27 MB |
| `assets/film-scrub.mp4` | The same film at 1280 × 720, 8 MB, keyed every 12 frames, for the scroll stage |
| `assets/poster.png` | Its poster frame, used as the `og:image` and as the first frame both videos show |
| `assets/proof-*.png` | Two proofs from the app's own engine |
| `404.html` | The designed not-found page |

## How the page works

- **The film is the scroll.** The stage pins for about three and a half screens;
  scroll position is the playhead, so the film runs forwards and backwards as you
  scroll. Six captions cross-fade at the montage's real beats, and the corner
  readout names the chapter and the time.
- **A second encode feeds that stage.** Scrubbing a video means seeking it, and
  seeking an ordinary h264 file means decoding from the last keyframe, which
  stutters when the playhead jumps. `assets/film-scrub.mp4` is the same film
  re-encoded at 720p with a keyframe every 12 frames (`-g 12 -sc_threshold 0`),
  so every half second is independently decodable:
  ```bash
  ffmpeg -i assets/film.mp4 -an -vf "scale=1280:-2:flags=lanczos" \
    -c:v libx264 -preset veryfast -crf 25 -g 12 -keyint_min 12 \
    -sc_threshold 0 -pix_fmt yuv420p -movflags +faststart assets/film-scrub.mp4
  ```
- **The watch section is the same film, answering to you.** A real `<video>`
  element, so play, pause, scrubbing, keyboard seeking and full screen are the
  browser's own behaviour rather than a reinvention.
- **The ghost pointer** demonstrates those controls: it moves to Play, presses
  it, jumps to the fourth chapter, drags the scrubber and hovers the download
  button. It is a demonstration of a pointer, drawn as one (lapis arrow, ivory
  label); the native cursor is never hidden. Any real input stops it, and
  *Show me again* restarts it.
- **The chapters** are the montage's real beats. Their times come from the film's
  own scene table (`hook 0, source 5, press 11, type 20, many 26.6, close 33.4`),
  so a chapter lands on the frame it describes.
- **The counts** in the proofs band are the app's catalogue lengths: 46
  algorithms, 24 palettes, 13 effects, 11 tone maps, 21 recipes.
- **Reduced motion** unpins the stage into a readable list, turns off the ghost
  and leaves every control working.

GSAP and ScrollTrigger come from jsDelivr; everything else is local. There are
no cookies, no analytics and no third-party fonts.

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
`site.js`: the scroll stage and the chapter strip both read it.

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
the film advances with it (the corner timecode follows), a chapter seeks in the
watch section, the scrubber drags, the ghost runs once and stops when you move,
and the page holds up at 390 px wide. Serve with a Range-capable server: Python's
`http.server` ignores `Range`, so the video cannot seek and the stage will look
frozen.

## Licence

The film and the proofs are made with Dither Studio and shown here with the
app's artwork: *The Creation of Adam*, *Tor's Fight with the Giants* and
*Oedipus and the Sphinx*, all long out of copyright. The code is the author's.
