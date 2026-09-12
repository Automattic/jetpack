---
description: >
  Builds landing-page hero animations of real Jetpack/WordPress admin UI — CSS keyframe timelines
  layered over screenshots of a live site, published as one self-contained HTML showcase page with
  real selectable text. Use when asked for a hero animation, product or marketing animation,
  animated screenshot, animated demo, showcase page, or landing-page motion for any Jetpack
  product surface, for jetpack.com, a release or P2 post, or a design review; also for "something
  like the Jetpack AI heroes". Use it too when the request says "video", "GIF", "screen recording"
  or "loom" of product UI, since this skill produces the CSS-animated alternative to those. Do not
  use for ordinary Jetpack development — bug fixes, PR review, changelog entries, tests, or taking
  verification screenshots of a Jurassic Ninja site — nor for adding animation to shipping product
  code.
---

# Jetpack UI hero animations

Produce a hero animation of real product UI: a screenshot of the parts that never move, with
everything that changes redrawn on top as DOM or as slices of a second screenshot, driven by CSS
keyframes. The result is one self-contained HTML file.

## Before you start

Needs Playwright (a Jetpack monorepo checkout, or `PLAYWRIGHT_ROOT` pointing at one) and Python
with Pillow. Check both, and set the two paths every command below uses:

```bash
SKILL=.agents/skills/jetpack-ui-hero   # from the monorepo root
export PLAYWRIGHT_ROOT=~/a8c/jetpack          # absolute; a relative path hangs the resolver
python3 -c 'import PIL' || python3 -m pip install --user Pillow
```

Exporting to MP4 or GIF additionally needs `ffmpeg` (`brew install ffmpeg`); nothing else does.

Pick a working directory for the build and stay in it — steps 3 to 6 all use the same one.

## Workflow

### 1. Agree the piece before capturing

Settle three things with the user, because each changes what to capture:

- **Which moment.** The payoff or the differentiator, not a feature list. See
  `references/composition.md` for choosing, for how long and how big a piece should be, and for the
  motion shapes the Jetpack AI set already uses — do not repeat them.
- **Persona and site identity**, if this is a set of two or more — one name and one site across all
  of them. See "Continuity across a set" in the same file before inventing a name.
- **Whether the feature ships.** Flag-gated UI can be captured but must be labelled.

Sketch the beats as a list of times before writing any CSS.

### 2. Set up a capture site

**One site per set, not per piece.** Provision a Jurassic Ninja site, connect Jetpack, and log in
with `login()` from the capture kit. Rename the site and the admin user to the persona through
Settings → General and Users → Profile in the same Playwright session — there is no CLI route that
does not need the password. Seed realistic data through the real UI.

Read **`references/capture-traps.md` before this step** — sessions, rate limits, module activation,
the display-name two-step, and seeding.

### 3. Capture layers

Write `<dir>/capture.mjs` importing `$SKILL/scripts/capture-kit.mjs`. You will re-run it, and step
6 keeps it. Exports: `preflight`, `login`, `open`, `settle`, `dismissModals`, `hidePage`,
`hideInFrame`, `frameOffset`, `stampId`, `measure`, `measureAll`, `crop`, `toWebp`, `sleep`.

Produce:

- **`geometry.json`** — every rect and computed style you will redraw. Measure, never eyeball.
- **A clean plate** — the full frame with everything that changes blanked out.
- **Crops** — one per element that appears, moves, or swaps as a unit.

Convert to lossless WebP with `toWebp()`.

`references/capture-traps.md` is the whole value of this step — sessions, clean plates, measuring,
unstable class names, React screens that are not settled, the block-editor iframe, DataViews
tables, front-end pages, seeding, feature flags.

### 4. Build the scene

Generate the CSS from `geometry.json` rather than typing coordinates. Patterns for slices, typing,
counters, cursors, signals, sequential animations and reduced motion are in
`references/scene-patterns.md` — read it before writing scene CSS; it also lists what the shell
already provides, so you never need to open `assets/`.

Lay the working directory out like this:

```
<dir>/
├── pieces.json          manifest — copy assets/pieces.example.json and edit
├── capture.mjs          your capture script, kept
├── piece-<id>.css       one per piece
├── piece-<id>.html      one per piece: layers ONLY — the builder adds the
│                        stage/box/scene wrappers. {{asset:name}} becomes a data URI
└── *.webp               plates and crops
```

`shell.css` and `stage.js` are taken from the skill unless you drop your own copy in `<dir>`.
Then:

```bash
python3 "$SKILL"/scripts/build-page.py <dir>
```

It inlines every asset once, emits each scene's size and timing variables, computes per-piece
weights, and writes `index.html`. Heed its warnings — they catch an asset referenced from both the
stylesheet and the markup, which inlines it twice.

Do not set `width`/`height` on `#<id>-scene` yourself; the builder emits them from the manifest.

### 5. Verify by scrubbing

Do not watch the animation. Seek it — **once per piece**:

```bash
node "$SKILL"/scripts/scrub.mjs <dir>/index.html <id>-box 0.5,2.4,5.7,8.5
```

Pick a time either side of every beat plus one after the last; the defaults assume a ~9s piece.
It writes a frame per time and a full-page shot, checks that reduced motion matches the final
frame, checks phone width, and exits non-zero on failure.

`index.html` is generated. Fix the piece CSS or markup and rebuild — never hand-edit it.

Then look at the frames, and check:

- every count consistent across the frame at every moment
- nothing clipped mid-word at a crop edge
- the last beat still in frame after everything has grown
- no stale value showing through from the plate
- `page.png` — the shell, spec table and footer, which the box frames do not show

### 6. Publish, deliver and report

Publish `index.html` with whatever artifact or hosting tool is available; if there is none, hand
over the absolute path, since the file is self-contained and opens from `file://`. Copy the working
directory to `~/a8c/plans/<topic>/` — planning artifacts live outside the repo.

Ask where the piece is actually going, and read `references/output.md`: a WordPress page wants
`build-page.py --embed`, which writes a style-isolated fragment per piece; a deck or a P2 wants
`scripts/export.mjs`, which renders MP4/WebM/GIF by seeking the timeline.

**Delete `state.json` from the copy.** It holds live session cookies for the capture site.

State plainly what was verified and what was not: headless rendering is not the same as having
seen it in a real browser, and say so.

## The rule that matters most

**Anything that changes during the animation must be blanked in the plate and redrawn.** A count in
a sidebar badge, a title echoed in a toolbar, a status pill — leave one baked in and it contradicts
the animation on screen. This is the most common defect in these pieces.
