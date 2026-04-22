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

## Pre-flight Checks (run all before starting)

Run these checks in order. Stop at the first failure and help the user fix it.

### Check 1: rsync installed

```bash
rsync --version
```

- If the command fails: tell user to `brew install rsync`
- If output contains `openrsync` on macOS: warn that `brew install rsync` is recommended for proper symlink handling

### Check 2: jetpack CLI available

```bash
pnpm jetpack --help
```

If missing: tell user to run `pnpm install` in the monorepo root.

### Check 3: Dependencies installed

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

```
execute-tool: jurassic-ninja / list-sites (include_passwords: true)
```

Branch based on the result and on what the user asked for:

- **User asked for a new/fresh/brand-new site** (phrases like "create a new JN site", "spin up a new one", "fresh site", "new jurassic ninja site"): skip straight to **Site creation** below, regardless of whether existing sites are present.
- **User did not ask for a new site, and the sites list is non-empty**: pick the first site (most recently created) and proceed to Check 6.
- **User did not ask for a new site, but the sites list is empty**: fall through to **Site creation** — don't stop and ask. The skill's job is to deliver a working site.

#### Site creation

Provision a site with Jetpack already enabled as a feature:

```
execute-tool: jurassic-ninja / provision-site (features: {"jetpack": "true"})
```

The provisioning response returns `domain`, `admin_login_url`, `ssh_command`, and `atomic_site_id`. Configuration runs asynchronously, so poll until the site is ready:

```
execute-tool: jurassic-ninja / list-sites (domain: <returned domain>, include_config: false)
```

Poll every ~10 seconds until the site's `status` reaches `2` (ready). Cap the wait at ~3 minutes; if still not ready, report the domain and `admin_login_url` and tell the user the site is still provisioning — they can retry the sync shortly.

Once the site is ready, re-run `list-sites` with `include_passwords: true` and `domain: <returned domain>` to fetch the full config (admin password, SFTP password) for later steps.

#### Connect Jetpack (optional but default when we just provisioned)

If the site was just provisioned, call:

```
execute-tool: jurassic-ninja / connect-jetpack (domain: <site domain>)
```

This remotely links the site to Jetpack using the creator's WP.com account. The tool is idempotent — it returns `already_connected` when Jetpack is already linked and `connected` on first success. Skip this step if the user explicitly said "don't connect Jetpack".

### Check 6: SSH access to Jurassic Ninja

Test whether the user has SSH key-based access configured for the JN SFTP host:

```bash
ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=no {domain}@ssh.atomicsites.net exit 2>&1
```

Where `{domain}` is the domain of the target site (e.g. `foo.jurassic.ninja`).

**If the command succeeds (exit code 0):** SSH keys are configured — skip password entirely. Set `SSH_OK=true`.

**If the command fails:** SSH key auth is not configured. Tell the user:

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

Then set `SSH_OK=false` and retrieve the password from the site data to use as a fallback.

## Workflow

### 1. Determine which plugin to sync

Default: `jetpack`. Use a different plugin only if the user specifies one. If the
user's request is "create a new JN site and connect it" (no code to sync),
skip directly to step 5 and report the site URL — there's nothing to rsync yet.

### 2. Pick the target site

Use the site resolved by Check 5:
- The freshly-provisioned site, if one was just created.
- Otherwise the first site from the existing list (most recently created), unless the user specifies a different one.

### 3. Build the plugin (only if needed)

Check whether the plugin's build output already exists. Most plugins use `build/` as the output directory, but Jetpack uses `_inc/build/`.

```bash
# For plugins/jetpack:
ls projects/plugins/jetpack/_inc/build/ 2>/dev/null
# For other plugins:
ls projects/plugins/{plugin}/build/ 2>/dev/null
```

**If build output exists:** Skip the build — it's already been done. Tell the user you're skipping the build since output exists.

**If build output is missing:** Build the plugin. Use `--deps` to also build any monorepo dependencies the plugin needs (e.g. packages it depends on). Without `--deps`, builds can fail if dependency packages haven't been built yet.

```bash
pnpm jetpack build --deps plugins/{plugin}
```

Note: `--deps` can take a while for plugins with many dependencies (like Jetpack). If the build is slow and the user wants to iterate quickly, they can pre-build once with `--deps` and then subsequent syncs will skip the build entirely.

If the build fails, stop and report the error to the user — do not proceed to rsync.

### 4. Run the rsync

The SSH host is always `ssh.atomicsites.net`.

**If SSH_OK is true** (key-based auth works):

```bash
pnpm jetpack rsync {plugin} {domain}@ssh.atomicsites.net:/srv/htdocs/wp-content/plugins/{plugin-slug} --non-interactive
```

No `--password` flag needed — SSH keys handle authentication.

**If SSH_OK is false** (falling back to password):

```bash
pnpm jetpack rsync {plugin} {domain}@ssh.atomicsites.net:/srv/htdocs/wp-content/plugins/{plugin-slug} --non-interactive --password='{JN_PASSWORD}'
```

The `--password` flag passes the SSH password automatically via `SSH_ASKPASS`.

### 5. Report results

After sync (or after site creation if no sync was needed), show:
- The admin login URL: `https://{domain}/?auto_login` (or the `admin_login_url` returned by `provision-site`)
- Whether Jetpack is connected (from `connect-jetpack` output, if called)
- Reminder: if rsyncing Jetpack plugin code, set `define('JETPACK_AUTOLOAD_DEV', true);` in a mu-plugin on the remote site
- If SSH_OK was false: remind the user to set up SSH keys for a smoother experience next time
- For brand-new sites: note the site expires after 7 days of inactivity
