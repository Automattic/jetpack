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
this skill: prove the branch code actually loads  — expect production to be shadowing it
            · PHP change → ReflectionClass::getFileName() + assert an added symbol
            · JS  change → resolve asset base, then grep the BUILT bundle
            ↳ production shadowing the branch? deactivate jetpack-production  [AUTONOMOUS]
      ↓
this skill: apply feature-state setup from the Testing Instructions
            · flags / options  → mu-plugin                   [AUTONOMOUS — throwaway site]
            · plan / product    → override the option THAT GATE reads  [AUTONOMOUS — default]
                                  (jetpack_active_plan is common, not universal)
                                  ↳ real WPCOM blog sticker   [CONFIRM-FIRST — only if server-enforced]
      ↓
this skill: locate the UI entry point AND prove it renders → hand off to jetpack-screenshot
            ↳ gates true but nothing renders? report that honestly; don't hand over a dead link
```

**In scope:** feature flags/options and plan/product state (local override, or real sticker).
**Out of scope — never attempt these:**
establishing a required social/OAuth *connection* (e.g. a Publicize account link), and
pointing the JN site's API traffic at a WPCOM sandbox. Both need an interactive consent flow
or an authorized session the skill can't obtain. If the Testing Instructions require either,
apply everything else, then report the remaining precondition as a clearly-labelled manual
step — a partial setup with one named manual step is useful; abandoning the run is not.

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
- **Stop here if no changed path is under `projects/`.** A PR that only touches `tools/`,
  `docs/`, `.github/`, or `.agents/` ships no plugin or package code, so there is nothing to
  install on a site and nothing for steps 2–6 to do. Say exactly that in one line, name the PR
  you resolved, and ask for a PR number that touches `projects/`. Do **not** provision a site
  first — step 1 costs a JN site and ~3 minutes of polling before step 2 would surface the
  problem — and do not offer to "dry-run the skill" or cite these step numbers at the user;
  neither means anything to someone who wants a testable site.
- Easy to hit by accident, because with no PR argument the default is whatever the *current
  branch* has open — which may be a branch with no plugin code in it at all. Whenever the PR
  came from that default rather than an explicit argument, name the PR number and title you
  resolved before acting on it, so a wrong guess is visible before it costs a site.
- **Check `state` before going further — don't just capture it.** `MERGED` and `CLOSED` PRs
  change what the rest of this skill means, and a PR you picked off an "open" list minutes ago
  can already be merged (observed 2026-07-30 with #50903):
  - **`MERGED`** — say so, and confirm the user still wants a site. Two things invert. The
    branch may be deleted, so `wp jetpack-beta list <plugin>` may not offer it at all (fall
    straight to the rsync fallback from the merge commit if so). And once trunk has rebuilt,
    `jetpack-production` *contains* the change — so step 2b resolving to `jetpack-production` is
    no longer evidence of a problem, and deactivating it is pointless. Verify the change by
    behavior, not by which plugin the class came from.
  - **`CLOSED`** (unmerged) — stop and confirm. The code was rejected; setting up a site for it
    is usually a mistake, and a beta build may not exist.
  - **`OPEN` + `isDraft`** — proceed normally, but label it a draft in the step-7 report.
- Pull the **Testing Instructions** section out of `.body`. Extract every precondition it
  states — phrases like "Requires…", "add_filter(…)", "Enable…", "Upgrade … to Pro", "with the
  X feature", "at least one … connection", "add the blog sticker …". This list is the setup
  plan for steps 3–6.
- **A section that exists but was never filled in counts as no instructions.** The PR template
  ships with a "Testing instructions" heading followed by HTML comments and placeholder bullets,
  and plenty of PRs are opened without touching it. Observed 2026-07-30 on PR #50419, whose
  entire section was `<!-- … -->` comments plus `* Go to '..'` and a bare `*`. Parsed literally
  that yields `Go to '..'` as a precondition, which is nonsense you can waste a lot of time on.
  Treat the section as empty when what's left after stripping `<!-- … -->` comments is only
  empty bullets or template stubs (`Go to '..'`, `Fixes #`, lone `*`).
- **With no usable instructions, don't stall — infer, state, and proceed.** Read the diff and
  say plainly which state you inferred and why, then continue. Only stop and ask if the diff
  leaves genuine ambiguity about what has to be switched on. A missing testing section is common
  and is not a reason to refuse a site.
