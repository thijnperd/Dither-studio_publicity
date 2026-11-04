# Dither Studio · publicity

The launch film for [Dither Studio](https://github.com/thijnperd/dither-studio),
and the page that shows it off. Static files only: no build step, no package
manager, no server. GitHub Pages serves this folder as it is.

**Live:** https://thijnperd.github.io/Dither-studio_publicity/

## What is here

| Path | What it is |
|---|---|
| `index.html` | The page: the film on a framed light table, a chapter strip, the proofs band, the download band |
| `style.css` | The film's own palette, to the hex: ground `#0B0D12`, press `#121722`, lapis `#7E93BE`, ivory `#EFEADF` |
| `site.js` | Film controls, the ghost pointer demonstration, the GSAP scroll layer |
| `assets/film.mp4` | The film. 40 s, 1920 × 1080, h264, 24 fps, 27 MB |
| `assets/poster.png` | Its poster frame, used as the `og:image` and as the video's first frame |
| `assets/proof-*.png` | Two proofs from the app's own engine |
| `404.html` | The designed not-found page |

## How the page works

- **The film is the hero.** It is a real `<video>` element, so play, pause,
  scrubbing, keyboard seeking and full screen are the browser's own behaviour
  and not a reinvention.
- **The ghost pointer** demonstrates the controls in the hero: it moves to Play,
  presses it, jumps to the fourth chapter, drags the scrubber and hovers the
  download button. It is a demonstration of a pointer, clearly drawn as one
  (dashed arrow, ivory label); the native cursor is never hidden. Any real input
  stops it, and *Show me again* restarts it.
- **The chapters** are the montage's real beats. Their times come from the film's
  own scene table, so clicking one lands on the frame the chapter describes.
- **The counts** in the proofs band are the app's catalogue lengths: 46
  algorithms, 24 palettes, 13 effects, 11 tone maps, 21 recipes.
- **Reduced motion** turns off the ghost, the scrubbing parallax and the intro,
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
```

Re-render it whenever the app's interface changes, or the film will show a
window that no longer exists.

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

Open `http://localhost:8080/`, then confirm: the film plays, a chapter seeks,
the scrubber drags, the ghost runs once and stops when you move, and the page
holds up at 390 px wide.

## Licence

The film and the proofs are made with Dither Studio and shown here with the
app's artwork: *The Creation of Adam*, *Tor's Fight with the Giants* and
*Oedipus and the Sphinx*, all long out of copyright. The code is the author's.
