# Scene patterns

CSS for the layer techniques.

- [What the shell already gives you](#what-the-shell-already-gives-you)
- [Layer budget](#layer-budget)
- [Timing](#timing)
- [Sequential animations on one property](#sequential-animations-on-one-property)
- [Image slices](#image-slices)
- [Typing](#typing)
- [Counters and label swaps](#counters-and-label-swaps)
- [Cursor](#cursor)
- [Signals between regions](#signals-between-regions)
- [Reduced motion](#reduced-motion)
- [Specificity](#specificity)

## What the shell already gives you

`build-page.py` wraps each piece in `#<id>-stage > #<id>-box > #<id>-scene.scene` and emits the
scene's `width`/`height` from the manifest. `assets/shell.css` and `assets/stage.js` then handle:

- **Sizing.** `#<id>-box` carries the aspect ratio; `stage.js` scales the scene to the box.
  **Never set `width`/`height` on `#<id>-scene` yourself** — and never set `position` on it either
  (see [Specificity](#specificity)). A scene with no size collapses to zero, `stage.js` computes
  `scale(Infinity)`, CSS drops the invalid transform, and the page renders at 1:1 clipped to a
  corner with no error anywhere.
- **Positioning.** Every direct child of `.scene` is already `position:absolute`, so a layer needs
  only `left`/`top`. Grandchildren are normal flow.
- **Playback.** `.is-idle` pauses everything until scrolled into view; `data-replay` and the `R`
  key restart it.
- **Fonts.** `--wp` is wp-admin's own stack, for redrawn UI that must match the plate. It matches
  exactly on the machine that captured the plate and approximates elsewhere — a Mac capture bakes
  SF while a Windows viewer renders Segoe UI. Acceptable for admin chrome; check it for large text.

Your piece stylesheet supplies the layers and the keyframes, nothing else.

## Layer budget

**Default to slices.** A slice is pixel-exact, weighs almost nothing, and cannot drift from the
product. Redrawing costs a handful of style values copied by hand and carries the font risk above.

Decide per element: **plate** (never changes), **image slice** (changes as a unit, pixels must be
the product's), or **DOM** (text that must stay real, or geometry that must move freely).

Redraw as DOM only when the text must be selectable and translatable, or when items reflow — table
rows, counts, a form the visitor types into. Use a slice for anything that appears or moves as a
block: a built form, a picker card, a settings panel.

## Timing

Put every beat in a custom property on the scene root and reference it everywhere. Retiming is then
editing a list of numbers, not hunting through rules. `build-page.py` emits this block from the
manifest's `vars`.

```css
#xx-scene { --t-open: 0.35s; --t-press: 4.6s; --t-land: 5.75s; }
.xx-card { animation: xx-rise .62s cubic-bezier(.22,1,.36,1) var(--t-open) both; }
```

Each beat should be *caused* by the one before it. Crossfading states reads as a slideshow.

## Sequential animations on one property

Two animations on the same property fight over the backwards fill: the later one's implicit `from`
applies from time zero and clobbers the earlier one. **Nest instead** — transforms compose and
opacities multiply.

```css
/* in at one beat, out at a later one */
.thing        { animation: in  .44s cubic-bezier(.22,1,.36,1) var(--t-a) both; }
.thing > span { animation: out .26s ease-in var(--t-b) both; }

/* two different shifts of the same element */
.below        { animation: down1 .5s cubic-bezier(.22,1,.36,1) var(--t-a) both; }  /* +134px */
.below > span { animation: down2 .42s cubic-bezier(.22,1,.36,1) var(--t-b) both; } /* -24.6px */
```

Give every keyframe set an explicit `from` — implicit ones resolve against the underlying value and
misbehave under fill.

## Image slices

Reveal parts of one screenshot in turn: one image, N positioned windows onto it.

```css
.field { left:330px; width:620px; background-image:var(--form);
  background-size:620px 528.3px; background-repeat:no-repeat;
  animation:drop .44s cubic-bezier(.22,1,.36,1) calc(var(--t-build) + var(--i) * .25s) both; }
```

Each slice sets `top: <formY + relY>px`, `height: <relH>px`, `background-position: 0 -<relY>px`.
Generate them from the measured geometry.

Slices of *different* states go at the same slot with only one visible at a time — but check their
heights, because different fields shift what follows by different amounts.

**Clipping a list changes its coordinate origin.** Wrapping animated rows in an `overflow:hidden`
container so a pushed row cannot escape means their `top` is now relative to that container, not to
the scene. Re-derive the offsets; reusing the scene-absolute ones is a silent few-hundred-pixel
error.

## Typing

Per-character reveal where untyped characters collapse to zero width, so a trailing caret sits
where the text really ends.

```css
.typed span { font-size:0; animation:key 1ms var(--d) both; }
@keyframes key { to { font-size:var(--fs) } }
.caret { display:inline-block; width:1.5px; height:1em; background:#111;
  animation:blink .9s steps(1,end) var(--t-type) 3, hide 1ms var(--t-done) forwards; }
```

Emit `<span style="--d:0.055s">c</span>` per character, `&nbsp;` for spaces, and add the beat with
`animation-delay: calc(var(--t-type) + var(--d))`.

Hand focus rings off between fields — two lit at once reads as a bug.

## Counters and label swaps

Stack the old and new glyphs in one grid cell so the change is a swap, not a reflow.

```css
.count { display:grid; place-items:center; }
.count b, .count i { grid-area:1/1; font:inherit; font-style:normal; }
.count b { animation:out .28s ease-out var(--t-count) both; }
.count i { animation:in  .28s cubic-bezier(.34,1.56,.64,1) var(--t-count) both; }
```

## Cursor

One 20×24 SVG arrow whose *tip* — not its box — lands on the target. Nest for multiple taps.

```css
.cursor { animation:move 1.5s cubic-bezier(.3,0,.2,1) var(--t-in) both,
                     away .7s ease-in calc(var(--t-out) + .3s) both; }
@keyframes move { from { transform:translate(1340px,960px) } to { transform:translate(396px,418px) } }
.tap-1 { display:block; animation:tap .34s ease-out var(--t-a) both; }  /* nested per tap */
@keyframes tap { 0%,100% { scale:1 } 34% { scale:.86 } }
```

## Signals between regions

Draw a curve, then wipe it. Compute the path length for the dash rather than guessing — an
over-long `dasharray` makes the last part of the animation do nothing.

```css
.trail path { stroke-dasharray:var(--len); stroke-dashoffset:var(--len);
  animation:draw .52s cubic-bezier(.4,0,.2,1) var(--t) both,
            wipe .34s ease-in calc(var(--t) + .5s) both; }
.spark { offset-path:var(--path); animation:fly .52s cubic-bezier(.4,0,.2,1) var(--t) both; }
```

Order the spark before the card it leaves, so it emerges from behind it.

## Reduced motion

Every animation uses `both` fill, so collapsing durations lands the whole scene on its final frame.

```css
@media (prefers-reduced-motion: reduce) {
  #xx-scene, #xx-scene * { animation-duration:1ms !important; animation-delay:0ms !important;
    animation-iteration-count:1 !important; }
  .caret { display:none; }   /* infinite blinks would flicker */
}
```

Verify it: `scrub.mjs` renders the reduced-motion frame, which must match the last scrubbed time.

## Specificity

`assets/shell.css` positions scenes with a class selector. An id-level rule in a piece stylesheet
(`#xx-scene { position:relative }`) **beats it**, and the scene silently falls out of its scaled
box. Do not set `position` in a piece stylesheet — the shell's `absolute` is also the positioning
context its children need.
