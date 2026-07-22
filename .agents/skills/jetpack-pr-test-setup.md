---
name: jetpack-pr-test-setup
description: >
  Turn a Jetpack GitHub PR into a site you can actually exercise: provision a fresh
  Jurassic Ninja site, activate the PR's branch build with the Jetpack Beta Tester
  plugin, then decode the PR's "Testing Instructions" and apply the feature-state
  setup they require (feature flags/options via mu-plugin, paid plan/product state
  via a WPCOM blog sticker), and point you at the exact UI entry point to review.
  Use when the user says "jetpack-pr-test-setup", "/jetpack-pr-test-setup", "set up
  PR <n> for testing", "get PR <n> testable", "the testing instructions need a flag/
  sticker/feature", or gives a Jetpack PR number/URL and is blocked on its Testing
  Instructions (a required flag, option, plan, or feature that isn't on by default).
  Delegates site provisioning to jetpack-test-jurassic-ninja and hands off evidence
  capture to jetpack-screenshot. Does NOT run automated code review.
allowed-tools: Bash, Read, Glob, Grep
---

# Jetpack PR Test Setup — decode the Testing Instructions and get a testable site

`jn-pr-review` and `jetpack-test-jurassic-ninja` get you a site running a PR's *code*.
This skill owns the half that keeps blocking reviews: getting that site into the
**state** the PR's Testing Instructions demand — the flag that isn't on, the option that
defaults false, the paid plan the feature needs — and then telling you exactly where to
click.

The delivery mechanism here is deliberately **Beta Tester, not build+rsync**: it activates
the PR's published branch build with no SSH/SFTP dance and no worktree. Rsync stays only as
a fallback for PRs that have no beta build.

## Composition

```
jetpack-test-jurassic-ninja (provision-only)   → fresh connected JN site
      ↓
this skill: wp jetpack-beta activate <plugin> <PR-branch>   (rsync fallback if no build)
      ↓
this skill: apply feature-state setup from the Testing Instructions
            · flags / options  → mu-plugin        [AUTONOMOUS — reversible, throwaway site]
            · plan / product   → WPCOM blog sticker [CONFIRM-FIRST — mutates real WPCOM by blog ID]
      ↓
this skill: locate the UI entry point → hand off to jetpack-screenshot
```

**v1 scope:** feature flags/options and plan-via-blog-sticker only. **Out of scope for v1:**
establishing a required social/OAuth *connection* (e.g. a Publicize account link), and
pointing the JN site's API traffic at a WPCOM sandbox. If the Testing Instructions require
either, apply everything else, then report the remaining precondition as a clearly-labelled
manual step rather than attempting it.

## Input

A Jetpack PR number (`50227`), `#50227`, or a `github.com/Automattic/jetpack` PR URL. If
none is given, default to the current branch's open PR (`gh pr view`).

## Autonomy — the hybrid rule

Classify every setup step before running it:

- **Reversible / throwaway** → **do it, don't ask.** Anything scoped to the JN site: mu-plugins,
  `add_filter`, `update_option`, `wp jetpack-beta activate`, module activation. JN sites are
  disposable and expire in 7 days.
- **Mutates real WPCOM by blog ID** → **confirm first, always.** Blog stickers are keyed by blog
  ID against live WPCOM infrastructure; a transposed digit writes to someone else's site. Echo
  the exact blog ID and the exact command, and get an explicit yes before it runs.

When in doubt, treat a step as the second category.

## Workflow

### 0. Resolve the PR and read its Testing Instructions

```bash
gh pr view <PR> --repo Automattic/jetpack \
  --json number,title,headRefName,author,state,isDraft,files,body
```

- Keep `headRefName` — that's the branch Beta Tester activates.
- Keep `.files[].path` — that drives plugin detection in step 2.
- Pull the **Testing Instructions** section out of `.body`. Extract every precondition it
  states — phrases like "Requires…", "add_filter(…)", "Enable…", "Upgrade … to Pro", "with the
  X feature", "at least one … connection", "add the blog sticker …". This list is the setup
  plan for steps 3–6. If the body has no testing section, say so and ask the user what state
  the feature needs.

### 1. Provision a fresh JN site (delegate)

Run `jetpack-test-jurassic-ninja` in **`provision-only`** mode — a fresh, Jetpack-connected
site is all we need; there's nothing to rsync. Follow that skill for the MCP calls; the
essentials:

- `jurassic-ninja / provision-site` with `features: {"jetpack": "true"}`.
- Poll `list-sites` (`include_config:false`) until `status == 2` (cap ~3 min).
- `connect-jetpack` (domain). **Capture the `blog_id`** — the blog-sticker step needs it.

A brand-new install matters: it makes gates like `jetpack_seo_surface_visible` seed to `true`
(see step 4), so the flag alone is usually enough.

### 2. Activate the PR branch with Jetpack Beta Tester

**Map the PR to a Beta Tester plugin target** (same logic as `jn-pr-review` step 3):

- `projects/plugins/<slug>/…` changed → that plugin (`jetpack`, `jetpack-boost`, `social`,
  `search`, `protect`, `videopress`, `crm`, …).
- `projects/packages/<pkg>/…` **only** (no plugin path) → **`jetpack`** — the branch build
  bundles the package via the autoloader. This is the common case for the SEO/`packages/seo`
  PRs.
- More than one plugin affected, or a package that plausibly belongs to a non-`jetpack`
  plugin → **ask** which to activate.

**Ensure the Beta plugin is present, then activate** (WP-CLI over the JN site's SSH; the JN
skill has the SSH host — `<domain>@ssh.atomicsites.net`):

```bash
ssh <domain>@ssh.atomicsites.net 'cd /srv/htdocs && \
  wp plugin is-installed jetpack-beta || wp plugin install jetpack-beta --activate; \
  wp plugin activate jetpack-beta; \
  wp jetpack-beta list <plugin>'                      # confirm the PR branch appears
```

Then activate the PR's branch (the CLI's `install_and_activate` downloads the branch build
and switches to it in one call — `<branch>` is `headRefName`, treated as a PR source):

