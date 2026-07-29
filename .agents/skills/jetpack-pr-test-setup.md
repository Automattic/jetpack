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
the PR's *published* branch build, so there's no local build and no SFTP upload of your
worktree — just a few `wp jetpack-beta` calls over SSH. Rsync stays only as a fallback for
PRs that have no beta build. All WP-CLI runs over the password-auth transport in step 1b
(JN hosts reject SSH keys, so key auth is a dead end — see there).

## Composition

```
jetpack-test-jurassic-ninja (provision-only, +jetpack-beta)   → fresh connected JN site
      ↓
this skill: wp jetpack-beta activate <plugin> <PR-branch>   (rsync fallback if no build)
      ↓
this skill: prove the branch code actually loads (ReflectionClass, not grep)
            ↳ production shadowing the branch? deactivate jetpack-production  [AUTONOMOUS]
      ↓
this skill: apply feature-state setup from the Testing Instructions
            · flags / options  → mu-plugin                   [AUTONOMOUS — throwaway site]
            · plan / product    → local jetpack_active_plan override  [AUTONOMOUS — default]
                                  ↳ real WPCOM blog sticker   [CONFIRM-FIRST — only if server-enforced]
      ↓
this skill: locate the UI entry point → hand off to jetpack-screenshot
```

**v1 scope:** feature flags/options and plan/product state (local override, or real sticker).
**Out of scope for v1:**
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

- `jurassic-ninja / provision-site` with the **Jetpack Beta feature enabled**, so the site
  comes up with the Jetpack Beta Tester plugin already installed — no installing it from a
  GitHub zip later (it isn't on WP.org). Pass `features: {"jetpack": "true", "jetpack-beta":
  "true"}`. (`jetpack-beta` is the JN "Jetpack Beta" advanced option; confirm the exact key
  against the provider's `provision-site` schema if it errors. `jetpack-social` is available
  the same way when a PR wants the Social plugin specifically.)
- Poll `list-sites` (`include_config:false`) until `status == 2` (cap ~3 min).
- `connect-jetpack` (domain). **Capture the `blog_id`** and the **admin credentials** — the
  report in step 7 must hand these back so the user can reach `/wp-admin`. Note what
  `list-sites` actually returns: `include_config:true, include_passwords:true` gives you the
  site's `JN_PASSWORD` (the SSH/SFTP password), **not** a separate `admin_pass` field. The
  wp-admin password *is* that same `JN_PASSWORD`; the wp-admin **user** is `demo`, which you
  confirm once the transport is up (step 1b) with `wp user list --role=administrator
  --fields=user_login,user_email` — don't assume a field that isn't in the config.

A brand-new install matters: it makes gates like `jetpack_seo_surface_visible` seed to `true`
(see step 4), so the flag alone is usually enough.

### 1b. Establish the WP-CLI transport (password auth — no keys, no proxy)

Every later step runs `wp` on the JN site over SSH. **Do not use SSH key auth.** Jurassic
Ninja hosts don't trust your personal/a8c key — you'll get `Permission denied
(publickey,password)` — and routing through the a8c proxy needs an interactive yubikey
touch, so neither is portable to whoever else runs this skill. The one credential *every*
JN site issues is its **per-site password**; authenticate with that, non-interactively,
with keys and the proxy switched off. Set the transport up once here and reuse it everywhere
below.

```bash
# 1) Host: prefer the one in provision-site's returned `ssh_command`; else ssh.atomicsites.net.
JN_HOST='<domain>@ssh.atomicsites.net'

# 2) Site password — JN MCP: list-sites (domain: <domain>, include_passwords: true).
JN_PW='<password from list-sites>'

# 3) Askpass feeder — supplies the password with zero interaction, no sshpass dependency.
ASKPASS="$(mktemp)"; printf '#!/bin/sh\necho "$JN_PW"\n' >"$ASKPASS"; chmod +x "$ASKPASS"
CM="$(mktemp -u)"

