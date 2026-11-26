# Daniel Cheng · Studio

My personal site, designed as a music production app (DAW).

- **Session**: my timeline as a DAW arrangement. Each track (Code, Research, Design & Video, People, Keys) is also an audio stem in a synthesized ii–V–I–vi beat. Mute/solo a track to filter the whole page.
- **Tracklist**: featured projects, numbered like an album.
- **Levels**: impact numbers, plus a skills "rack".
- **Keys**: a playable piano with live chord detection (and a few easter eggs).
- **Connect**: contact links and resume.

No framework and no build step: plain HTML, CSS and JS, with every sound synthesized live through the Web Audio API.

## Editing content

Almost everything lives in **`data.js`**: tracks, clips (experience and projects), stats and skills. Dates use `ym(year, month)`, and `end: null` means "Present". Clips marked `// TODO` have approximate dates to double-check.

Contact links in the hero and Connect sections are in `index.html`. The resume PDF is `assets/Daniel_Cheng_Resume.pdf`.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy (GitHub Pages)

Repo **Settings → Pages → Deploy from a branch**, pick the branch and the `/ (root)` folder.

## Files

| File | What |
| --- | --- |
| `index.html` | Page structure |
| `styles.css` | All styling (dark studio theme, responsive) |
| `data.js` | Content |
| `audio.js` | Web Audio groove engine + piano voice |
| `app.js` | Rendering, transport, mute/solo, inspector, piano, chord detection |