- **"No preconditions" is a legitimate outcome, not a gap.** Plenty of PRs — UI refactors,
  copy changes, dependency bumps — need nothing beyond the branch being live. When that's the
  case, say steps 3–5 were a no-op and go straight to step 6. Don't invent setup to fill the
  section. PR #50419 was exactly this: a pure component migration with no feature state at all.

### 1. Provision a fresh JN site (delegate)

Run `jetpack-test-jurassic-ninja` in **`provision-only`** mode — a fresh, Jetpack-connected
site is all we need; there's nothing to rsync. Follow that skill for the MCP calls; the
essentials:

- `jurassic-ninja / provision-site` with the **Jetpack Beta feature enabled**, so the site
  comes up with the Jetpack Beta Tester plugin already installed — no installing it from a
  GitHub zip later (it isn't on WP.org). Pass `features: {"jetpack": "true", "jetpack-beta":
  "true"}`.
- **Don't guess feature slugs — call `jurassic-ninja / list-features` first.** It's the
  authoritative registry (~77 features; `group` filters it, e.g. `group: "jetpack"`) and each
  entry carries the `slug` to pass, its `default`, its `access_tier`, `requires`/`enables`/
  `conflicts`, and an `available` flag saying whether *you* can enable it. Enable whatever the
  PR actually needs rather than the two slugs named here; the public jurassic.ninja form shows
  only the public tier, so it under-reports what's available to an Automattician.
- **Match the feature to the plugin the PR touches** — the standalone Jetpack plugins each
  have one, so a PR under `projects/plugins/<slug>/` usually wants its plugin present:
  `jetpack-boost`, `jetpack-social`, `jetpack-protect`, `jetpack-search`, `jetpack-videopress`,
  `jetpack-backup`, `jpcrm` (CRM). Others worth knowing: `jetpack-debug-helper`, `my-jetpack`,
  `jetpack-beta-blocks`, `content` (pregenerated posts, for UI that needs something to act on),
  `gutenberg`/`gutenberg-nightly` (block-editor changes; mutually exclusive), and `php_version`
  when a PR is about PHP compatibility.
- Note `jetpack` itself defaults to **true**, as do `wp-debug-log` and `cache-drop-in` — pass
  `"false"` to turn a default off. `jetpack-beta` takes a `branches` parameter; with none, JN
  provisions `wp jetpack-beta activate jetpack trunk`. Ignore `jetpack-products` however
  promising it looks — it can't be driven through this MCP and fails silently; see step 5.
- **Readiness: wait for the *last* configuration command, not for the site to respond.** JN
  provisions in two phases — it installs the `software` list first, then runs a `commands` list —
  and almost every tempting signal fires during phase one, while the site is still half-built.
  Two signals that look right and are not:
  - **HTTP 200.** WordPress answers long before configuration runs. Observed 2026-07-30: `200`
    at **15 seconds**, while JN had not yet swapped in `jetpack-production`, activated a beta
    branch, or imported content.
  - **`jetpack-beta` being installed.** It arrives in phase one. Observed 2026-07-30 at
    **t=20s**: `jetpack-beta` and `jetpack-boost` present, but the plugin list still showed plain
    `jetpack` (not yet uninstalled and replaced by `jetpack-production` + `jetpack-dev`) and no
    `wordpress-importer`. Proceeding here runs step 2 against a site whose plugin set is about to
    change underneath you.

  **Use `blogname` as the sentinel.** `wp option update blogname "<Title>"` is the final command
  in JN's list — verified across **all 7** site configs available 2026-07-30, spanning two days
  and different feature sets. JN sets it to the domain in Title Case, so a fresh install still
  reading `My WordPress Site` means configuration has not finished:

  ```bash
  jnwp 'wp option get blogname'      # "Freely Robust Skipper" → done; "My WordPress Site" → wait
  ```

  Measured on that run: plugins present at 20s, `blogname` still default at 30s, configuration
  complete at **90s**.

  **Fallback, because this is JN's script and not a contract:** if `blogname` hasn't flipped by
  the ~6 min cap, don't fail outright — check the things the later steps actually need
  (`wp plugin list` showing `jetpack-production` **and** `jetpack-dev`, plus `wordpress-importer`
  if you asked for `content`). If those are all present, proceed and say you bypassed the
  sentinel.
- `status` is advisory in both directions and should never be the only gate: it lags *behind* a
  working site (observed sitting at `1` for over 4.5 minutes on 2026-07-29, and still `1` on
  2026-07-30 after the site was fully configured and serving).
- `connect-jetpack` (domain). **Retry once on a transport-level error** before believing it —
  this MCP call intermittently returns `MCP error -32603 … Premature close`, and a plain
  immediate retry succeeds (observed 2026-07-29; the retry reported `already_connected`, so
  the first call had in fact worked). **Capture the `blog_id`** and the **admin credentials** — the
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
# 1) Host: take it from provision-site's returned `ssh_command` — don't hardcode one.
#    It is NOT always ssh.atomicsites.net: a site provisioned 2026-07-29 returned
#    `ssh <domain>@sftp.wp.com`, and the atomicsites host would not have served it.
JN_HOST='<domain>@<host from the returned ssh_command>'   # e.g. <domain>@sftp.wp.com

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
#    Use `wp cli version`, NOT `wp --version`: on JN's wp-cli the latter prints the whole
#    help screen instead of a version string, which reads like a failure when it isn't.
jnwp 'wp cli version'          # → WP-CLI 2.12.0
```

