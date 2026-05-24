---
name: jetpack-test-jurassic-ninja
description: >
  Rsync a Jetpack monorepo plugin to a Jurassic Ninja test site for live testing.
  Creates a new JN site on demand when the user has none or asks for a fresh one.
  Use when the user wants to push/deploy/sync/test code on a Jurassic Ninja site,
  mentions "jurassic ninja", "JN site", "test live", "rsync to JN", "create a JN site",
  "spin up a new JN site", or says "/jetpack-test-jurassic-ninja". Handles site
  discovery, provisioning, Jetpack connection, password retrieval, and the jetpack
  rsync command automatically with no user interaction needed.
---

# Jetpack Test on Jurassic Ninja

Push a plugin from the Jetpack monorepo to a Jurassic Ninja ephemeral site. Fully
automated — no user interaction required after pre-flight checks pass. Can also
provision a brand-new JN site and connect Jetpack to it when the user asks for a
fresh environment or has no existing sites.

## Step 0: Classify the request (do this first)

Decide up front which shape the task is — it controls which checks and credentials you need. Don't fetch passwords or test SSH for flows that never touch SFTP.

- **`rsync`** — the user wants code from this monorepo pushed to a JN site (phrases like "sync", "rsync", "deploy", "push this branch", "test these changes on JN"). Needs rsync, build artifacts, and SFTP access.
- **`provision-only`** — the user only wants a site created/connected/inspected (phrases like "create a new JN site", "spin up a JN site", "connect Jetpack on a new site", "give me a fresh JN site to test in the browser"). No rsync, no SFTP, no password needed.
- **`mixed`** — default when ambiguous, or when the user says things like "spin up a new site and push my branch to it". Treat as `rsync` because SFTP is required.

The flow below is gated on this classification: checks that exist only to support rsync are skipped for `provision-only`. **Never fetch or display site passwords** unless the flow is `rsync` *and* SSH key auth has failed.

## Pre-flight Checks

Run these in order; stop at the first failure and help the user fix it. Some checks only apply to the `rsync` flow — skip them for `provision-only`, they're marked *(rsync only)*.

### Check 1: rsync installed *(rsync only)*

```bash
rsync --version
```

- If the command fails: tell user to `brew install rsync`
- If output contains `openrsync` on macOS: warn that `brew install rsync` is recommended for proper symlink handling

### Check 2: jetpack CLI available *(rsync only)*

```bash
pnpm jetpack --help
```

If missing: tell user to run `pnpm install` in the monorepo root.

### Check 3: Dependencies installed *(rsync only)*

```bash
ls node_modules/.package-lock.json
```

If missing: run `pnpm jetpack install -r` to install pnpm and composer dependencies.

### Check 4: Jurassic Ninja MCP provider

Try to load the `jurassic-ninja` MCP provider:

```
load-provider: jurassic-ninja
```

If it fails, tell the user:

> The `context-a8c` MCP server is not configured. Visit **mc.a8c.com/ai/context-a8c** to set it up, then restart Claude Code.

### Check 5: Pick or create a Jurassic Ninja site

Call `list-sites` **without** `include_passwords` unless the flow is `rsync` and you already know SSH key auth is unavailable. Omitting it keeps credentials out of the agent transcript for flows that never need them.

```
execute-tool: jurassic-ninja / list-sites (include_config: false)
```

(Use `include_config: false` for the initial lookup — domain/status is all we need to pick a site. Fetch the full config later only if required.)

Branch based on the result and what the user asked for:

- **User asked for a new/fresh/brand-new site**: skip to **Site creation** below regardless of existing sites.
- **Sites list is non-empty and user didn't ask for new**: pick the first site (most recently created) and proceed to Check 6 (if `rsync`) or jump to the workflow (if `provision-only`).
- **Sites list is empty and user didn't ask for new**: fall through to **Site creation** — don't stop and ask. The skill's job is to deliver a working site.

#### Site creation

Provision a site with Jetpack already enabled:

```
execute-tool: jurassic-ninja / provision-site (features: {"jetpack": "true"})
```

The response returns `domain`, `admin_login_url`, `ssh_command`, and `atomic_site_id`. Configuration runs asynchronously, so poll until the site is ready:

```
execute-tool: jurassic-ninja / list-sites (domain: <returned domain>, include_config: false)
```

