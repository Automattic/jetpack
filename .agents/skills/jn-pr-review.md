---
name: jn-pr-review
description: >
  Spin up a fresh Jurassic Ninja site running the code from a Jetpack GitHub PR so a
  human can review the PR's behavior live. Given a PR number or URL, it resolves the PR
  branch into an isolated worktree, provisions a new JN site recorded in the JN ledger
  under the PR (Jetpack-connected unless the PR changes the connection or SSO), builds
  and rsyncs the affected plugin(s), forces dev autoloading, and reports the autologin
  link. Use when the user says "jn-pr-review",
  "/jn-pr-review", "review PR <n> on JN",
  "spin up a JN site for PR <n>", "test this PR on Jurassic Ninja", or gives a Jetpack PR
  number/URL and wants a live environment to click through. This sets up the environment
  only — it does not run automated code review.
allowed-tools: Bash, Read, Glob, Grep
---

# JN PR Review — live test environment for a Jetpack PR

Given a Jetpack GitHub PR, deliver a working Jurassic Ninja site running that PR's code
(Jetpack-connected unless the PR changes the connection), and report the autologin link.
Environment provisioning only — no automated code review.

Run this from any Jetpack monorepo checkout that has a remote tracking `Automattic/jetpack`
and a working `pnpm jetpack`. The worktree path created in step 2 is namespaced by the
current repo's directory name, so runs from different sibling checkouts never collide.

This skill orchestrates the PR → worktree → plugin-detection flow, then **delegates the JN
site mechanics (provisioning, connection, SSH, rsync) to the `jetpack-test-jurassic-ninja`
skill** — read it for the MCP/SSH/password details rather than duplicating them. The
PR-specific logic and the reliability lessons below live here.

## Input

A Jetpack PR number (`49236`), `#49236`, or a github.com/Automattic/jetpack PR URL. The
repo is always `Automattic/jetpack`. If none is given, default to the current branch's open
PR (`gh pr view --json ...`).

## Workflow

### 1. Resolve the PR

```bash
gh pr view <PR> --repo Automattic/jetpack \
  --json number,title,body,labels,headRefName,headRefOid,author,state,isDraft,files,url
```

Note the changed file paths (`.files[].path`) — they drive plugin detection in step 3 and,
with the title, labels and body, the autoconnect decision in step 4.

Also note the Linear issue the PR is for, if any: a key such as `JETPACK-1234` at the end of
`headRefName` (branch names often carry it lowercased, as `-jetpack-1234`), or on a `Fixes`,
`See` or `Related to` line in `body`. Take the first one, uppercased; leave it out when the
PR names none. Step 4 records it in the JN ledger.

### 2. Create an isolated worktree (plain, no Docker)

We're testing on JN, so a plain git worktree is enough — skip the Docker `worktree-new`
flow. Resolve the repo root and the remote tracking `Automattic/jetpack` (don't assume it's
named `origin`), namespace the worktree path by the repo's basename (so sibling checkouts
don't collide), fetch the PR head by number (works for same-repo and fork PRs), then add
the worktree:

```bash
REPO="$(git rev-parse --show-toplevel)"
REMOTE="$(git -C "$REPO" remote -v | awk '/Automattic\/jetpack(\.git)? \(fetch\)/{print $1; exit}')"
REMOTE="${REMOTE:-origin}"
WT="$(dirname "$REPO")/$(basename "$REPO")-wt-pr-<PR>"   # e.g. ~/code/jetpack-wt-pr-49236

git -C "$REPO" fetch "$REMOTE" "pull/<PR>/head:pr-<PR>"
git -C "$REPO" worktree add "$WT" "pr-<PR>"
cd "$WT" && pnpm install
```

If `$WT` (or the `pr-<PR>` branch) already exists from a previous run, reuse it instead of
erroring: `git -C "$WT" fetch "$REMOTE" "pull/<PR>/head" && git -C "$WT" reset --hard FETCH_HEAD`.
Use `$WT` for all later worktree references (build, cleanup).

