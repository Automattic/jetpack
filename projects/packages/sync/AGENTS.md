# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Essential Documentation

**Primary Reference**: [Sync README.md](./README.md) - Package overview and configuration

**Additional Resources**:

- [Automated Testing Overview](../../../docs/automated-testing.md) - Testing patterns and strategies
- [Coding Standards & Guidelines](../../../docs/coding-guidelines.md) - Development best practices
- [Jetpack HTTP API Documentation](../../../docs/rest-api.md) - REST API patterns
- [Jetpack CLI Documentation](../../../tools/cli/README.md) - CLI commands and workflows

## Project Overview

**automattic/jetpack-sync** is the PHP package responsible for syncing WordPress site data to the WordPress.com (WPcom) infrastructure. On WPcom, each connected site has a corresponding **"cache site"** — a replica of some of the Jetpack site's data. This enables services including Stats, Search, Related Posts, WooCommerce analytics, Activity Log, Publicize, Subscription Emails, and more.

Sync is **critical infrastructure**. Regressions here can silently break data replication for millions of sites. Changes should be made carefully and tested thoroughly.

## Architecture Overview

The Sync package operates as a **pipeline** with three stages:

```
WordPress actions/filters
        ↓
   [ Listener ]        — hooks into WP events, serializes and enqueues items
        ↓
   [ Queue ]           — persistent queue (options table or custom DB table)
        ↓
   [ Sender ]          — dequeues items and sends them to WPcom
        ↓
   WordPress.com
```

Actions are applied to the cache site in the **same order** they occurred on the Jetpack site — the queue is strictly ordered to ensure the cache site reflects the most recent state.

### Core Classes and Their Roles

| File | Class | Role |
|------|-------|------|
| `src/class-main.php` | `Main` | Entry point; sets up event handlers and hooks Sync into WordPress |
| `src/class-actions.php` | `Actions` | Hooks the Sync subsystem into WordPress — when to listen, when to send, when to full sync, cron scheduling |
| `src/class-listener.php` | `Listener` | Hooks into WP actions, serializes events, adds them to the queue |
| `src/class-sender.php` | `Sender` | Sends items to WPcom via XML-RPC/REST |
| `src/class-dedicated-sender.php` | `Dedicated_Sender` | Spawns a separate HTTP request to run the Sender outside of normal request shutdown |
| `src/class-queue.php` | `Queue` | Persistent, locking queue; uses options table or custom table storage |
| `src/class-modules.php` | `Modules` | Registry for all sync modules; manages loading and initialization |
| `src/class-health.php` | `Health` | Tracks sync health status; detects and reports data loss |
| `src/class-settings.php` | `Settings` | Manages all sync configuration options |
| `src/class-defaults.php` | `Defaults` | Defines default whitelists for options, callables, constants, etc. |
| `src/class-rest-endpoints.php` | `REST_Endpoints` | REST API endpoints for triggering full sync, checking status, etc. |

### Queues

The **`sync` queue** handles incremental sync of individual WP events (post saves, option updates, etc.).

Full sync no longer uses a separate queue. The current primary implementation (`Full_Sync_Immediately`) sends full sync actions directly without enqueuing them — using `'immediate-send'` as the queue ID rather than `'full_sync'`. A legacy `Full_Sync` module that uses a `full_sync` queue still exists in the codebase but is not the active implementation.

## Testing

Tests live in `tests/php/`. The test suite requires a WordPress environment and is run via the monorepo tooling:

```bash
jetpack test php packages/sync -v
```

Additionally, tests also live in the Jetpack plugin (`projects/plugins/jetpack/tests/php/sync/`) and can be run via:

```bash
jetpack test php plugins/jetpack --testsuite=sync -v
```

You can also run tests directly in the Docker environment, which is useful for targeting a specific test class or method with `--filter`. Before running Docker-based tests, ensure the environment is up:

```bash
jp docker up -d       # Start Docker WordPress containers
jp docker install     # Install WordPress in Docker (first time only)
```

```bash
# Run all sync tests in the Jetpack plugin via Docker
jetpack docker phpunit jetpack

# Run a specific test class
jetpack docker phpunit jetpack -- --filter=Jetpack_Sync_Listener_Test

# Run a single test method
jetpack docker phpunit jetpack -- --filter=Jetpack_Sync_Listener_Test::test_method_name
```

### E2E Testing

Sync E2E tests live in `projects/plugins/jetpack/tests/e2e/specs/sync/` (not in this package) and run automatically on PRs that affect `packages/sync`. See the [E2E README](../../plugins/jetpack/tests/e2e/README.md) for setup and run instructions.

When adding new behaviour, **always add a corresponding test**. Sync has no UI — tests are the only safety net.

## Pull Request Guidelines

When contributing to the Sync package, follow the Jetpack monorepo's standard PR process.

**Changelog entry required**: Every PR touching this package must include a changelog file in `changelog/`:

```bash
jp changelog add packages/sync -s patch -t fixed -e "Sync: Description of change."
```

**WPcom coordination**: If your change alters the structure of synced data (event names, argument shape, or new data types), flag this in your PR description. A coordinated WPcom-side update is required before the change can safely ship.

## Agent-Specific Guidelines

