---
name: jetpack-test-jurassic-ninja
description: >
  Work with a Jurassic Ninja test site: rsync a monorepo plugin to one, spin up a fresh
  site, or run WP-CLI on one. Use when the user mentions "jurassic ninja" or "JN site",
  wants to push/deploy/sync/test code live, asks for a new site, or needs to know what a
  site is actually running — which plugin or package version loaded, options, logs, or
  reproducing a conflict there.
---

# Jetpack Test on Jurassic Ninja

Push a plugin from the Jetpack monorepo to a Jurassic Ninja ephemeral site. Fully
automated — no user interaction required after pre-flight checks pass. Can also
provision a brand-new JN site and connect Jetpack to it when the user asks for a
fresh environment or has no existing sites, and run WP-CLI on a site to inspect or
change what it's actually running.

## Step 0: Classify the request (do this first)

Decide up front which shape the task is — it controls which checks and credentials you need. Don't fetch passwords or test SSH for flows that never touch SFTP.

- **`rsync`** — the user wants code from this monorepo pushed to a JN site (phrases like "sync", "rsync", "deploy", "push this branch", "test these changes on JN"). Needs rsync, build artifacts, and SFTP access.
- **`provision-only`** — the user only wants a site created/connected/inspected (phrases like "create a new JN site", "spin up a JN site", "connect Jetpack on a new site", "give me a fresh JN site to test in the browser"). No rsync, no SFTP, no password needed.
- **`mixed`** — default when ambiguous, or when the user says things like "spin up a new site and push my branch to it". Treat as `rsync` because SFTP is required.

The flow below is gated on this classification: checks that exist only to support rsync are skipped for `provision-only`. **Never fetch or display site passwords** unless the flow needs shell or SFTP access *and* SSH key auth has failed.

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

Call `list-sites` **without** `include_passwords` unless the flow needs shell or SFTP and you already know SSH key auth is unavailable. Omitting it keeps credentials out of the agent transcript for flows that never need them.

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

### Check 6: SSH access to Jurassic Ninja *(when using rsync or WP-CLI)*

Skip this entire check when neither SFTP nor shell is needed.

Test whether the user has SSH key-based access configured for the JN SFTP host:

```bash
ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=no {domain}@ssh.atomicsites.net exit 2>&1
```

Where `{domain}` is the domain of the target site (e.g. `foo.jurassic.ninja`).

**If the command succeeds (exit code 0):** SSH keys are configured. Set `SSH_OK=true`. **Do not fetch the site password** — it isn't needed and pulling it into the transcript is an avoidable credential leak.

**If the command fails:** SSH key auth isn't configured. Tell the user:

> SSH key authentication to `ssh.atomicsites.net` is not configured. If you are an Automattician, you can fix this by adding the following near the **top** of your `~/.ssh/config`, above any broad `Host *` stanza (SSH is first-match-wins, so a general block earlier in the file can shadow these settings):
>
> ```
> Host ssh.atomicsites.net sftp.wp.com
>     Include ~/.ssh/a8c-key.config
>     ProxyJump proxy.automattic.com
> ```
>
> This is a one-time setup that covers every JN site you create from now on — the key
> authenticates you to a shared gateway, not to any individual site, so it keeps working
> as sites come and go.
>
> For now, I'll use the site password instead.

Both hostnames are listed because JN's `ssh_command` hands out `sftp.wp.com` while the rsync
step uses `ssh.atomicsites.net` — same gateway, two names. No `HostName` line is needed; it
defaults to whichever name was used. Verify with:

```bash
ssh -o BatchMode=yes {domain}@ssh.atomicsites.net "cd /srv/htdocs && wp option get blogname"
```

`BatchMode=yes` makes it fail rather than silently fall back to a password prompt, so the
result is an unambiguous yes/no on key auth.

Then set `SSH_OK=false` and **only now** fetch the site password:

```
execute-tool: jurassic-ninja / list-sites (domain: <site domain>, include_passwords: true)
```

