---
description: >
  Write, run and share a Rehearsal (a repeatable JSON check run from Tools → Rehearsal on any
  Jurassic Ninja site) for a user-facing Jetpack change, and put it in the PR so reviewers can
  repeat exactly what the author checked. Use while building or fixing anything a site owner or
  visitor would see or click (admin screens, blocks, settings, front-end output, onboarding
  flows), when verifying such a change on a JN site, when opening or updating its PR, when
  reviewing a PR whose body has a `<!-- rehearsal v1 -->` block, or when the user says
  "rehearsal", "/jetpack-rehearsal", "add a rehearsal" or "rehearse this". Skip it for backend-only,
  tooling, docs, test-only or refactor PRs with nothing to click.
---

# Jetpack Rehearsal

A **rehearsal** is a short list of steps (go to a page, click, fill, expect) that the Companion
plugin runs in the browser against a Jurassic Ninja site, saving every run on the site as a
read-only record. Every new JN site has it under **Tools → Rehearsal**
(`/wp-admin/tools.php?page=rehearsal`). The full step reference lives in the Companion repo's
[`rehearsal/README.md`](https://github.com/Automattic/companion/blob/master/rehearsal/README.md);
read it before writing your first rehearsal in a session, rather than guessing at step names.

Why bother, when you could just click through yourself:

- **The agent's verification becomes visible.** A rehearsal is the checklist you ran, written down,
  and its runs are on the site under **Recent runs**, filterable by who ran them. A developer can
  see exactly what was checked and what the page showed when a step failed.
- **Reviewers repeat the same check.** The rehearsal ID is a hash of the steps, so two runs with
  the same ID checked the same thing, on any site. Testing instructions in prose drift; steps don't.
- **It outlives the PR.** `covers` labels let a future CI job pick rehearsals by what changed.

## When to write one

Write one for each behavior a user of the change would notice: the screen that now loads, the
setting that now saves, the block that now renders, the bug that no longer happens. One to three
rehearsals per PR is typical; a rehearsal per acceptance criterion is a good rule of thumb.

Write it **while** developing, not after: draft the steps as soon as you know what "working"
looks like, run them against trunk to watch them fail (for a bug fix), then against your branch.
That before/after is the strongest evidence a PR can carry.

Skip it when nothing in the change can be reached from a browser.

## 1. Get a site running the branch

Use `jn-new` (new work) or `jn-pr-review` (an existing PR) to provision a site, and
`jetpack-test-jurassic-ninja` to rsync the branch to it. Rehearsal ships with Companion, so there
is nothing to install. If **Tools → Rehearsal** is missing, the site predates it; make a new one.

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

Conventions for Jetpack rehearsals:

- **Title**: `<Product>: <what a user sees working>`, the same prefix the changelog entry uses,
  e.g. `Forms: "Create a form" opens its dialog`. Add `(changes the site)` when it saves,
  creates or deletes anything.
- **`covers`**: the monorepo project paths the change touches (`packages/forms`,
  `plugins/jetpack`), so CI can select by changed project later.
- **`requires`**: every plugin the steps depend on (`jetpack`, `jetpack-boost`, …), so a site
  without it shows the rehearsal as disabled instead of failing it.
- **`role`**: set it when the change is about what a non-admin can or can't do.
- Use stable selectors: ids, `role=`, `aria-label`, `text=`. Avoid generated class names from
  CSS modules or emotion; they change between builds.
- Make anything you create unique with `{{run}}` and find it again by that text, so reruns don't
  trip over the last run's leftovers.
- End with `{ "expectNoConsoleErrors": true }` unless the screen has known noise; then use
  `"ignore"` with a regex for that noise rather than dropping the check.
- After a click that loads a page, expect something only the new page has.
- The browser runner can't leave the site (WordPress.com connection flows), take screenshots, or
  open CSS-`:hover`-only menus. For those set `"needs": "playwright"`.

## 3. Save it on the site

By hand: **Tools → Rehearsal → Add rehearsal**, paste the JSON, **Save**. Saving validates it and
says what is wrong.

From an agent, over the site's SSH (see `jetpack-test-jurassic-ninja` for access), call the REST
route as an administrator. Write the PHP to your scratchpad:

```php
<?php
$request = new WP_REST_Request( 'POST', '/rehearsal/v1/rehearsals' ); // `/rehearsals/<id>` updates.
$request->set_param( 'title', 'Forms: "Create a form" opens its dialog' );
$request->set_param( 'recipe', json_decode( <<<'JSON'
{ "requires": [ "jetpack" ], "covers": [ "packages/forms" ], "steps": [ … ] }
JSON
, true ) );
echo wp_json_encode( rest_do_request( $request )->get_data(), JSON_PRETTY_PRINT ), "\n";
```

```bash
ssh -o BatchMode=yes {domain}@ssh.atomicsites.net \
  'cd /srv/htdocs && wp --user="$(wp user list --role=administrator --field=ID --number=1)" eval-file -' \
  < save-rehearsal.php
```

The response has the post `id`, the rehearsal `hash`, and `shareUrl`. A `rehearsal_invalid` error
carries the validation message; fix the JSON and post again.

## 4. Run it

- **In the browser runner** (preferred: the run is saved on the site, where the developer can see
  it). With a browser tool, open `/wp-admin/tools.php?page=rehearsal`, press the rehearsal's
  **Run** button, and read the log under it. Keep the tab in the foreground: background tabs
  throttle timers and make steps time out. A failing step says what it waited for and what the
  page showed; **Copy errors** gives a plain-text report of console errors.
- **In Playwright** (for `needs: "playwright"`, or with no browser tool): fetch
  `<shareUrl>&format=playwright` into a `.spec.ts` and run it with `STORAGE_STATE` pointing at a
  logged-in session; the README's "Running rehearsals in Playwright" section has the commands.
  These runs are **not** saved on the site, so paste the result into the PR yourself.

For a bug fix, run it once before syncing the fix (it should fail) and once after (it should pass),
and mention both in the PR.

If a step fails because the rehearsal is wrong rather than the code, fix the rehearsal; that changes
its ID, which marks earlier results **Stale**. Never weaken a step just to get a pass.

## 5. Put it in the PR

Open the rehearsal (click its title), and in **Share** press **Copy as: GitHub**. That copies a
block starting `<!-- rehearsal v1 -->` with the ID, the last result and build, links to the share
page, JSON and Playwright test, and the full JSON folded in `<details>`. Without a browser, build the
same block from the REST response (keep the marker comment so tools can find it):

````markdown
<!-- rehearsal v1 -->
#### Rehearsal: Forms: "Create a form" opens its dialog

Rehearsal `<first 8 of hash>` · 5 steps · covers `packages/forms`
Last run: **Passed** on <build>, run #<n>, <date>.
[View or install this rehearsal](<shareUrl>) · [JSON](<shareUrl>&format=json) · [Playwright test](<shareUrl>&format=playwright)

<details>
<summary>Rehearsal JSON</summary>

```json
{ … }
```

</details>
````

Put the blocks under **Testing instructions**, after a one-line pointer such as "Run the
rehearsals below from Tools → Rehearsal on any JN site." Keep the prose steps for anything the
rehearsals don't cover, and say which is which. The folded JSON is what matters: share links stop
working when the JN site expires, and the JSON lets anyone recreate the rehearsal with the same ID.

`jurassic.ninja` site URLs are fine in a public PR. Before any screenshot of the Rehearsal screen,
turn off the JN credentials notice (Companion option `jurassic_ninja_credentials_notice`); it shows
the site password.

When the PR changes later, rerun the rehearsals on the updated branch and refresh the blocks, or add
a rehearsal for new behavior.

## Reviewing a PR that has rehearsals

1. Find the blocks: `gh pr view <n> --json body -q .body | grep -n 'rehearsal v1'`.
2. Get a site on the PR branch (`jn-pr-review`).
3. Install each rehearsal: paste its share link into **Tools → Rehearsal → Install from link**
   while the author's site exists, or save its folded JSON as in step 3 when it doesn't. Either
   way the ID stays the same, so your result compares directly with the author's.
4. Run them, and report the ID and result in the review. A pass with the same ID is the author's
   check reproduced; a fail comes with the step and what the page showed.
5. Read the steps as critically as the code. A rehearsal that only checks that a page loads, or
   whose `expect` would pass on trunk too, proves nothing; say so, and suggest the step that would.
