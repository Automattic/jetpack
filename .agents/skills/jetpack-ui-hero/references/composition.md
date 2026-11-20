# Composition and art direction

## House rules

Inherited from the Jetpack AI heroes page (`jetpack-ai-heroes.adamjfpickering.workers.dev`,
source `github.com/adampickering/jetpack-ai-heroes`), so a new set sits beside it rather than
beneath it:

- **No video, no GIF.** DOM or SVG plus CSS keyframes.
- **Real text.** Anything a reader could read is text, so it stays selectable and translatable.
- Starts when scrolled into view, replays on re-entry, plus a Replay button and the `R` key.
- `prefers-reduced-motion` lands on the final frame.
- Each piece ships a spec table. Beats, Weight and Made of are fixed; the fourth slot is
  discretionary — *Source* usually, *Status* for a flag-gated piece, or whatever the piece earns.
- One self-contained HTML file, every asset inlined.

## How long, how big

**Length: 8–9 seconds**, with the last beat landing around 6 and the rest held. Long enough to read,
short enough to loop on a replay without tedium. A simple piece can run 3–4 seconds; nothing needs
more than 10.

**Canvas: the capture viewport**, authored 1:1 and scaled to fit. 1280×820 to 1280×950 has worked
for admin screens; the block editor wanted 900 of height and a front-end page 950. Pick the size
that frames the content with the whole timeline in mind, then capture at exactly that.

Beats want ~0.4–0.6s between related events and a visible pause before a new idea. Cascades read
well at 0.25s apart, and at 0.55s when each item is its own beat.

## Choosing what to animate

Pick the moment that carries the claim, not the feature list. Strong candidates:

- **The payoff** — the thing the user installs the product to get.
- **The differentiator** — what this does that a competitor's version does not.
- **The mechanism**, but only when the mechanism *is* the pitch (it is blocks; it is a rule).

A feature that only makes sense after two other explanations is not a hero.

## Don't repeat the set's shapes

The AI set already spends two of its four pieces on *things arriving around a centre* — provider
bubbles orbiting a toggle, site pills popping in around a hub. A third radial arrival stops reading
as a house style and starts reading as a tic.

Before committing, ask what the motion's **shape** is — radial, linear, cascading, assembling,
adapting — and pick one the set does not already lean on. When the obvious treatment for a subject
is a fan-out, a vertical list of the same information usually says it just as clearly.

Give each piece its own signature move. If one piece's is typing, the next one's should not be.

## Framing

- **Include the chrome that carries the claim.** The wp-admin sidebar is what says "this is in your
  WordPress", so a dashboard piece keeps it.
- **Crop on a column boundary, never through content.** A card that clips "Book a shoot" to "B"
  reads as a bug; the same card starting exactly at the column edge reads as depth.
- **Give a floating card a device frame** when it belongs to a different surface than what is
  behind it — a small browser window over an admin screen says "visitor" instantly.
- Soften a deliberate cut with an edge fade rather than a hard clip.
- Check the whole timeline for fit, not just the first frame: a piece that grows (a field appearing,
  a row pushing a list down) can push its own call-to-action out of frame at the end.
- Clip a list you animate to the region it really occupies, or a pushed row escapes past the footer.

## Honesty

These end up in front of customers, so:

- Screenshot the real product. Redraw for motion, never to improve the design.
- Do not show a state the product cannot produce. Hiding a column is fine — the settings gear does
  it. Inventing a status pill is not.
- No real IP addresses, no real personal data, no real customer names.
- Flag-gated UI must be labelled as such, on the page and to whoever asked for it.

## Continuity across a set

Only relevant once there are two or more pieces — skip it for a one-off.

Keep one persona and one site identity across every piece, and capture them all from **one** site.
Rename the site and the admin user before the first capture, so the admin bar does not say
"Vocational Manatee" and "Howdy, demo".

Invented names are a liability: once a name appears in four pieces, changing it is four
re-captures. Ask whether marketing has a persona sheet before the second piece.
