# Capture traps

Every entry here is a failure that produced a *plausible-looking wrong capture* rather than an
error. Read before capturing; re-read when a frame looks subtly off.

- [Getting a session](#getting-a-session)
- [React admin screens](#react-admin-screens)
- [Selectors you can rely on](#selectors-you-can-rely-on)
- [Playwright in the monorepo](#playwright-in-the-monorepo)
- [The clean plate](#the-clean-plate)
- [Measuring](#measuring)
- [The block editor canvas](#the-block-editor-canvas)
- [DataViews tables](#dataviews-tables)
- [Front-end pages](#front-end-pages)
- [Images](#images)
- [Seeding data](#seeding-data)
- [Feature-flagged UI](#feature-flagged-ui)

## Getting a session

Provision a throwaway site with the `jurassic-ninja` provider (`context-a8c` MCP): `provision-site`
with `{"jetpack":"true"}`, poll `list-sites` until `status` is `2`, then `connect-jetpack`.

Log in with `login()` from the capture kit, which drives `?auto_login` and saves `storageState`.
That link is **one-shot** — do not `curl` it, do not let a link preview touch it. If it is already
consumed, a fresh site is cheaper than repairing one; but use **one site per set**, or the pieces
disagree about whose site they are showing.

**`storageState` is a credential.** It holds live session cookies. Keep it in the working
directory, and delete it before copying that directory anywhere.

Renaming the admin user takes **two saves**: WordPress builds the `display_name` dropdown from the
*saved* name, so the new option does not exist on the page you are submitting. Save first/last
name, reload, select the new display name, save again — otherwise the admin bar still reads
"Howdy, demo".

**Never put the JN password on a command line.** The sandbox blocks it as credential
materialisation, and you do not need it: the browser session covers everything below.

Many Jetpack features need a connection, and an inactive module looks exactly like broken block
markup: an empty wrapper `<div>` with no `<form>` inside. **The two are indistinguishable by
symptom** — connecting Jetpack may not fix it, because stale markup produces the same empty
wrapper. Check both before concluding either.

JN rate-limits: a burst of requests returns a **429 HTML page**, which surfaces as apiFetch's "The
response is not a valid JSON response." Back off ~75s rather than debugging the call.

## Playwright in the monorepo

`import 'playwright'` fails everywhere — it is hoisted into pnpm's store and no package the scripts
run from depends on it. Use `playwright()` from `scripts/capture-kit.mjs`, and run from inside the
monorepo or set `PLAYWRIGHT_ROOT`. It is CommonJS, so a direct import needs `.default`.

Capture at `deviceScaleFactor: 2` and place the image at logical size in the scene.

`toWebp()` shells out to Python **Pillow**. Call `preflight()` at the top of a capture script so a
missing dependency fails before a run that has already spent a site.

## The clean plate

The rule is in SKILL.md. What is easy to get wrong is the list.

Blank, at minimum: every count and badge, the document title wherever it is echoed, any status
pill or button whose label changes, and any row list you intend to animate.

Two that are easy to miss because they are far from the thing you are animating:

- A **count repeated in several places** — a WP admin sidebar badge, a tab badge, a filter pill and
  a table footer can all show the same number. Blank and animate all of them together.
- The **document bar title** in the block editor, which echoes the post title you are typing into
  the canvas.

Transient chrome lands on top of clipped crops. Hide `.components-snackbar-list` (the "New form
created." toast) before any crop, and call `dismissModals()` — an open modal does **not** break DOM
queries inside an iframe, so measurements look correct while every crop captures the modal.

## React admin screens

"Network idle" is not "finished rendering". My Jetpack will happily screenshot with a spinner
inside every product card. Call `settle()` before any capture; it waits for `.components-spinner`
and `[aria-busy="true"]` to clear and throws rather than let you capture a loading state.

## Selectors you can rely on

Jetpack admin screens ship CSS-module class names like `J94mUfxvLuP1Gu8JjQdO` that change on every
build. Never build a selector from one.

Anchor on something stable — an ARIA label — walk to the element you actually want, and stamp your
own id on it with `stampId()`, so every later `measure`, `crop` and `hidePage` call uses a selector
you control:

```js
await stampId(page, 'input[aria-label="Toggle Downtime Monitor module"]', 'hero-toggle', 'td')
```

Some hidden inputs share a rect with the visible control they drive (a `components-form-toggle`
input and its span), so measuring the input works — but confirm it rather than assume it.

Scanning `querySelectorAll('*')` to find text to blank — the clean-plate idiom below — **throws on
SVG elements**, whose `innerText` is `undefined`. Guard every such scan with `(el.innerText || '')`.

## Measuring

**Before capturing a two-state control, diff the whole frame, not the control.** Flipping a toggle
can move a count, a filter pill or a row height somewhere else entirely. Measure everything in both
states and compare; the blanking rule tells you what to do about a change, not how to find it.

Never eyeball a coordinate. Read `getBoundingClientRect()` and `getComputedStyle()` for every
element you will redraw, dump to a JSON file, and generate the CSS from it.

Copy the real values: font shorthand, colour, border-radius, and the row pitch (measure it as
`row[1].y - row[0].y`, do not assume it equals the row height).

**Hiding anything can move everything.** After injecting CSS that hides an element, re-measure —
do not reuse rects taken before the injection.

Sample real colours out of the PNG rather than guessing them. Avatar and status-pill colours are
generated, not from a palette you can look up.

**Read the computed font of any text you redraw, and load it.** A theme may set the post title in
Cardo; the builder's default font list is Inter only, so redrawn text silently falls back and the
overlay stops matching the plate. Add the family to the manifest's `fonts` key.

Row pitch is `measureAll()[1].y - [0].y`, not a row's height — the two differ whenever rows have
gaps or borders.

## The block editor canvas

The canvas is an **iframe**. Rects measured inside it are relative to the iframe, so add the
iframe's page offset (`frameOffset()`); it is typically 96px down.

Inject CSS into the iframe's own document (`hideInFrame()`), not the page.

The **starter-pattern modal** ("Choose a pattern") opens on every new page and covers everything.
The `enableChoosePatternModal` preference does not reliably persist — dismiss it in the same run as
the capture and assert it is gone.

`wp.data` is the reliable way to drive the editor: `insertBlocks`, `updateBlockAttributes`,
`clearSelectedBlock`, `savePost`. Real clicks fail on variation tiles because a hover preview modal
intercepts pointer events — find the `<button>` inside the `<li>` and call `.click()` on it.

To capture a "nothing selected" state, `clearSelectedBlock()` and hide
`.block-editor-block-list__block::after`, which draws the selection outline.

## DataViews tables

Do **not** delete a `<th>` to drop a column: the fixed layout redistributes the widths into
nonsense, and forcing widths back is fought by the component. Use the table's own settings gear →
Properties to hide the field. That preference **does not survive a reload**, so toggle it in the
same run as the capture.

If a column cannot be hidden, crop the frame so it falls outside, and fade the cut edge.

DataViews gives the primary title cell no class of its own; identify cells positionally.

## Front-end pages

**Do not scroll before capturing.** A short page clamps `scrollTo`, so the content lands somewhere
you did not ask for and every measurement shifts silently. Capture the page whole in a tall
viewport and slide the plate up inside the scene (`inset: -180px auto auto 0`) to frame it.

Hiding the site footer to keep it out of frame shortens the page — which is exactly what causes the
clamp above. Expect it, and re-measure.

Native `<select>` dropdowns are drawn by the OS, so assume they cannot be screenshotted. Elide the
dropdown: show the cursor click and the value change with a focus ring.

`#wpfooter` is the WordPress admin footer, not the app footer a Jetpack screen renders. Check what
you actually hid.

## Images

**Lossless WebP beats lossy for UI screenshots** — smaller *and* crisp. Flat UI compresses better
losslessly than a photograph does. Use `toWebp()`; it keeps alpha when the source has it, which
matters for any crop taken with `omitBackground`.

## Seeding data

Submit real forms through the front end rather than inserting rows. The submission path fills in
fields you would otherwise get wrong.

Deactivate **Akismet** first: test submissions have been reported landing in a custom `spam` status
that the dashboard hides and `wp post list` does not show. Cheap insurance, not verified here.

Getting an authenticated REST session: `wpApiSettings.nonce` is often **missing** on Jetpack admin
screens. The route that works is to navigate to a block-editor page and use `wp.apiFetch`, which
carries its own nonce.

Posting block markup through the REST API is unreliable for Jetpack Forms: flat field markup is
stored as-is, and the front end renders an empty wrapper. Opening the post in the editor upgrades
it to the current nested shape — so **open it in the editor and re-save** before it will render.
Some attributes (`conditionalLogic`) are dropped by the parse entirely and must be written with
`updateBlockAttributes`.

**Reading an attribute back is not proof it took effect.** A default object like
`{enabled:false,…}` is truthy, so every field reports "set". The only real check is behavioural:
load the front end and confirm the thing actually happens.

Vary the seeded timestamps. Real seeding produces rows all within the same minute, which looks
fake; since rows are usually redrawn as DOM, write plausible dates there instead.

## Feature-flagged UI

Jetpack feature flags are **filter-only** (`jetpack_feature_flag_enabled_{slug}`) — there is no
option to set and no admin toggle. To capture flagged UI, upload a one-line plugin through
Plugins → Add New → Upload with Playwright's `setInputFiles`; that needs no SSH and is trivially
reversible.

A piece built this way **depicts something users cannot see**. Say so on the page itself — a
`Status` row in the spec table — and say so to whoever asked for it.