### 3. Determine which plugin(s) to build + rsync

Map changed paths to plugins:

- `projects/plugins/<slug>/...` → sync plugin `<slug>` (e.g. `jetpack`, `jetpack-boost`,
  `social`, `protect`, `search`, `crm`, `videopress`, `migration`, `mu-wpcom-plugin`).
- `projects/packages/<pkg>/...` **only** (no plugin path changed) → the package is bundled
  into a plugin via the jetpack-autoloader; default to the **`jetpack`** plugin, which
  bundles most packages.
- Other paths (`projects/js-packages`, tooling, GitHub Actions, docs) with no plugin or
  package impact → tell the user there's nothing runnable to sync and stop.

**Ask the user which plugin to sync when it's ambiguous:**
- More than one plugin is affected, or
- A package-only change could plausibly belong to a non-`jetpack` plugin (e.g. a package
  used primarily by `jetpack-boost` or `social`).

When unambiguous (single plugin, or package-only mapping cleanly to `jetpack`), proceed
without asking and state which plugin you chose.

### 4. Provision + connect a fresh JN site

Per `jetpack-test-jurassic-ninja`, with the JN ledger recording what the site is for, so
teammates can find it by PR in Mission Control and join it.

**First decide whether to autoconnect.** Apply that skill's **Decide whether to
autoconnect** signals (paths, labels, title and description) to the PR from step 1. If the
PR changes the Jetpack connection, login or SSO, the tester needs to go through the
connection flow themselves, so leave out `jetpack-autoconnect` and skip `connect-jetpack`
below. Otherwise autoconnect. The user's word wins either way: "connect it anyway" or
"don't connect" overrides the signals.

- `jurassic-ninja / find-sites-by-pr` (`pr_url`: the PR `url` from step 1). If teammates
  already have live sites for this PR, list them in the report (domain, owner, label);
  the user can `join-site` one of them instead next time. Still provision a fresh site.