# 4) One reusable, non-interactive transport used by every step below:
#    - keys OFF  → JN rejects them anyway, and this stops the yubikey from ever engaging
#    - proxy OFF → JN hosts are directly reachable; also what makes it work for a teammate
#                  who has no a8c proxy config at all
#    - password via askpass, connection multiplexed so the whole run authenticates once
jnwp() {
  JN_PW="$JN_PW" SSH_ASKPASS="$ASKPASS" SSH_ASKPASS_REQUIRE=force \
  ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password \
      -o ProxyJump=none -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
      -o ControlMaster=auto -o ControlPath="$CM" -o ControlPersist=5m \
      "$JN_HOST" "cd /srv/htdocs && $*"
}

# 5) Prove the transport end to end before doing anything else.
jnwp 'wp --version'
```

Needs OpenSSH ≥ 8.4 (for `SSH_ASKPASS_REQUIRE=force`, which makes ssh read the password from
the askpass helper even with a tty attached). If that's unavailable, swap the body for
`sshpass -p "$JN_PW" ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password
-o ProxyJump=none "$JN_HOST" "cd /srv/htdocs && $*"`. If `jnwp 'wp --version'` still fails
(password rejected, host unreachable), stop and report it — that is the one case the
browser-driven Beta Tester UI exists to cover.

### 2. Activate the PR branch with Jetpack Beta Tester

**Map the PR to a Beta Tester plugin target** (same logic as `jn-pr-review` step 3):

- `projects/plugins/<slug>/…` changed → that plugin (`jetpack`, `jetpack-boost`, `social`,
  `search`, `protect`, `videopress`, `crm`, …).
- `projects/packages/<pkg>/…` **only** (no plugin path) → **`jetpack`** — the branch build
  bundles the package via the autoloader. This is the common case for the SEO/`packages/seo`
  PRs.
- More than one plugin affected, or a package that plausibly belongs to a non-`jetpack`
  plugin → **ask** which to activate.

**Ensure the Beta plugin is present, then activate** — every call via the `jnwp` transport
from step 1b. If step 1 provisioned with `jetpack-beta`, the plugin is already installed and
this is just an activate + confirm; the `wp plugin install` is a fallback for sites that
weren't provisioned with the feature (it pulls the GitHub release zip, since jetpack-beta
isn't on WP.org):

```bash
jnwp 'wp plugin is-active jetpack-beta || wp plugin activate jetpack-beta 2>/dev/null || \
      wp plugin install https://github.com/Automattic/jetpack-beta/releases/latest/download/jetpack-beta.zip --activate'