**`jnwp` is written as a shell function, but a shell function will not survive between your
tool calls** — each Bash invocation gets a fresh shell, so a function defined in one call is
gone by the next. Materialize it as an executable script instead and call that script every
time (the `ControlPersist` socket is what actually carries the "authenticate once" benefit
across calls, and it works fine across separate processes):

```bash
D=<your scratchpad dir>
printf '#!/bin/sh\necho "$JN_PW"\n' > "$D/askpass.sh"
cat > "$D/jnwp.sh" <<'SH'
#!/bin/bash
D=<your scratchpad dir>
JN_HOST='<domain>@<host from ssh_command>'
JN_PW='<password from list-sites>'
export JN_PW SSH_ASKPASS="$D/askpass.sh" SSH_ASKPASS_REQUIRE=force
exec ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password \
    -o ProxyJump=none -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    -o ControlMaster=auto -o ControlPath="$D/cm" -o ControlPersist=5m \
    "$JN_HOST" "cd /srv/htdocs && $*"
SH
chmod +x "$D/askpass.sh" "$D/jnwp.sh"
```

Then read every `jnwp '<cmd>'` below as `"$D/jnwp.sh" '<cmd>'`. Keep `$D` short — `ControlPath`
is a unix socket and dies past ~104 characters.

**If auth suddenly starts failing mid-run with `ssh_askpass: exec(…): No such file or directory`
followed by `Permission denied`, the askpass helper was cleaned up underneath you** — scratch
and temp dirs get swept between turns. It is not a credential problem: just rewrite
`askpass.sh`, `chmod +x` it, and carry on. (This is also why `mktemp` is the wrong home for it —
prefer a path you control and can recreate.)

Needs OpenSSH ≥ 8.4 (for `SSH_ASKPASS_REQUIRE=force`, which makes ssh read the password from
the askpass helper even with a tty attached). If that's unavailable, swap the body for
`sshpass -p "$JN_PW" ssh -o PubkeyAuthentication=no -o PreferredAuthentications=password
-o ProxyJump=none "$JN_HOST" "cd /srv/htdocs && $*"`. If `jnwp 'wp cli version'` still fails
(password rejected, host unreachable), stop and report it — that is the one case the
browser-driven Beta Tester UI exists to cover.

### 2. Activate the PR branch with Jetpack Beta Tester

**Map the PR to a Beta Tester plugin target** (same logic as `jn-pr-review` step 3):

- `projects/plugins/<slug>/…` changed → that plugin. **Beta Tester's slug is not always the
  monorepo directory name**, and a wrong slug fails with
  `Error: Plugin 'search' is not known` (exit 1) — loud, but a wasted round trip, and easy to
  misread as "no beta build exists" and bail to rsync for nothing. Get the authoritative list
  from the site instead of guessing:

  ```bash
  jnwp 'wp jetpack-beta list'        # prints every valid <plugin> slug
  ```

  Most standalone plugins carry a `jetpack-` prefix that their monorepo directory lacks —
  `jetpack-search`, `jetpack-social`, `jetpack-protect`, `jetpack-videopress`, `jetpack-boost`,
  `jetpack-backup`. The list also includes non-Jetpack targets (`woocommerce`,
  `woocommerce-payments`, `jetpack-mu-wpcom-plugin`, …), so check rather than assume.
