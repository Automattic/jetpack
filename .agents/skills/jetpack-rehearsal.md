---
description: >
  Write, run and share Rehearsals (repeatable JSON browser checks, Tools → Rehearsal on every
  Jurassic Ninja site) for user-facing Jetpack changes, and put them in the PR's testing
  instructions so reviewers rerun exactly what the author checked. Use when verifying a
  user-facing change on a JN site, when writing testing instructions or opening the PR for one,
  when reviewing a user-facing PR (to run its `<!-- rehearsal v1 -->` blocks or propose some),
  or when the user says "rehearsal", "/jetpack-rehearsal" or "rehearse this". Not for
  backend-only, tooling or docs changes, committed e2e tests, or purely visual CSS fixes (use
  jetpack-screenshot for those).
---

# Jetpack Rehearsal

A **rehearsal** is a short JSON list of steps (go to a page, click, fill, expect) that the
Companion plugin runs in the browser against a Jurassic Ninja site. Every run is saved on the site
as a read-only record, so a developer can see exactly what an agent checked, and a reviewer can
repeat it: two runs with the same rehearsal ID checked the same thing, on any site.

Every JN site has it under **Tools → Rehearsal** (`/wp-admin/tools.php?page=rehearsal`). The
step reference is the Companion repo's
[`rehearsal/README.md`](https://github.com/Automattic/companion/blob/master/rehearsal/README.md):
read it before writing your first rehearsal in a session instead of guessing step names.

## When to write one

One rehearsal per behavior a user of the change would notice: the screen that now loads, the
setting that now saves, the notice that now appears. One to three per PR is typical. Write them
while developing, as soon as you know what "working" looks like.

Skip it when nothing in the change can be reached from a browser, or when the only change is how
something looks (the runner can't assert layout or color; use `jetpack-screenshot`).

## 1. Get a site

Provision one with `jetpack-test-jurassic-ninja` (or `jn-pr-review` for an existing PR). Before you
sync your branch, the site runs released Jetpack: that is your "before" state. If `wp rehearsal`
is missing, the site's Companion predates it; make a new site.

## 2. Write the steps

```json
{
  "requires": [ "jetpack" ],
  "covers": [ "packages/forms" ],
  "steps": [
    { "goto": "/wp-admin/admin.php?page=jetpack-forms-responses-wp-admin&p=%2Fforms" },
    { "click": "[role=dialog] button[aria-label=\"Close\"]", "optional": true, "timeout": 4000 },
    { "click": "text=Create a form" },
    { "expect": "[role=dialog] button:has-text(\"Create\")", "toBeVisible": true },
    { "expectNoConsoleErrors": true }
  ]
}
```

### Make it fail without your change

This is what makes a rehearsal evidence rather than a page-load check. For **every** expect, name
what the "before" site renders that makes it fail, and scope the selector to the changed part of
the screen (`section:has-text("Top referrers") >> a`, not `a`), so a match elsewhere on the page
can't satisfy it. These pass whether or not the change works:

- A `"not": true` expect, or `toHaveCount: 0`, on a page that hasn't rendered yet. Put a positive
  expect for the same area first.
- "Nothing happened" checks (the tab stayed selected, no notice appeared) are true the instant the
  click returns. Expect a positive sign of the new behavior instead, or wait on something that
  only renders afterwards.
- `toBeDisabled` on a Save button that is disabled anyway because the form is unchanged.
- `toBeVisible` on a hover-revealed control: it ignores opacity, so `opacity: 0` counts as visible.
- `waitFor` on `body`, `h1` or anything else every page has.

### Check preconditions first

A rehearsal that fails because the site lacks a module, a connection, a feature flag or data
looks exactly like a regression. Right after the `goto`, add a guard that the screen exists
(`{ "expect": "h1", "toContainText": "…" }`) so a failure reads as "screen not available", and say
in the PR what site state it needs. `requires` only checks plugins; each entry must be active, and
an entry can be either-or (`"jetpack or jetpack-premium-analytics"`).

### Conventions

- **Title**: `<Product>: <what a user sees working>`, the changelog entry's prefix. Add
  `(changes the site)` when it saves, creates or deletes anything. Avoid quotes in titles: they
  come back HTML-encoded (`&#8220;`) everywhere the title is shown.
- **`covers`**: every monorepo project whose code the steps exercise, including unchanged ones.
- **`requires`**: every plugin the steps depend on, so a site without one shows the rehearsal as
  disabled instead of failing it.
- **`role`**: set it when the change is about what a non-admin can or can't do.
- **`timeout`**: the default is 10 s per step. Block editor and wp-build dashboard pages often need
  `"timeout": 30000` at the rehearsal level.
- **Selectors**: ids, `[role=tab]`, `aria-label`, `text=`. Not generated class names from CSS
  modules (`a5fd8814f195aa5e__tab`). Write roles as CSS (`[role=tab]:has-text("Settings")`), which
  reads the same in both runners. `text=` is a case-sensitive
  substring in the browser runner and case-insensitive in Playwright, so match the exact case.
  Text matching assumes the site is in English.
- **URLs**: wp-build dashboards route only from `p=` (`&p=%2F%3Ftab%3Dsettings`); a top-level
  `&tab=` is ignored. Copy the URL from the package's PHP URL helper or the browser.
- **Unique data**: put `{{run}}` in anything you create and find it again by that text.
- **Console errors**: end with `{ "expectNoConsoleErrors": true }`. For known noise use
  `{ "expectNoConsoleErrors": { "ignore": [ "<regex>" ] } }` rather than dropping the step. It
  counts every error since the run started, not just since the last step.
- After a click that loads a page, expect something only the new page has.

### Runner gotchas

- **Native dialogs** (`confirm`, `alert`, `prompt`): answer them with a step placed *before* the
  one that opens the dialog: `{ "dialog": "accept" }`, `{ "dialog": "dismiss" }` or
  `{ "dialog": "accept", "value": "prompt text" }`. Unanswered dialogs are dismissed, so a
  rehearsal of "asks before leaving" must accept or dismiss explicitly and then check the outcome.
- Block content is inside the editor iframe: `iframe[name="editor-canvas"] >> [data-type="jetpack/contact-form"]`.
- `fill` works on inputs and textareas, not rich text; `press` sends keys, not characters.
- The browser runner can't leave the site (WordPress.com connection flows), take screenshots, or
  open CSS-`:hover`-only menus. Mark those `"needs": "playwright"`.
- Invert a matcher with `"not": true`; `"toBeVisible": false` is rejected.

## 3. Save it on the site

All commands below run over the site's SSH (access: `jetpack-test-jurassic-ninja`) from
`/srv/htdocs`, as an administrator. Shorthand used here:

```bash
WP='cd /srv/htdocs && wp --user="$(wp user list --role=administrator --field=ID --number=1)"'
ssh -o BatchMode=yes {domain}@ssh.atomicsites.net "$WP rehearsal save - --title='Forms: Create a form opens its dialog' --format=json" < rehearsal.json
```

`save` takes the rehearsal JSON (or what a share link returns with `&format=json`) from a file or
`-` for stdin, validates it, and prints the post `id`, `hash`, `shareUrl` and `runUrl`. Saving the
same title and steps again returns that rehearsal with `"existing": true` instead of a copy, so
rerunning a script is safe.

By hand: **Tools → Rehearsal → Add rehearsal**, paste the JSON, **Save**.

## 4. Run it

Run it once **before** syncing your branch, where it should fail at the step you expect (not
earlier), and once after, where it should pass. That pair is the strongest evidence a PR can carry.

Label every run with a `ref`, the branch name or PR number, so the runs for this work can be found
again, by you or by a developer checking what an agent did.

- **Run link** (browser runner, no clicks): open `<runUrl>&ref=<label>` in a logged-in browser; the
  runs start as soon as the screen loads. Wait for `#rh-app[data-run-status]` to become `pass`,
  `fail`, `queued` or `error`; `data-run-ids` lists the saved runs. Keep the tab in the foreground,
  since step timers pause in a hidden tab. `wp rehearsal list --format=json` gives each rehearsal's
  `runUrl`.
- **Playwright export**, for `"needs": "playwright"` rehearsals or with no browser tool: fetch
  `<shareUrl>&format=playwright` and run it with `STORAGE_STATE` (an admin session, see "Logging
  Playwright in") and `REHEARSAL_REF=<label>`. Each result is saved on the site as a run marked
  "in Playwright".
- **By hand**: the rehearsal's **Run** button; the log appears under it, and **Copy errors** gives
  a plain-text report of console errors.

Read results as JSON rather than from the screen:

```bash
ssh -o BatchMode=yes {domain}@ssh.atomicsites.net "$WP rehearsal runs --rehearsal=<id> --ref=<label> --format=json"
```

Each run has its `status`, `hash`, `runner` (`browser` or `playwright`), `build` and per-step `log`.
A failing step says what it waited for and what the page showed.

If a step fails because the rehearsal is wrong rather than the code, fix the rehearsal. Never
weaken a step just to get a pass. The rehearsal ID is a hash of the whole JSON except `format`
(steps and settings, not the title), so any edit marks earlier results **Stale**.

## 5. Put it in the PR

```bash
ssh -o BatchMode=yes {domain}@ssh.atomicsites.net "$WP rehearsal block <id>"
```

prints the PR block, the same one **Copy as: GitHub** copies: a `<!-- rehearsal v1 -->` marker,
the ID and latest result, links, and the JSON folded away. Paste it under **Testing instructions**,
after a line like "Run the rehearsals below from Tools → Rehearsal on any JN site." Keep prose
steps for what the rehearsals don't cover, and say which is which.

Keep the folded JSON in the block. Share links stop working when the JN site expires; the JSON
recreates the rehearsal with the same ID on any site.

`jurassic.ninja` URLs are fine in a public PR. Before any screenshot of the Rehearsal screen, turn
off the JN credentials notice, which shows the site password:
`wp option patch insert companion jurassic_ninja_credentials_notice 0`.

When the PR changes, rerun the rehearsals and refresh the blocks.

## Reviewing a PR

1. Find the blocks: `gh pr view <n> --json body -q .body | grep -n 'rehearsal v1'`. If there are
   none and the PR is user-facing, draft the rehearsals you would want from the diff and suggest
   them in the review.
2. Read the steps as critically as the code, before any site exists: would each expect fail
   without the change (see "Make it fail without your change")? Are `covers` and `requires`
   right? Say which steps prove nothing, and suggest the ones that would.
3. Get a site on the PR branch (`jn-pr-review`) and install each rehearsal:
   `wp rehearsal install "<share link>" --yes` while the author's site exists, or `wp rehearsal
   save` its folded JSON when it doesn't (**Install from link** and **Add rehearsal** by hand).
   Either way the ID stays the same.
4. Run them with `ref` set to `review-<PR number>`, and report each ID and result. A pass with the
   author's ID reproduces the author's check; a fail comes with the step and what the page showed.

## Logging Playwright in

Mint a session on the server, without spending `?auto_login` or changing a password:

```bash
ssh -o BatchMode=yes {domain}@ssh.atomicsites.net 'cd /srv/htdocs && wp eval '"'"'
$u = get_users( array( "role" => "administrator", "number" => 1 ) )[0];
$exp = time() + 7200;
$t = WP_Session_Tokens::get_instance( $u->ID )->create( $exp );
echo SECURE_AUTH_COOKIE, "=", wp_generate_auth_cookie( $u->ID, $exp, "secure_auth", $t ), "\n";
echo LOGGED_IN_COOKIE, "=", wp_generate_auth_cookie( $u->ID, $exp, "logged_in", $t ), "\n";
'"'"''
```

Put both cookies (`domain: {domain}`, `path: /`, `httpOnly`, `secure`) in a Playwright storage
state file. The monorepo's Playwright is in `tools/e2e-commons/node_modules`.