Poll every ~10 seconds until the site's `status` reaches `2` (ready). Cap the wait at ~3 minutes; if still not ready, report the domain and `admin_login_url` and tell the user the site is still provisioning — they can retry the sync shortly.

#### Connect Jetpack (optional but default when we just provisioned)

If the site was just provisioned, call:

```
execute-tool: jurassic-ninja / connect-jetpack (domain: <site domain>)
```

This remotely links the site to Jetpack using the creator's WP.com account. Idempotent — returns `already_connected` when already linked and `connected` on first success. Skip if the user explicitly said "don't connect Jetpack".

### Check 6: SSH access to Jurassic Ninja *(rsync only)*

Skip this entire check for `provision-only` flows — we aren't using SFTP.

Test whether the user has SSH key-based access configured for the JN SFTP host:

```bash
ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=no {domain}@ssh.atomicsites.net exit 2>&1
```

Where `{domain}` is the domain of the target site (e.g. `foo.jurassic.ninja`).

**If the command succeeds (exit code 0):** SSH keys are configured. Set `SSH_OK=true`. **Do not fetch the site password** — it isn't needed and pulling it into the transcript is an avoidable credential leak.

**If the command fails:** SSH key auth isn't configured. Tell the user:

> SSH key authentication to `ssh.atomicsites.net` is not configured. If you are an Automattician, you can fix this by adding the following to your `~/.ssh/config`:
>
> ```
> Host ssh.atomicsites.net
>     HostName ssh.atomicsites.net
>     Include ~/.ssh/a8c-key.config
>     ProxyJump proxy.automattic.com
> ```
>
> For now, I'll use the site password instead.

Then set `SSH_OK=false` and **only now** fetch the site password:

```
execute-tool: jurassic-ninja / list-sites (domain: <site domain>, include_passwords: true)
```

Pull the SFTP password out of the returned config and use it for the rsync step only. Don't print it back to the user.

## Workflow

### 1. Determine which plugin to sync

`rsync` flow: default to `jetpack`; use a different plugin only if the user specifies one.
`provision-only` flow: skip this step and jump to step 5 — there's nothing to sync.

### 2. Pick the target site

Use the site resolved by Check 5 — freshly-provisioned if one was just created, otherwise the most recently created existing site (unless the user specified another).

### 3. Build the plugin (only if needed) *(rsync only)*

Check whether the plugin's build output already exists. Most plugins use `build/`, but Jetpack uses `_inc/build/`.

```bash
# For plugins/jetpack:
ls projects/plugins/jetpack/_inc/build/ 2>/dev/null
# For other plugins:
ls projects/plugins/{plugin}/build/ 2>/dev/null
```

**If build output exists:** skip the build and tell the user you're doing so.

**If missing:** build with `--deps` so monorepo dependency packages are built first:

```bash
pnpm jetpack build --deps plugins/{plugin}
```

Note: `--deps` can be slow for Jetpack. Pre-build once and subsequent syncs skip the build.

If the build fails, stop and report the error — don't proceed to rsync.

### 4. Run the rsync *(rsync only)*

The SSH host is always `ssh.atomicsites.net`.

**If `SSH_OK=true`** (key-based auth works):

```bash
pnpm jetpack rsync {plugin} {domain}@ssh.atomicsites.net:/srv/htdocs/wp-content/plugins/{plugin-slug} --non-interactive
```

No `--password` flag — SSH keys handle auth.

**If `SSH_OK=false`** (falling back to the password fetched in Check 6):

```bash
pnpm jetpack rsync {plugin} {domain}@ssh.atomicsites.net:/srv/htdocs/wp-content/plugins/{plugin-slug} --non-interactive --password='{JN_PASSWORD}'
```

`--password` passes the SSH password automatically via `SSH_ASKPASS`.

### 5. Report results

After sync (or after site creation for `provision-only`), show:
- The admin login URL: `https://{domain}/?auto_login` (or the `admin_login_url` returned by `provision-site`).
- Whether Jetpack is connected (from `connect-jetpack` output, if called).
- For `rsync` Jetpack-plugin flows: remind the user to set `define('JETPACK_AUTOLOAD_DEV', true);` in a mu-plugin on the remote site.
- If `SSH_OK` was false: remind the user to set up SSH keys for a smoother experience next time.
- For brand-new sites: note the site expires after 7 days of inactivity.

Do not echo back any site password in the final report, even if one was used for rsync.