- `projects/packages/<pkg>/…` **only** (no plugin path) → usually **`jetpack`**, which bundles
  the package via the autoloader. This is the common case (e.g. `packages/seo`). But a package
  that also ships in a standalone plugin gets a branch build under **both** targets — verified
  2026-07-30, `packages/search` on branch `fix/search-311-no-results-flash` appeared under
  `jetpack` *and* `jetpack-search`. So `jetpack` is the default, not the answer: when the
  package name maps to a standalone plugin (`search`, `publicize`→Social, `boost-*`, `protect`,
  `videopress`, `backup`), check both with `wp jetpack-beta list <plugin>` and **ask which the
  user wants**. They test different surfaces — the standalone plugin's UI, or the same package
  as consumed by the Jetpack plugin.
- **Discard plugins that can't run on a JN site before counting.** `wpcomsh` is the one you'll
  actually hit: it's Atomic/WPCOM-only, isn't installable here, and a PR touching it usually
  only adds a WPCOM feature-registry entry. Counting it makes the "more than one plugin" rule
  below fire on PRs that have exactly one testable target, so you stop and ask a question with
  only one possible answer. Drop it, note in the report that its changes aren't exercised on
  JN, and carry on.
- More than one *testable* plugin affected, or a package that plausibly belongs to a
  non-`jetpack` plugin → **ask** which to activate.
- **Nothing under `projects/` → there is no target.** Step 0 should have caught this; if you
  reach here, stop and report it plainly rather than inventing a target or asking the user to
  reinterpret their request.

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

**First: does shadowing even apply to this PR?** The elaborate proof below exists because two
plugins can register the *same* package and the autoloader picks one. That situation is specific,
and on a standalone plugin target it does not arise:

| What you activated | Resulting plugins | Shadowing risk |
|---|---|---|
| `jetpack` (the JN default keeps `jetpack-production` active) | `jetpack-dev` **+** `jetpack-production`, both active | **Yes** — the main case below |
| A standalone plugin (`jetpack-boost`, `jetpack-search`, …) | `<plugin>-dev` only; Beta Tester **replaces** the original, which goes inactive | **No** for that plugin's own code |

Verified 2026-07-30 on PR #50419: after `wp jetpack-beta activate jetpack-boost <branch>`, the
plugin list held `jetpack-boost-dev` and *no* `jetpack-boost` — the stock copy stayed on disk but
inactive — and `JETPACK_BOOST_PATH`, the active-plugin entry, and the `Jetpack_Boost` class all
resolved under `jetpack-boost-dev/`. There is no second registrant to lose to.

So: for a PR changing a standalone plugin's **own** code (`projects/plugins/<slug>/…`), confirming
the `-dev` plugin is the active one is sufficient — record it and move to step 3. Two caveats:

- If `jetpack-dev`/`jetpack-production` are *also* active (they are, on a default JN site), any
  **shared package** still competes across all registrants. A PR touching `projects/packages/…`
  needs the full check below even when you activated a standalone plugin.
- Everything else — the `jetpack` target, and every package PR — takes the full check.

An active `jetpack-dev` does not mean the PR's code runs. `jetpack-dev` and
`jetpack-production` **both** register every bundled package with the jetpack-autoloader, which
loads the **highest version** of each package across all registrants. Beta builds are versioned
`X.Y.Z.0-alpha<timestamp>`, and **the `<timestamp>` is the tiebreak whenever the base version
matches** — which it usually does, since the branch and trunk are normally on the same package
version. So the comparison that decides which copy loads is, in the common case, simply *which
build is newer*, and `jetpack-production` is rebuilt from trunk continuously. **Expect production
to win by default.** A branch build only hours older than production's already loses.

Worked example, observed 2026-07-29 on PR #50899: production carried `jetpack-seo`
`0.8.0.0-alpha1785352583`, the branch build `0.8.0.0-alpha1785333373` — identical `0.8.0.0` base,
production newer by ~19,000 seconds (~5.3 h). Production won; the PR's new
`Initializer::is_available()` did not exist at runtime.