jnwp 'wp jetpack-beta list <plugin>'                 # confirm the PR branch appears
```

Then activate the PR's branch (the CLI's `install_and_activate` downloads the branch build
and switches to it in one call — `<branch>` is `headRefName`, treated as a PR source):

```bash
jnwp 'wp jetpack-beta activate <plugin> "<headRefName>"'
```

Verify it took: `jnwp 'wp jetpack-beta list <plugin>'` should mark `<headRefName>` active
(`*`). **`wp plugin list --status=active` is not the check you want here:** Beta Tester runs
the branch build as a *separate* plugin named **`jetpack-dev`**, and the JN provisioner leaves
**`jetpack-production`** active alongside it — so there's no literal `jetpack` line to grep,
and its absence isn't a failure. But an active `jetpack-dev` does **not** mean the branch's
code runs. Step 2b is what establishes that, and it is not optional.

**Fallbacks, in order:**
1. `wp jetpack-beta list <plugin>` doesn't include the branch, or `activate` errors that the
   branch/build isn't found → **no beta build exists for this PR.** Fall back to
   `jn-pr-review`'s build + rsync path to get the code onto the site, then return here for
   step 3.
2. The `jnwp` transport itself won't connect (password rejected / host unreachable, per
   step 1b) → drive the Beta Tester UI in the browser instead (**wp-admin → Jetpack → Beta**,
   pick the plugin, find the PR, click **Activate**), or use the rsync fallback.

### 2b. Prove the branch's code actually executes — REQUIRED

An active `jetpack-dev` does not mean the PR's code runs. `jetpack-dev` and
`jetpack-production` **both** register every bundled package with the jetpack-autoloader, which
loads the **highest version** of each package across all registrants. Beta builds are versioned
`X.Y.Z-alpha<timestamp>` from the branch's own `composer.json`, so whenever the PR branch is
based on a trunk older than the one `jetpack-production` was built from, **production wins and
the branch's package sits on disk and never loads.** Everything looks healthy — site up, plugin
list right, `jetpack-beta list` showing `*` — and the PR's change is simply absent. This is the
single most likely reason a reviewer reports "I can't see the change."

`JETPACK_AUTOLOAD_DEV` does **not** rescue this (it's what `jn-pr-review` sets for its rsync
path). `Version_Selector::is_dev_version()` recognises only `dev-*` and `9999999-dev`; an
`-alpha<timestamp>` build is neither, so selection falls through to `version_compare` either way.

**Never verify this with a disk grep.** The PR's string is present in `jetpack-dev` whether or
not that copy loads — grepping it proves nothing. Ask PHP where it resolved the class from,
using a class the PR actually touches:

```bash
jnwp 'cat > /tmp/whichfile.php <<'"'"'PHP'"'"'
<?php
$r = new ReflectionClass( "Fully\\Qualified\\Class\\From\\The\\PR" );
echo $r->getFileName() . "\n";
PHP
wp eval-file /tmp/whichfile.php'
```

- Resolves under `wp-content/plugins/jetpack-dev/…` → branch code is live; go to step 3.
- Resolves under `wp-content/plugins/jetpack-production/…` → production is shadowing the branch.
  Remove production from the equation — reversible and scoped to the throwaway site, so
  **autonomous, don't ask**:

  ```bash
  jnwp 'wp plugin deactivate jetpack-production'
  ```

  Then re-run the reflection check (it must now point at `jetpack-dev`) and confirm the
  connection survived — `Manager::is_connected()` still true and the same blog ID — before
  moving on.

To see the reason rather than infer it, compare what each plugin registers:

Match on the **file path**, not the namespaced class name — the path has no backslashes to lose
across the shell hops:

```bash
jnwp 'for p in jetpack-production jetpack-dev; do echo "== $p"; \
  grep -B2 "jetpack-<pkg>/src/<file>.php" wp-content/plugins/$p/vendor/composer/jetpack_autoload_classmap.php; done'
```

The `version` line above each `path` is what the autoloader compares.

A branch whose package version is *behind* trunk's is a **stale branch**. Say so in the final
report: a rebase is the durable fix, and until then the user is reviewing a build several
minors old. Expect knock-on surprises — a class trunk has may not exist in the branch build at
all (e.g. `SEO\Surface_Visibility` is absent from `jetpack-seo` 0.6.1), so a verification step
copied from trunk can fatal with `Class "…" not found`. That's information about the branch,
not a broken site.

**Quoting note (applies to every `wp` call in this skill):** anything with backslashes or
nested quotes belongs in a heredoc'd file run with `wp eval-file`, never inline `wp eval`. A
namespaced class name inside `jnwp`'s single-quoted argument loses its backslashes across local
shell → ssh → remote shell, producing a confusing `Class "…" not found` fatal that looks like a
missing class rather than a mangled string.

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
jnwp 'mkdir -p wp-content/mu-plugins && cat > wp-content/mu-plugins/0-pr-test-setup.php <<PHP
<?php
// Feature-state setup for PR <PR> — added by jetpack-pr-test-setup.
add_filter( "<flag>", "__return_true" );
PHP'
```

Add any `update_option` the instructions call for as a separate line
(`wp option update <name> <value>`) **only when needed** — don't set options unconditionally;
check the default first. Run every `wp …` in this step (and steps 5–6) through `jnwp`.

**Worked example — the `rsm_jetpack_seo` SEO surface** (the recurring case):

- Gate 1 — the flag: `add_filter( 'rsm_jetpack_seo', '__return_true' )`, in a mu-plugin (must
  be before `plugins_loaded`). Verify:
  `wp eval 'var_export( apply_filters( "rsm_jetpack_seo", false ) );'`
