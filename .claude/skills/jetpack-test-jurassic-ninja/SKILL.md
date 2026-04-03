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
which rsync && rsync --version | head -1
```

- If missing: tell user to `brew install rsync`
- If output contains `openrsync` on macOS: warn that `brew install rsync` is recommended for proper symlink handling

### Check 2: jetpack CLI available

```bash
which jetpack
```

If missing: tell user to run `pnpm install` in the monorepo root, or `pnpm jetpack` to verify.

### Check 3: Dependencies installed

```bash
test -d "$(git rev-parse --show-toplevel)/node_modules" && echo "pnpm deps OK" || echo "MISSING"
```

If missing: run `jetpack install -r` to install pnpm and composer dependencies.

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

## Workflow

### 1. Determine which plugin to sync

Default: `jetpack`. Use a different plugin only if the user specifies one.

### 2. Pick the target site

Use the **first** site from the list (most recently created) unless the user specifies a different one.

### 3. Build the plugin

```bash
jetpack build plugins/{plugin}
```

Required — without it the remote site gets broken symlinks and fatal errors like `Class not found`.

If the build fails, stop and report the error to the user — do not proceed to rsync.

### 4. Run the rsync

Derive the SSH host from the site's `ssh_command` field (e.g. `ssh foo.jurassic.ninja@sftp.wp.com` → host is `sftp.wp.com`). Do not hardcode the SSH host — it may change.

```bash
jetpack rsync {plugin} {domain}@{ssh_host}:/srv/htdocs/wp-content/plugins/{plugin-slug} --non-interactive --password='{JN_PASSWORD}'
```

The `--password` flag passes the SSH password automatically via `SSH_ASKPASS`.

### 5. Report results

After sync completes, show:
- The admin login URL: `https://{domain}/?auto_login`
- Reminder: set `define('JETPACK_AUTOLOAD_DEV', true);` in a mu-plugin on the remote site