Everything looks healthy while this happens — site up, plugin list right, `jetpack-beta list`
showing `*` — and the PR's change is simply absent. This is the single most likely reason a
reviewer reports "I can't see the change", and because the tiebreak is a timestamp rather than a
version bump, **treat shadowing as the expected state and the check below as routine**, not as an
edge case you might skip on a freshly-rebased branch.

`JETPACK_AUTOLOAD_DEV` does **not** rescue this (it's what `jn-pr-review` sets for its rsync
path). `Version_Selector::is_dev_version()` recognises only `dev-*` and `9999999-dev`; an
`-alpha<timestamp>` build is neither, so selection falls through to `version_compare` either way.

Pick the check that matches what the PR actually changed — **PHP and JS need different proofs**,
and using the PHP one on a JS PR proves nothing about the code under review:

| PR changes | Verify with |
|---|---|
| PHP (`src/**.php`) | **2b-i** — `ReflectionClass::getFileName()` on a class the PR touches |
| JS/CSS only (`**.jsx`, `**.tsx`, `**.scss`) | **2b-ii** — resolve the package's asset base, then grep the *built bundle* |
| Both | Both — the PHP resolving to `jetpack-dev` does **not** imply the browser gets the branch's JS |

#### 2b-i. PHP changes — ask PHP where it resolved the class from

**Never verify a PHP change with a disk grep.** The PR's string is present in `jetpack-dev`
whether or not that copy loads — grepping it proves nothing. Use a class the PR actually touches:

```bash
jnwp 'cat > /tmp/whichfile.php <<'"'"'PHP'"'"'
<?php
$r = new ReflectionClass( "Fully\\Qualified\\Class\\From\\The\\PR" );
echo "file: " . $r->getFileName() . "\n";
// Assert a symbol the PR ADDS. The path alone can mislead; a new method/constant
// cannot be present unless the branch copy is the one that loaded.
echo "has <new_method>: " . var_export( $r->hasMethod( "<new_method>" ), true ) . "\n";
PHP
wp eval-file /tmp/whichfile.php'
```

Asserting an added symbol alongside the path is worth the extra line — it turns "probably the
right file" into proof, and it reads unambiguously in the step-7 report.

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

#### 2b-ii. JS/CSS-only changes — find the live asset directory, then grep the built bundle

A JS-only PR has no class to reflect on, and reflecting on some *neighbouring* PHP class proves
only that the PHP loaded. Two steps, and you need both:

