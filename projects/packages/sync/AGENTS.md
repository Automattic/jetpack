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
| `src/class-sender.php` | `Sender` | Sends items to WPcom via XMLRPC/REST |
| `src/class-dedicated-sender.php` | `Dedicated_Sender` | Spawns a separate HTTP request to run the Sender outside of normal request shutdown |
| `src/class-queue.php` | `Queue` | Persistent, locking queue; uses options table or custom table storage |
| `src/class-modules.php` | `Modules` | Registry for all sync modules; manages loading and initialization |
| `src/class-health.php` | `Health` | Tracks sync health status; detects and reports data loss |
| `src/class-settings.php` | `Settings` | Manages all sync configuration options |
| `src/class-defaults.php` | `Defaults` | Defines default whitelists for options, callables, constants, etc. |
| `src/class-rest-endpoints.php` | `REST_Endpoints` | REST API endpoints for triggering full sync, checking status, etc. |

### Two Queues

There are two distinct queues:
- **`sync` queue** — incremental sync of individual WP events (post saves, option updates, etc.)
- **`full_sync` queue** — used during a full site sync to batch-send all existing data

They are independent and both must be considered when changing queue logic.

## Testing

Tests live in `tests/php/`. The test suite requires a WordPress environment and is run via the monorepo tooling:

```bash
jetpack test php packages/sync -v
```

Additionally, tests also live in the Jetpack plugin (`projects/plugins/jetpack/tests/php/sync/`) and can be run via:

```bash
jetpack test php plugins/jetpack --testsuite=sync -v
```

You can also run tests directly in the Docker environment, which is useful for targeting a specific test class or method with `--filter`:

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

## Agent-Specific Guidelines

### Quality Checklist
- [ ] Tests pass: `jetpack test php packages/sync` and `jetpack test php plugins/jetpack --testsuite=sync`
- [ ] Both sender paths (regular + dedicated) considered
- [ ] Both queues (sync + full_sync) considered where relevant
- [ ] No changes to what data is silently dropped without explicit justification

### Common Pitfalls

**Whitelisted here ≠ retained on WPcom**
Adding a new item to the whitelist in this package controls whether it gets *sent* to WPcom. For it to be *retained*, it also needs to be whitelisted in the WPcom receiving codebase's sync defaults. Without the WPcom-side entry, data may arrive temporarily via incremental sync but will be removed during checksum verification or full sync. Exception: if the item is already natively available on WPcom, only the package-side entry may be needed.

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

This package handles the Jetpack (sending) side only. On WPcom, incoming sync data is processed via the `jetpack_sync_remote_action` WordPress action, which fires for each received event with parameters: `$action_name`, `$args`, `$user_id`, `$silent`, `$occurred_timestamp`, `$sent_timestamp`, `$queue_id`, `$token`, and `$actor`. The WPcom receiving side is a separate codebase — changes here do not automatically propagate there.

All incoming data is treated as untrusted — options, meta values, and other synced fields may contain unexpected values from misbehaving plugins or themes and are sanitized before use on WPcom.

### The Processing Pipeline

**Incremental sync**
Events enqueued by the Listener are sent to WPcom via HTTP and applied to the shadow replicastore in the order they were received. WPcom independently monitors queue lag on the remote site — if lag grows too large, WPcom will schedule a pull job to force the site to flush its queue, or eventually trigger a full sync.

**Full sync**
A full sync is a bulk re-send of all (or a subset of) site content. It can be triggered from WPcom directly, or automatically in response to detected data loss. Two special events mark its boundaries — `jetpack_full_sync_start` and `jetpack_full_sync_end` — which are received and processed like any other sync event. Incremental and full sync events travel through the same event processor pipeline on WPcom; the queue ID (`sync` vs `full_sync`) differentiates them, but the receive/decode/apply path is identical.

Note: `jetpack_full_sync_end` includes a `$checksum` parameter that is deprecated and unused since Jetpack 7.3 — full sync does not validate checksums on completion.

**Background jobs**
WPcom schedules background jobs in response to sync events and queue state. If queue lag on the remote site grows too large, WPcom will schedule a `jetpack_sync_pull` job to force the site to flush its queue, or a `jetpack_full_sync_pull` to trigger a full sync pull. Post-sync cleanup jobs may also run to reconcile stale records or remove users no longer present on the remote site.

This means clearing a queue on the Jetpack side does not stop an in-progress sync — if WPcom has already scheduled a pull job, the queue will be refilled shortly after being cleared.

**Checksums**
Checksums are a separate, externally-triggered audit mechanism — not part of the sync event stream. The checksum process compares the state of the remote site against WPcom's shadow replicastore across posts, postmeta, comments, commentmeta, terms, term taxonomy, and term relationships (plus WooCommerce HPOS tables on supported versions).

Differences are located using a histogram-based binary search: both sides produce checksums over ID ranges, differing ranges are subdivided recursively until individual mismatched IDs are found. Differences fall into three categories: missing from WPcom, missing from the remote site, or different values.

How mismatches are resolved depends on scale:
- **Small differences** (≤100 different, ≤500 missing from WPcom): WPcom self-heals by fetching those specific objects from the remote API and re-syncing them directly — no full sync needed
- **Large differences** (above those thresholds): WPcom falls back to triggering a full sync

This is why the dual whitelist requirement matters: an item not whitelisted in the WPcom receiving codebase's sync defaults will appear as "missing from WPcom" on every checksum run. For small numbers of items this may silently self-heal; at scale it will repeatedly trigger full syncs.

**Elasticsearch (Jetpack Search)**
Sync is the data pipeline for Jetpack Search. When post, postmeta, term, and taxonomy data arrives on WPcom via sync, it is indexed into Elasticsearch to power search on the remote site. This creates a second whitelist concern beyond the shadow replicastore: postmeta keys and custom taxonomies must also be explicitly listed in `Jetpack_Sync_Module_Search` to be included in the ES index.

The practical consequence: adding a new postmeta key to the sync whitelist makes it available in the replicastore, but it will not be searchable unless it is also added to the search module's allowlist.

## Debugging Tools

- **Jetpack Debug Page** (`jptools.wordpress.com/debug`): Trigger full syncs, inspect queue state, view/update sync settings remotely, and run the Sync Validator to compare cache site vs. live site data. Available to proxied Automattic employees with expanded output.
- **WP-CLI (Jetpack site)**: `wp jetpack sync disable` / `wp jetpack sync enable` to control sync via SSH access on a Jetpack site.