```bash
ssh <domain>@ssh.atomicsites.net 'cd /srv/htdocs && \
  wp jetpack-beta activate <plugin> "<headRefName>"'
```

Verify it took: `wp jetpack-beta list <plugin>` should mark `<headRefName>` active (`*`), and
`wp plugin list --status=active` should show the plugin.

**Fallbacks, in order:**
1. `wp jetpack-beta list <plugin>` doesn't include the branch, or `activate` errors that the
   branch/build isn't found → **no beta build exists for this PR.** Fall back to
   `jn-pr-review`'s build + rsync path to get the code onto the site, then return here for
   step 3.
2. No SSH key access to the JN host → drive the Beta Tester UI in the browser instead
   (**wp-admin → Jetpack → Beta**, pick the plugin, find the PR, click **Activate**), or use the
   rsync fallback. Never fetch/print the site password just to run Beta Tester.

### 3. Turn the Testing Instructions into a setup plan

Sort each precondition from step 0 into one of these buckets and handle it in the matching
step below:

| Precondition looks like… | Bucket | Step | Autonomy |
|---|---|---|---|
| `add_filter( 'x', '__return_true' )`, "enable the X flag", `update_option`, "activate the X module" | Flag / option | 4 | Autonomous |
| "Upgrade to Pro/Complete", "requires the X **plan/product**", a paid feature | Plan via blog sticker | 5 | Confirm-first |
| "requires the X **feature** AND a … **connection**", "connect a social account" | Connection (out of v1 scope) | — | Report as manual step |

State the plan back to the user in one short list before acting, then proceed — auto-apply the
flag/option items, pause on the sticker.

### 4. Apply feature flags / options — AUTONOMOUS

These are declarative and scoped to the throwaway site, so just do them and report.

Write a **mu-plugin** (auto-loads, no activation step, and — critically — loads **before
`plugins_loaded`**, which many feature filters require; a theme's `functions.php` runs too
late and silently no-ops):

```bash
ssh <domain>@ssh.atomicsites.net 'mkdir -p /srv/htdocs/wp-content/mu-plugins && \
  cat > /srv/htdocs/wp-content/mu-plugins/0-pr-test-setup.php <<PHP
<?php
// Feature-state setup for PR <PR> — added by jetpack-pr-test-setup.
add_filter( "<flag>", "__return_true" );
PHP'
```