1. **Find the directory the live assets are served from.** Which question you ask depends on who
   owns the asset — get this wrong and you verify a file nobody loads:

   **Package-owned** (`projects/packages/<pkg>/…`, built into `jetpack_vendor/…/build/`) — ask
   PHP, because the enqueue URL is derived from wherever the autoloader resolved the package:

   ```bash
   jnwp 'cat > /tmp/assetbase.php <<'"'"'PHP'"'"'
   <?php
   echo Automattic\Jetpack\Search\Package::get_installed_path() . "\n";   // swap in the PR's package
   PHP
   wp eval-file /tmp/assetbase.php'
   ```

   Must print a path under `jetpack-dev/`. If it prints `jetpack-production/`, deactivate
   production exactly as in 2b-i, then re-run.

   **Plugin-owned** (`projects/plugins/<slug>/app/…`, built into the plugin's own `dist/`) —
   there is no package to resolve and `get_installed_path()` does not apply. The active plugin
   *is* the answer, and on a standalone target it's unambiguous (see the table at the top of 2b).
   Confirm the `-dev` plugin is the active one:

   ```bash
   jnwp 'wp plugin list --status=active --field=name | grep <slug>'   # expect <slug>-dev
   ```

   Verified 2026-07-30 on PR #50419 (`plugins/boost/app/**.tsx`): assets live in
   `wp-content/plugins/jetpack-boost-dev/app/assets/dist/`, and only `jetpack-boost-dev` was
   active.

2. **Grep the built bundle under that path** for a symbol the PR adds. **This is the one place a
   disk grep is correct** — the built asset is what actually ships to the browser, and step 1
   already pinned down which copy is live. Compare the branch build against the stock one so the
   result is unambiguous:

   ```bash
   jnwp 'for p in <plugin>-dev <plugin>; do        # or jetpack-dev / jetpack-production
     f=wp-content/plugins/$p/<path-to-bundle>.js
     printf "%-22s %s\n" "$p" "$(grep -o -- "<symbol>" $f 2>/dev/null | wc -l)"
   done'
   ```

   **Count occurrences, not lines.** Use `grep -o … | wc -l`. Plain **`grep -c` counts matching
   *lines*, and a minified bundle is essentially one line — so it returns `1` no matter whether
   the symbol appears once or five hundred times.** Verified locally: three matches on one line
   give `grep -c` → `1`, `grep -o | wc -l` → `3`. (`grep -o -c` also returns `3` on GNU grep, but
   that combination isn't portable — prefer the `wc -l` form.)

   **Two result shapes, depending on the PR:**
   - *Feature PR* — the symbol is **new**, so expect present vs absent. PR #50925:
     `isQueryPending` 2× in `jetpack-dev`, **0×** in production.
   - *Refactor/migration PR* — the symbol already exists in both and only the **quantity**
     changes, so absent-vs-present will never appear and a naive check reads as "no difference".
     PR #50419 migrating Boost to `@wordpress/ui`: `wp-ui-` **332×** in the stock plugin vs
     **509×** in the branch build. Corroborate with file size (861376 → 993235 bytes).

   **Choose a symbol that survives minification.** Terser mangles local variable names but leaves
   **object/JSX prop names, CSS class names and string literals** intact — so prop names, action
   types, generated class prefixes and user-facing strings work; a renamed local `const` does not.
   If a grep returns 0 in *both* builds, suspect your symbol before concluding the build is wrong.

To see the reason rather than infer it, compare what each plugin registers:

Match on the **file path**, not the namespaced class name — the path has no backslashes to lose
across the shell hops:

```bash
jnwp 'for p in jetpack-production jetpack-dev; do echo "== $p"; \
  grep -B2 "jetpack-<pkg>/src/<file>.php" wp-content/plugins/$p/vendor/composer/jetpack_autoload_classmap.php; done'
```

The `version` line above each `path` is what the autoloader compares.

Read the two `version` lines carefully before drawing any conclusion about the branch — they
mean different things depending on *where* they differ:

- **Same base version, production's `-alpha<timestamp>` merely newer** (the common case, and the
  example above). This says nothing about the branch: it is not stale, and **recommending a
  rebase here is wrong** — a rebase would produce a fresh timestamp that goes stale again within
  hours, and the branch was never behind on version to begin with. Deactivating
  `jetpack-production` is the entire fix. Don't flag the branch in the report.
- **Branch's base version genuinely lower than production's** (`0.6.1` vs `0.8.0`) — *this* is a
  **stale branch**. Say so in the final report and recommend a rebase; until then the user is
  reviewing a build several minors old. Expect knock-on surprises — a class trunk has may not
  exist in the branch build at all (e.g. `SEO\Surface_Visibility` is absent from `jetpack-seo`
  0.6.1), so a verification step copied from trunk can fatal with `Class "…" not found`. That's
  information about the branch, not a broken site.

Note the resolved file paths sit under `jetpack_vendor/automattic/<pkg>/…`, while the classmap
you grep lives at `vendor/composer/jetpack_autoload_classmap.php` — two different `vendor`
directories in the same plugin. Grepping the wrong one finds nothing and looks like the package
isn't registered.

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
| "requires the X **feature** AND a … **connection**", "connect a social account" | Connection (out of scope) | — | Report as manual step |

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

**Don't reach for JN's `jetpack-products` feature — it can't be driven from here.** It looks
ideal (JN issues a *real* Jetpack license via WPCOM's licensing API, writes it to the site's
`jetpack_licenses` option, and revokes it on purge), but it is unusable through the
`jurassic-ninja` MCP: JN requires the value to be an **array** of product slugs, while the
MCP's `provision-site` schema accepts only strings. The array form is rejected by the schema,
and the string form is accepted, reaches JN, fails its `is_array()` check, and returns
silently — the site provisions cleanly with no licenses and **no error anywhere**. Verified
2026-07-29: neither `jetpack_licenses` nor `jetpack_active_plan` existed on the resulting
site. If the MCP ever accepts arrays, this becomes the best option in this step, since the
blog would genuinely own the product; until then it is a silent no-op that wastes a site.

#### 5a. Local plan override on the JN site — AUTONOMOUS (default)

Plan gates resolve locally against a **cached option**, so overriding that option on the site
flips them — no WPCOM sandbox, no sticker, no blog ID. Do it with a mu-plugin so a later plan
refresh can't clobber it.

**First find the option the gate actually reads. There is no single plan option.**
`jetpack_active_plan` is the common one, not the universal one — packages keep their own plan
caches, and overriding the wrong option no-ops silently:

| Gate | Reads |
|---|---|
| `Current_Plan::supports( $slug )` (My Jetpack, SEO, editor `siteHasFeature`) | `jetpack_active_plan` → `features.active[]` |
| `Search\Plan::supports_search()` / `supports_instant_search()` | `jetpack_search_plan_info` → `supports_search`, `supports_instant_search` |
| `Search\Plan::has_jetpack_search_product()` | `has_jetpack_search_product` |

So: open the gate in the **branch** code, follow it to its `get_option()` call, and override
*that* key. Verified 2026-07-30 — assuming `jetpack_active_plan` for PR #50925's Instant Search
gate would have achieved nothing; the working override targeted `jetpack_search_plan_info` and
`has_jetpack_search_product` instead. The **technique** below is what generalizes, not the key.

For the `Current_Plan` case the payload is the feature slug appended to `features.active`; for
others it is whatever shape that gate reads (e.g. Search wants
`array( "supports_search" => true, "supports_instant_search" => true )`).

**Hook both `option_<key>` *and* `default_option_<key>`** — whichever key you settled on above.
`Current_Plan::get()` reads the plan with `get_option( 'jetpack_active_plan', array() )`, and on
a **fresh JN site that option row does not exist yet** (confirmed: `wp option get
jetpack_active_plan` → `Could not get … Does it exist?`) — so `get_option()` returns through the
`default_option_jetpack_active_plan` filter, and the `option_jetpack_active_plan` filter *never
fires*. Hooking only `option_` (the obvious choice) silently no-ops: `supports()` keeps returning
`false` with no error, and you waste time thinking the override "didn't work." This applies to
every plan option, not just this one — the Search keys are equally absent on a fresh site.
Register the same closure on both filters so it applies whether or not the row exists:

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

Verify with `eval-file`, **not** inline `wp eval` — the class name is namespaced, and this step
is exactly the case the quoting note in step 2b warns about. Inline, the backslashes are eaten
across local shell → ssh → remote shell and you get
`Parse error: syntax error, unexpected token "\"` plus a scary "critical error on this website"
banner, which looks like the override broke the site when nothing is wrong at all:

```bash
jnwp 'cat > /tmp/plancheck.php <<'"'"'PHP'"'"'
<?php
use Automattic\Jetpack\Current_Plan;
echo var_export( Current_Plan::supports( "<feature-slug>" ), true ) . "\n";
PHP
wp eval-file /tmp/plancheck.php'
```

Should print `true`. Find the exact slug from the PR (the gate reads `social-<feature>` in
places, e.g. `social-message-templates`).

**Check whether 5a even applies before reaching for 5b.** "Needs a blog sticker" in the Testing
Instructions does not mean the gate is server-enforced. Read the gate in the branch code first:
if it resolves through `Current_Plan::supports( … )`, 5a covers it completely and no sticker is
needed. PR #50899 read
`apply_filters( 'rsm_jetpack_seo', false ) || Current_Plan::supports( 'seo-admin-ui' )` — so the
sticker path was fully reproducible locally (verified 2026-07-29), even though its instructions
asked for a real sticker *and* an undeployed WPCOM change.

**Limit — and it is a real one, not a footnote.** This convinces *this site's client code* that
it has the feature. It cannot conjure **server-side infrastructure** the feature depends on.
Where the paid product *is* a backend service, flipping the local gate makes the code believe it
is entitled while the service behind it still has nothing to serve.

Jetpack Search is the clean example (verified 2026-07-30, PR #50925): the override flipped
`supports_search`, `supports_instant_search` and `has_jetpack_search_product` all to `true`, and
`Module_Control` reported the module active with Instant Search enabled — yet **no Instant Search
assets ever enqueued on the front end**, because a real subscription is what gives the blog a
WPCOM-side search index. The PR's own instructions conceded the point ("So far I'm only able to
replicate on P2"). No amount of local overriding fixes that.

So treat 5a as *necessary but not sufficient*, and let step 6 be the judge: if the surface still
doesn't render after the gates read `true`, the feature needs infrastructure you can't fake.
Say so and stop — do not keep escalating overrides, and do not hand over a link that shows
nothing. If the Testing Instructions themselves name a specific environment (P2, Atomic, a
sandbox), take that at face value early rather than discovering it at step 6.

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
- **Prove it renders before you promise it — this step is a gate, not a lookup.** Gates reading
  `true` is not the same as the surface existing. Check the actual output:
  - Admin route → register the menu and assert the PR's page is on it:
    `do_action( 'admin_menu' )` after `wp_set_current_user( <admin> )`, then search `$menu` /
    `$submenu` for the PR's slug (via `eval-file`).
  - Front-end → fetch the page and grep for the PR's asset or marker:
    `curl -s '<url>' | grep -c '<bundle-or-class>'`.
- **If it doesn't render, say so plainly in the report and do not hand over the link as if it
  did.** A run that ends "everything is set up, but the surface does not appear on this site,
  and here's the evidence and the likely reason" is a useful result. One that ends with a link
  to a page showing nothing wastes the reviewer's time and looks like the setup silently failed.
  Observed 2026-07-30 (PR #50925): every gate `true`, module active, branch code confirmed
  live — and zero Instant Search assets on the front end, because the feature needs a
  server-side index (see 5a's Limit). Budget one or two focused diagnostics, then stop; chasing
  a framework's internal wiring is out of scope for this skill.
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
- Only if step 2b showed the branch's **base** version behind trunk's (not merely an older
  `-alpha` timestamp) flag the branch as **stale** and recommend a rebase — otherwise the user
  reviews an old build and reports phantom bugs. A timestamp-only difference is normal and
  needs no mention beyond the deactivation note above.
- Setup applied: each flag/option set (✓), and the plan state (local override applied / real
  sticker **awaiting your confirmation** / not needed).
- **Whether the surface actually rendered (step 6) — state this separately from "setup
  applied".** They are different claims and conflating them is the most misleading thing this
  report can do. If gates read `true` but nothing renders, say exactly that, give the evidence
  (no assets enqueued / menu absent), and name the likely blocker — commonly a server-side
  dependency a local override can't fake. Recommend the environment the PR actually needs.
- Any **out-of-scope precondition** left for the user (a required connection, or sandbox
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
  autoloader picks the higher package version — and with matching base versions that reduces to
  the newer `-alpha<timestamp>`, which is production's for all but a just-built branch. Assume
  production is shadowing until proven otherwise. Always confirm with
  `ReflectionClass::getFileName()` (step 2b-i) and deactivate `jetpack-production` when it is. A
  disk grep **for a PHP symbol** cannot detect this and will make you report success on a site
  that isn't running the PR. Shadowing on its own is **not** evidence of a stale branch — only a
  lower base version is.
- **Match the 2b proof to the language.** JS/CSS-only PRs have no class to reflect on: resolve
  the package's asset base in PHP, then grep the *built bundle* under it (step 2b-ii). Grepping
  is right there — the bundle is what reaches the browser — provided you pinned the live copy
  first and picked a symbol that survives minification (prop names and string literals do,
  local variables don't).
- Don't set `jetpack_seo_surface_visible` (or any option) unconditionally — check the default
  first; fresh installs usually already satisfy the second gate, and branch builds older than
  `jetpack-seo` 0.7.0 don't have that gate at all.
- Route any `wp` invocation containing backslashes or nested quotes through `wp eval-file` with
  a heredoc'd file — inline `wp eval` loses backslashes across the local shell → ssh → remote
  shell hops and fatals with a misleading `Class "…" not found`.
- Plan/product gates: prefer the local `jetpack_active_plan` override (5a, autonomous) for UI
  testing; the real WPCOM blog sticker (5b) is confirm-first and only for server-enforced
  behavior — it's the one step that leaves the throwaway site and touches real WPCOM.
