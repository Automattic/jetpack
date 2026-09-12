# Getting a piece in front of people

- [What the built page is](#what-the-built-page-is)
- [Embedding in WordPress](#embedding-in-wordpress)
- [Exporting MP4 or GIF](#exporting-mp4-or-gif)
- [Which to use where](#which-to-use-where)

## What the built page is

`index.html` is one self-contained file — every image inlined, no external requests except
Google Fonts. It opens from `file://`, publishes as an artifact, and drops into a worker or any
static host unchanged. That page is the *showcase*: header, pieces, spec tables, footer.

For putting a single piece inside something else, build the embed fragments instead:

```bash
python3 "$SKILL"/scripts/build-page.py <dir> --embed
```

That writes `embed-<id>.html` per piece — the scene, its CSS and a small script, and nothing
else. It is style-isolated in **both** directions: no element selectors reach out into the host,
and a `:where()` guard stops a host theme's `img { border }` or `p { margin }` reaching in. It
scales to whatever width it is given and replays on click.

## Embedding in WordPress

**A Custom HTML block** is the direct route: paste the whole of `embed-<id>.html` in. It needs the
inline `<script>` to survive, which means the editing user must have `unfiltered_html` —
self-hosted and Atomic admins do; **WordPress.com Simple and non-super-admins on multisite do
not**, and the script is silently stripped, leaving a static first frame. Check the saved page,
not the editor preview.

**An iframe** is the fallback when scripts are stripped or the theme is hostile. Host the built
`index.html` (or a single-piece build of it) anywhere static and iframe it at the scene's aspect
ratio. Note the media library rejects `.html` uploads by default, so it needs real hosting.

**A video block** always works and never breaks — see below for the trade.

Whichever route, check it on the published page at phone width. The fragment has no minimum width,
but a theme's content column can be narrower than the text in the screenshot stays legible at.

## Exporting MP4 or GIF

```bash
node "$SKILL"/scripts/export.mjs <dir>/index.html <id>-box \
  --duration 9 --format mp4,gif --width 1000 --out response-lands
```

Frames are captured by **seeking**, not by screen-recording, so the output is deterministic — the
same bytes on a slow machine as a fast one. Needs `ffmpeg` (`brew install ffmpeg`).

Real numbers for a 9s 1280×820 piece exported at 1000px wide: **MP4 174 KB, GIF 767 KB.** The GIF
uses one shared palette (`palettegen stats_mode=diff`) with bayer dithering, which keeps flat UI
from crawling between frames and keeps small text readable.

`--format` takes `mp4`, `webm`, `gif`. GIF defaults to 15fps when exported alone, since it is the
format that suffers most from frame count.

## Which to use where

| Destination | Use | Why |
|---|---|---|
| jetpack.com, a WP page | `embed-<id>.html` | Text stays text: selectable, translatable, and reduced-motion still lands on the final frame |
| Design review, sharing a set | the published artifact | Spec tables and beats come with it |
| Slide deck, Figma, Slack | `.mp4` | Smallest, best quality, plays everywhere |
| GitHub comment, a P2, docs | `.gif` | The only thing that reliably auto-plays inline |
| Anywhere scripts are stripped | `.mp4` in a video block | Needs `muted playsinline autoplay loop` to start on its own |

Export loses three things the animation has: real text, `prefers-reduced-motion`, and the weight
advantage. Prefer the embed on the web and export only for destinations that cannot take HTML.
