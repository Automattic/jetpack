---
name: jetpack-test-jurassic-ninja
description: >
  Rsync a Jetpack monorepo plugin to a Jurassic Ninja test site for live testing.
  Use when the user wants to push/deploy/sync/test code on a Jurassic Ninja site,
  mentions "jurassic ninja", "JN site", "test live", "rsync to JN", or says
  "/jetpack-test-jurassic-ninja". Handles site discovery, password retrieval, and
  the jetpack rsync command automatically with no user interaction needed.
---

# Jetpack Test on Jurassic Ninja

Push a plugin from the Jetpack monorepo to a Jurassic Ninja ephemeral site. Fully automated — no user interaction required after pre-flight checks pass.

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

### Check 5: User has Jurassic Ninja sites

```
execute-tool: jurassic-ninja / list-sites (include_passwords: true)
```

If the sites list is empty, tell the user:

> You don't have any Jurassic Ninja sites. Create one at **https://jurassic.ninja/create**, wait for it to be ready, then try again.

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

Default: `jetpack`. Use a different plugin only if the user specifies one.

### 2. Pick the target site

Use the **first** site from the list (most recently created) unless the user specifies a different one.

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

After sync completes, show:
- The admin login URL: `https://{domain}/?auto_login`
- Reminder: set `define('JETPACK_AUTOLOAD_DEV', true);` in a mu-plugin on the remote site
- If SSH_OK was false: remind the user to set up SSH keys for a smoother experience next time