Add any `update_option` the instructions call for as a separate line
(`wp option update <name> <value>`) **only when needed** — don't set options unconditionally;
check the default first.

**Worked example — the `rsm_jetpack_seo` SEO surface** (the recurring case):

- Gate 1 — the flag: `add_filter( 'rsm_jetpack_seo', '__return_true' )`, in a mu-plugin (must
  be before `plugins_loaded`). Verify:
  `wp eval 'var_export( apply_filters( "rsm_jetpack_seo", false ) );'`
- Gate 2 — `jetpack_seo_surface_visible`: on a **fresh** JN install this seeds to `true`
  automatically, so **do not set it blindly.** Only if the SEO menu still doesn't appear:
  `wp option update jetpack_seo_surface_visible 1`.
- The admin page then lives at `admin.php?page=jetpack-seo`.

After applying, confirm the target surface is reachable (e.g. `wp option get …`, or reload the
autologin URL and check the menu/route the PR touches).

### 5. Apply plan / product state via a WPCOM blog sticker — CONFIRM-FIRST

Some features gate on a paid plan or a rollout sticker (e.g. Social message templates), not on
a self-hosted flag. These are granted by setting a **blog sticker on the site's blog ID**,
which runs against **live WPCOM** and needs a WPCOM sandbox shell — the JN site can't set its
own sticker.

Because this mutates real infrastructure keyed by blog ID, follow the confirm-first rule
strictly:

1. **Determine the exact sticker name** for the feature — do not guess it. Sticker names live
   in wpcom, not this repo. Find it via `context-a8c` (search wpcom/GitHub for the feature and
   its sticker), or from the PR's own instructions if they name it.
2. **Verify the current plan/feature state** on the site first, so you don't set a sticker
   that's already effective:
   ```bash
   ssh <domain>@ssh.atomicsites.net 'cd /srv/htdocs && \
     wp eval "var_export( Automattic\\Jetpack\\Current_Plan::supports( \"<feature>\" ) );"'
   ```
3. **Present the exact command and blog ID for explicit approval** — do not run it yourself
   from here; the sticker is set from the user's authorized WPCOM sandbox session:

   > On your WPCOM sandbox, grant the sticker for **blog ID `<blog_id>`**:
   > `<the exact add-blog-sticker invocation, with <blog_id> filled in>`
   > Confirm this is the right blog ID before running — stickers are set by ID against real WPCOM.

4. After the user confirms it's set, re-check `Current_Plan::supports( … )` to confirm the
   feature is now active before moving on.

### 6. Locate the UI entry point and hand off

Testing Instructions routinely end with a "where do I click?" the reviewer has to hunt for
("where's the toggle?"). Resolve it explicitly:

- From the PR's changed files / body, identify the admin route or front-end location the change
  surfaces (e.g. `admin.php?page=jetpack-seo`, a Settings toggle, a block in the editor).
- Report it as a concrete path plus the autologin link (step 7).
- If the user wants before/after evidence, hand off to **`jetpack-screenshot`** for the PR,
  which captures and publishes to the screenshots ref.

### 7. Report

Concise final report:

- PR number + title (note "draft" if draft).
- JN domain, `blog_id`, Jetpack connection status.
- How the code was delivered: **Beta Tester `<plugin>@<branch>`** (or "rsync fallback — no beta
  build").
- Setup applied: each flag/option set (✓), and the sticker status (set / **awaiting your
  confirmation** / not needed).
- Any **out-of-v1-scope precondition** left for the user (a required connection, or sandbox
  pointing), clearly labelled as manual.
- **The autologin link: `https://<domain>/?auto_login`** and the exact page/route to review.
- JN sites expire after 7 days of inactivity.

## Notes

- Never print the JN site password, even when a fallback used it.
- Prefer Beta Tester; reach for rsync only when no branch build exists.
- Don't set `jetpack_seo_surface_visible` (or any option) unconditionally — check the default
  first; fresh installs usually already satisfy the second gate.
- A blog sticker is the one step that leaves the throwaway site and touches real WPCOM — it is
  always confirm-first, never autonomous.