- Gate 2 — `jetpack_seo_surface_visible`, read via `SEO\Surface_Visibility::is_visible()`: on a
  **fresh** JN install this seeds to `true` automatically, so **do not set it blindly.** Only if
  the SEO menu still doesn't appear: `wp option update jetpack_seo_surface_visible 1`. Note this
  gate only exists from `jetpack-seo` 0.7.0 on — older branch builds have no `Surface_Visibility`
  class and the flag is the only gate, so check `class_exists()` before asserting on it.
- The admin page then lives at `admin.php?page=jetpack-seo`.

After applying, confirm the target surface is reachable (e.g. `wp option get …`, or reload the
autologin URL and check the menu/route the PR touches).

### 5. Apply plan / product state

Some features gate on a paid plan or a rollout sticker (e.g. Social message templates), not on
a self-hosted flag. There are two ways to grant them; **default to 5a** — it's autonomous,
needs nothing outside the JN site, and is enough for reviewing the UI, which is what most PR
testing is. Fall back to 5b only when you need server-enforced behavior.

#### 5a. Local plan override on the JN site — AUTONOMOUS (default)

Plan gates resolve locally against the **`jetpack_active_plan` option**: `Current_Plan::get()`
reads it, `Current_Plan::supports( $feature )` checks `$plan['features']['active']`, and the
editor's `siteHasFeature( … )` reads the very same array (it's injected verbatim into script
data). So adding the feature slug to that option's `features.active` on the site itself flips
every client-side gate — no WPCOM sandbox, no sticker, no blog ID. Do it with a mu-plugin so a
later plan refresh can't clobber it.

**Hook both `option_` *and* `default_option_`.** `Current_Plan::get()` reads the plan with
`get_option( 'jetpack_active_plan', array() )`, and on a **fresh JN site that option row does
not exist yet** — so `get_option()` returns through the `default_option_jetpack_active_plan`
filter, and the `option_jetpack_active_plan` filter *never fires*. Hooking only `option_`
(the obvious choice) silently no-ops: `supports()` keeps returning `false` with no error, and
you waste time thinking the override "didn't work." Register the same closure on both filters
so it applies whether or not the row exists:

```bash
# The heredoc delimiter is single-quoted (<<'PHP'), so the REMOTE shell leaves every $
# literal — no \$ escaping through the local→jnwp→ssh layers. The '"'"' dance only escapes
# the single quotes inside jnwp's own single-quoted argument.
jnwp 'cat > wp-content/mu-plugins/0-pr-test-plan.php <<'"'"'PHP'"'"'
<?php
// Local plan override for PR <PR> — added by jetpack-pr-test-setup.
$jp_pr_plan_override = function ( $plan ) {
    if ( ! is_array( $plan ) ) { $plan = array(); }
    if ( empty( $plan["features"]["active"] ) || ! is_array( $plan["features"]["active"] ) ) {
        $plan["features"]["active"] = array();
    }
    foreach ( array( "<feature-slug>" ) as $f ) {           // e.g. social-message-templates
        if ( ! in_array( $f, $plan["features"]["active"], true ) ) {
            $plan["features"]["active"][] = $f;
        }
    }
    return $plan;
};
add_filter( "option_jetpack_active_plan", $jp_pr_plan_override );          // option row exists
add_filter( "default_option_jetpack_active_plan", $jp_pr_plan_override );  // fresh site, no row
PHP'
```

Verify: `jnwp 'wp eval "var_export( Automattic\\Jetpack\\Current_Plan::supports( \"<feature-slug>\" ) );"'`
should print `true`. Find the exact slug from the PR (the gate reads `social-<feature>` in
places, e.g. `social-message-templates`).

**Limit:** this only convinces *this site's client code* it has the feature. Actions that call
WPCOM and are enforced server-side (actually rendering/sending a templated message) may still
require the real sticker — use 5b for those.

#### 5b. Real WPCOM blog sticker — CONFIRM-FIRST (only when 5a isn't enough)