### Quality Checklist
- [ ] Tests pass: `jetpack test php packages/sync` and `jetpack test php plugins/jetpack --testsuite=sync`
- [ ] Static analysis passes: `jp phan packages/sync`
- [ ] Both sender paths (regular + dedicated) considered
- [ ] Queue logic changes consider both the `sync` queue and the full sync path (`Full_Sync_Immediately` sends without a queue)
- [ ] No changes to what data is silently dropped without explicit justification

### Common Pitfalls

**Whitelisted here ≠ retained on WPcom**
Adding a new item to the whitelist in this package controls whether it gets sent to WPcom. For it to be stored, it must also be whitelisted in WPcom's shadow replicastore. Without the WPcom-side entry, data arrives but will not be processed. Both sides filter independently; WPcom does not trust the package to filter correctly.

**Custom post types must be registered via sync**
Custom post types must be registered through callables/config sync, or posts will land in `jps_non-reg` status on the cache site.

**Both test suites must pass**
Tests live in this package (`tests/php/`) and in the Jetpack plugin (`projects/plugins/jetpack/tests/php/sync/`). Running only one can miss regressions.

**Format/protocol changes require WPcom coordination**
Changing the structure of synced data (event names, argument shape) requires a coordinated update on the WPcom side — it does not propagate automatically.

**User and author IDs differ on WPcom** *(see WPcom Interaction section)*
Remote users exist in shadow tables — `WP_User` lookups behave differently. `post_author` is remapped to the WPcom user ID, or `0` if no mapping exists (the original user ID is preserved in `_jetpack_post_author_external_id` postmeta).

## WPcom Interaction

### The WPcom Receiving Side

This package handles the Jetpack (sending) side only. The WPcom receiving side is a separate codebase — changes here do not automatically propagate there.

`src/class-server.php` in this repo fires `jetpack_sync_remote_action` with 8 parameters. WPcom's event processor fires the same action with 13 parameters (adding `$actor`, `$queue_size`, `$sync_storage_type`, `$sync_flow_type`, and `$endpoint_type`). Handlers hooking this action may receive different arguments depending on which side they run on.

All incoming data is treated as untrusted — options, meta values, and other synced fields may contain unexpected values from misbehaving plugins or themes and are sanitized before use on WPcom.

### The Processing Pipeline

**Incremental sync**
Events enqueued by the Listener are sent to WPcom via the WPcom REST API (when enabled) or XML-RPC (legacy fallback), and applied to the shadow replicastore in the order they were received. WPcom independently monitors queue health on the remote site and may trigger remediation (such as forcing a queue flush or initiating a full sync) when issues are detected. The queue ID for incremental sync events is `'sync'`.

**Full sync**
A full sync is a bulk re-send of all (or a subset of) site content. It can be triggered from WPcom directly, or automatically in response to detected data loss. Two special events mark its boundaries — `jetpack_full_sync_start` and `jetpack_full_sync_end` — which are received and processed like any other sync event. Incremental and full sync events travel through the same event processor pipeline on WPcom; the queue ID differentiates them (`'sync'` for incremental, `'immediate-send'` for full sync via the current `Full_Sync_Immediately` implementation), but the receive/decode/apply path is identical.

**Background jobs**
WPcom schedules background jobs in response to sync events and queue state. If queue lag on the remote site grows too large, WPcom will schedule a `jetpack_sync_pull` job to force the site to flush its queue, or a `jetpack_full_sync_pull` to trigger a full sync pull. Post-sync cleanup jobs may also run to reconcile stale records or remove users no longer present on the remote site.

Clearing a queue on the Jetpack side means those events won't reach WPcom through normal sync. The gap will persist until checksum validation detects the divergence and triggers a full sync to reconcile.

**Checksums**
Checksums are a separate, externally-triggered audit mechanism — not part of the sync event stream. The checksum process compares the state of the remote site against WPcom's shadow replicastore across posts, postmeta, comments, commentmeta, terms, term taxonomy, term relationships, termmeta, users, and usermeta (plus WooCommerce order and HPOS tables on supported versions).

Differences are located by recursively comparing checksums over progressively smaller ID ranges until individual mismatched items are identified. Differences fall into three categories: missing from WPcom, missing from the remote site, or different values.


**Elasticsearch (Jetpack Search)**
Sync is the data pipeline for Jetpack Search. When sync data arrives on WPcom, it is indexed into Elasticsearch to power search on the remote site. The search module ( `Jetpack_Sync_Module_Search` ) extends the sync postmeta whitelist with its own keys and maintains a separate list of indexable postmeta keys and taxonomies that controls what enters the ES index.

The practical consequence: adding a new postmeta key to the sync whitelist makes it available in the replicastore, but it will not be searchable unless the search module also includes it.

## Debugging Tools

- **Jetpack Debug Page** (`jptools.wordpress.com/debug`): Trigger full syncs, inspect queue state, view/update sync settings remotely, and run the Sync Validator to compare cache site vs. live site data. Available to proxied Automattic employees with expanded output.
- **WP-CLI (Jetpack site)**: `wp jetpack sync disable` / `wp jetpack sync enable` to control sync via SSH access on a Jetpack site.