Pull the SFTP password out of the returned config and use it for the rsync or shell step. Don't print it back to the user.

## Running commands on the site

To inspect or change site state — which package version actually loaded, options, logs,
toggling plugins — run WP-CLI over SSH.

**If key auth works**, just run it directly:

```bash
ssh {domain}@ssh.atomicsites.net "cd /srv/htdocs && wp plugin list"
```

**If key auth is unavailable**, drive the password prompt with `expect` (the
`context-a8c:jurassic-ninja-ssh` skill covers this too). Use the non-interactive form —
passing the command as an argument to `ssh` — rather than sending keystrokes into a login
shell, because a pty echoes and can mangle long input:

```bash
expect -c '
set timeout 120
log_user 0
spawn ssh -o StrictHostKeyChecking=no -o PubkeyAuthentication=no -T {domain}@sftp.wp.com {cd /srv/htdocs && wp plugin list}
expect { -re "assword:" { send "<JN_PASSWORD>\r"; log_user 1 } timeout { puts "TIMEOUT"; exit 1 } }
expect eof
'
```

Notes that save time:

- The shell lands in the home directory. `wp` itself resolves the install from anywhere, but
  **relative paths do not** — `cd /srv/htdocs` first whenever a command names a file
  (`wp-content/plugins/...`), or use absolute paths.
- Both `ssh.atomicsites.net` and `sftp.wp.com` work as hosts.
- To run a non-trivial PHP snippet, base64-encode it locally, decode it remotely to a temp file,
  and run `wp eval-file`. This sidesteps every layer of shell/expect quoting.
- `python3` is not installed on JN hosts. Use `php` for scripted file edits.
- Prefer a temporary mu-plugin under `wp-content/mu-plugins/` over editing plugin or theme
  files when you need code to run early in the request. Gate it behind an env var or query
  param so normal traffic and wp-admin stay unaffected, and delete it when finished.
- Back up any file you patch (`cp $F $F.bak`), and verify the restore afterwards. When
  grepping for a pattern containing `$`, quote it so the remote shell doesn't expand it —
  an unquoted `$host` silently becomes an empty string and a real match reports as zero.
- Page caching is on. Add a cache-busting query param when verifying that a change took effect.

## Gotchas when testing a Jetpack beta or branch build

**JN can leave two Jetpack plugins active at once.** Provisioning installs `jetpack-production`
(trunk), and the Jetpack Beta plugin adds a second copy in `jetpack-dev`. Both end up in
`active_plugins`. Because the Jetpack Autoloader resolves each package to the **highest
version** across all active plugins, trunk's packages can win and you end up testing trunk code
while believing you're testing the beta.

Always confirm what is actually active before trusting a result:

```bash
wp plugin list --fields=name,status,version
```

If both are active, deactivate the one you are not testing (`wp plugin deactivate
jetpack-production`) and re-verify. To confirm which copy of a class is really loaded:

```bash
wp eval 'echo (new ReflectionClass("Automattic\\Jetpack\\Status\\Host"))->getFileName();'
```

**Autoloader conflicts need forcing to reproduce.** Some third-party plugins bundle older
Jetpack packages with a plain Composer classmap and no Jetpack Autoloader. Merely activating
such a plugin usually does *not* reproduce a version conflict, because Jetpack's autoloader
registers with `prepend=true` and wins the lookup — so "installed it, nothing broke" is a
vacuous pass. To reproduce, force the older class to load before Jetpack boots (a gated
mu-plugin that `require_once`s the other plugin's copy). Then confirm the test is sensitive by
temporarily removing the guard under test and checking that it does fatal.

## Workflow

### 1. Determine which plugin to sync

`rsync` flow: default to `jetpack`; use a different plugin only if the user specifies one.
`provision-only` flow: skip this step and jump to step 5 — there's nothing to sync.
Running WP-CLI rather than syncing code: skip to [Running commands on the site](#running-commands-on-the-site).

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