The sticker lives on **WPCOM**, not the site — `wp blog-stickers` is a WPCOM-only command that
writes to WPCOM's blog table, so it **cannot** run from the JN site's own SSH (its wp-cli has no
such command and no access). It has to be set from an authorized **WPCOM sandbox** session, and
it mutates live infrastructure keyed by blog ID, so:

1. **Determine the exact sticker name** — don't guess it. Find it via `context-a8c` (search
   wpcom/GitHub for the feature) or from the PR's instructions.
2. **Present the exact command + blog ID for explicit approval** — you run nothing here:

   > On your WPCOM sandbox, grant the sticker for **blog ID `<blog_id>`**:
   > `wp blog-stickers add --sticker=<sticker> --blog_id=<blog_id> --who=<your-wpcom-username>`
   > (`--who` is required for the audit log; if the sandbox rejects the write, run
   > `bin/allow-sandbox-production-writes` first.) Double-check the blog ID before running.

3. After the user confirms, re-check `Current_Plan::supports( … )` (with a refresh) to confirm.

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
  build"), plus the step-2b evidence that it *loads* — the resolved file path, not a grep. If
  you had to deactivate `jetpack-production`, say so; it changes what's active on the site.
- If step 2b showed the branch's package version behind trunk's, flag the branch as **stale**
  and recommend a rebase — otherwise the user reviews an old build and reports phantom bugs.
- Setup applied: each flag/option set (✓), and the plan state (local override applied / real
  sticker **awaiting your confirmation** / not needed).
- Any **out-of-v1-scope precondition** left for the user (a required connection, or sandbox
  pointing), clearly labelled as manual.
- **How to reach the site — always include all three, testing happens in wp-admin. Put access
  BEFORE the where-to-click steps:** the reader has to be logged in before any "click here"
  instruction means anything, so ordering them the other way makes them backtrack.
  - Autologin link: `https://<domain>/?auto_login` (one-shot; may not work in a browser other
    than the one that opened it).
  - **wp-admin credentials** so the user can log in directly regardless:
    `https://<domain>/wp-admin/` — user **`demo`** (confirm via `wp user list
    --role=administrator`), password **`<JN_PASSWORD>`** (the site password from `list-sites`
    in step 1 — there is no separate `admin_pass` field; it's the same credential). Print them;
    without wp-admin access the whole setup is useless. Add a one-line caveat that this is a
    throwaway site credential and must not be pasted into the PR body, commits, or any other
    public place.
  - **Then** the exact page/route the PR surfaces, and what should be visible there.
- JN sites expire after 7 days of inactivity.

## Notes

- SSH key auth does not work on JN hosts — always authenticate WP-CLI with the per-site
  password via the step-1b `jnwp` transport (keys off, proxy off). Never `BatchMode=yes` a
  key probe; it just wastes a round trip on a method that can't succeed here.
- **Do** hand the user the site's wp-admin user + password in the final report — it's a
  disposable, self-owned test site and admin access is the point of the whole run. (Still
  don't paste it into anything external or shared.)
- Prefer Beta Tester; reach for rsync only when no branch build exists.
- **"Activated" ≠ "running."** `jetpack-dev` active alongside `jetpack-production` means the
  autoloader picks the higher package version, which is production's whenever the branch is
  behind trunk. Always confirm with `ReflectionClass::getFileName()` (step 2b) and deactivate
  `jetpack-production` when it's shadowing. A disk grep for the PR's string cannot detect this
  and will make you report success on a site that isn't running the PR.
- Don't set `jetpack_seo_surface_visible` (or any option) unconditionally — check the default
  first; fresh installs usually already satisfy the second gate, and branch builds older than
  `jetpack-seo` 0.7.0 don't have that gate at all.
- Route any `wp` invocation containing backslashes or nested quotes through `wp eval-file` with
  a heredoc'd file — inline `wp eval` loses backslashes across the local shell → ssh → remote
  shell hops and fatals with a misleading `Class "…" not found`.
- Plan/product gates: prefer the local `jetpack_active_plan` override (5a, autonomous) for UI
  testing; the real WPCOM blog sticker (5b) is confirm-first and only for server-enforced
  behavior — it's the one step that leaves the throwaway site and touches real WPCOM.