- `jurassic-ninja / provision-site` with:

  ```json
  {
    "features": {
      "jetpack": "true",
      "jetpack-autoconnect": "true",
      "ledger": {
        "pr_url": "<PR url>",
        "label": "PR <number>: <title>",
        "linear_issue": "<KEY-1234>"
      }
    }
  }
  ```

  Keep `label` under 200 characters (shorten the title if needed) and drop `linear_issue`
  when step 1 found none. `jetpack-autoconnect` connects Jetpack to your WordPress.com
  account while the site is configured; leave it out when you decided not to autoconnect.
  The response carries `ledger_url` (the site's Mission Control page) or `ledger_error`.
- Poll `jurassic-ninja / list-sites` (`domain`, `include_config:false`) until `status == 2`
  (cap ~3 min).
- Only when autoconnecting: `jurassic-ninja / connect-jetpack` (domain). Autoconnect runs
  before the site reaches `status == 2`, so this normally returns `already_connected`; if
  autoconnect failed, it connects the site now. Capture `blog_id` and connection result.
- `jurassic-ninja / update-ledger` (domain, `branch`: `headRefName`, `plugins`: the plugin
  slug(s) from step 3).
- If `provision-site` returned `ledger_error`, make a second `update-ledger` call with
  `prs: ["<PR url>"]`, `label` and, if found, `linear_issues: ["<KEY-1234>"]`, so the
  record is complete. Keep it separate: `update-ledger` saves nothing when any value is
  invalid, so a bad PR or issue value must not also drop the branch and plugins.

The ledger is bookkeeping, not part of the environment. If a ledger call fails or the
`context-a8c` MCP can't reach the ledger, warn the user and carry on with the review site.
Don't write the site's purpose anywhere else (no WordPress option over SSH, no local file);
the ledger is the record.

### 5. Build + rsync each chosen plugin

From the worktree, build with package deps so package changes compile into the plugin:

```bash
pnpm jetpack build --deps plugins/<slug>
```

Then rsync (SSH key auth — test once with
`ssh -o BatchMode=yes ... <domain>@ssh.atomicsites.net exit`; fall back to the site SFTP
password only if key auth fails, per the JN skill):

```bash
pnpm jetpack rsync <slug> <domain>@ssh.atomicsites.net:/srv/htdocs/wp-content/plugins/<slug> --non-interactive
```

**Reliability — the A8C proxy drops long transfers.** rsync over `proxy.automattic.com`
frequently fails mid-stream with `Broken pipe` / `Connection reset` / `agent refused
operation`. Two rules:

1. **Don't trust the exit code through a pipe.** Piping rsync into `tail`/`head` makes the
   shell report the pipe's exit, not rsync's. Redirect to a log and capture the real code:
   `pnpm jetpack rsync ... > /tmp/jn-rsync.log 2>&1; echo "RSYNC_EXIT=$?"`.
2. **Retry — rsync resumes.** On a non-zero exit (or a log containing `rsync error` /
   `Broken pipe` / `There was a problem`), re-run the same command; already-transferred
   files are skipped. Allow up to ~3 attempts before surfacing the failure to the user.

### 6. Force dev autoloading (required for package changes)

The jetpack-autoloader loads the highest registered version of each package, so a synced
package won't take effect unless dev autoload is on. Add a mu-plugin and verify at runtime:

```bash
ssh ... <domain>@ssh.atomicsites.net 'mkdir -p /srv/htdocs/wp-content/mu-plugins && \
  cat > /srv/htdocs/wp-content/mu-plugins/0-jetpack-autoload-dev.php <<PHP
<?php
if ( ! defined( "JETPACK_AUTOLOAD_DEV" ) ) { define( "JETPACK_AUTOLOAD_DEV", true ); }
PHP
  wp eval "var_export( defined(\"JETPACK_AUTOLOAD_DEV\") && JETPACK_AUTOLOAD_DEV );"'
```

### 7. Verify the change is actually live

Confirm the synced package resolves at runtime (adapt the class/method to the PR). Example
for a class in a package:

```bash
ssh ... <domain>@ssh.atomicsites.net 'cd /srv/htdocs && \
  wp eval "\$r = new ReflectionClass( \"Automattic\\\\Jetpack\\\\<Namespace>\\\\<Class>\" ); echo \$r->getFileName();"'
```

A path under `wp-content/plugins/<slug>/jetpack_vendor/...` (not a stale autoloaded copy)
confirms the synced code is loaded. Grep the synced file for a string the PR introduced as
a quick sanity check.

### 8. Report

Report concisely:
- PR number + title.
- Plugin(s) synced and worktree path.
- JN domain, `status`, Jetpack connection (`blog_id`, or "not connected"),
  `JETPACK_AUTOLOAD_DEV` set.
- Whether the site was autoconnected and why: the connection signal that ruled it out
  ("Not autoconnected: this PR changes the connection, so connect it yourself as part of
  testing"), or the user's request. When the PR touches the connection, login or SSO, also
  warn that inviting teammates, or a teammate joining, turns Jetpack SSO on once the site
  has a Jetpack user connection, which may affect what's under test.
- The `ledger_url` (Mission Control page), or the ledger warning if a ledger call failed,
  plus any teammates' sites `find-sites-by-pr` found for the same PR.
- Verification result (which file the class resolved to / PR string present).
- **The autologin link: `https://<domain>/?auto_login`** and a hint at where to look
  (the wp-admin page the PR affects).
- If the PR body has `<!-- rehearsal v1 -->` blocks, say they can now be installed and run on
  this site (see the `jetpack-rehearsal` skill).
- JN sites expire after 7 days of inactivity.
- Cleanup hint: `git worktree remove "$WT"` (the repo-namespaced path from step 2) when
  done — branch `pr-<PR>` is not auto-deleted. Removing the worktree leaves the site and
  its ledger record alone, since teammates may still be using the site.

## Notes

- Never print the JN site password back to the user, even if used for rsync fallback.
- Skip the local Docker environment entirely — it isn't needed for JN testing.
- For draft PRs, proceed normally but mention the PR is a draft in the report.
