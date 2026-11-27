# Proposals

An agent stages changes to a site as a proposal. It shows the person what will change in the chat, with a link to preview the change on the live site. The person can open the preview or skip it, then tells the agent to apply or reject the proposal. Nothing on the live site changes until the agent applies the version the person approved.

The site-side code lives here. The agent-facing tools (MCP abilities) live on WordPress.com and call `Proposals` directly on Simple sites. Atomic sites will get REST routes that wrap the same methods.

Paths are relative to this directory.

## Files

| File | What it holds |
|---|---|
| `proposals.php` | The entry file, loaded by `Jetpack_Mu_Wpcom::load_features()`. Registers the `proposals` feature flag, and only adds hooks while the flag is on. The only file with side effects |
| `class-proposals.php` | `Proposals`, the public API and engine |
| `class-proposal-store.php` | The post type, statuses, payload encoding and validation on read |
| `class-proposal-lock.php` | Locks held while a proposal changes |
| `class-proposals-preview.php` | The front-end preview: routing, cache bypass and the preview bar |
| `interface-proposal-handler.php` | The interface each type of change implements |
| `handlers/class-post-fields-handler.php` | Fields on existing published posts and pages |

The classes are classmapped and side-effect free, so WordPress.com can call them after `switch_to_blog()`, where no loader has run. Post type registration is lazy for the same reason.

## Turning it on

- **The flag.** `Feature_Flags::is_enabled( 'proposals' )`, off by default. Turn it on with the `jetpack_feature_flag_enabled_proposals` filter, or per site from the feature flags screen.
- **Who can use it.** `jetpack_proposals_user_has_access` (default `true`) narrows access further. Capability checks still apply on top.

While the flag is off, `get()` and `get_by_uuid()` return null, the `current_user_can_*()` checks return false, and `create()`, `update()`, `discard()`, `apply()` and `reject()` return `proposal_unavailable`.

## What a proposal can change

This release has one handler, `post_fields`. A proposal can change up to 20 existing published posts or pages. For each post it can change the title, content, excerpt, slug, featured image, categories, tags and the meta keys in `Post_Fields_Handler::META_ALLOWLIST`, which includes Jetpack's SEO keys.

Other types (templates, navigation, global styles, settings) are each a new class implementing `Proposal_Handler`, registered through the `jetpack_proposals_handlers` filter. A type that creates content will need a way to refer to it from other items; none exists yet.

## The API

| Method | Notes |
|---|---|
| `create( $title, $items )` | An item with no `type` is a `post_fields` change. Returns `{ proposal, warnings }` |
| `update( $id, $title, $items )` | Pass null to keep the title or the items. Changing the items changes the hash |
| `get( $id )`, `get_by_uuid( $uuid )` | |
| `query( $statuses, $target )` | Summaries (`to_summary()`) of proposals the user can manage or review, newest first: at most 20, from the newest 200 with those statuses. `$target` is a key such as `post:12` |
| `discard( $id )` | |
| `apply( $id, $hash, $context )` | The hash must be the version the person approved. `$context` takes `client` and `agent` names, which are recorded |
| `reject( $id, $hash, $note, $context )` | Records the person's note for the agent |
| `current_user_can_manage()`, `current_user_can_review()` | Manage: the author, or `edit_others_posts`. `update()` and `discard()` enforce it. Review: every handler agrees, for `post_fields` `edit_post` on every post. `apply()` and `reject()` enforce it |
| `to_response( $proposal, $warnings )` | The shape agents see, including `hash`, `preview_url`, `items` (each with its `target`, `preview_url` and a description of the change), `conflicts`, `applied` and `apply_stopped` |

Error codes all start `proposal_`. PHP and REST callers branch on them, so keep them stable. MCP clients receive only the message, so each message says what happened, whether anything changed, and what to do next.

## Approval in chat

- **What the server enforces:**
  - Apply and reject take the payload hash, so an update after the person agreed makes apply fail with `proposal_changed`.
  - Every item is checked for the current user.
  - The record of who acted, when and through which client is kept in `_jetpack_proposal_review`.
- **What it cannot enforce:** that the person actually said yes. That rests on the agent and on the client confirming destructive tool calls.
- **The preview is optional.** A person who approves from the chat alone is fine, so apply never checks whether a preview was opened.

Proposals are a review workflow, not a containment boundary. The agent acts with its user's credentials, and other tools can edit the same content directly.

## Storage

- Each proposal is a `jetpack_proposal` post. It is hidden from the UI and REST, and its capabilities are granted to no role, so only this feature writes it. Super admins on multisite still pass capability checks, which is one reason the payload is validated on read.
- The UUID in `post_name` is the preview token. Numeric IDs are never accepted in preview URLs.
- `post_content` holds a version 2 JSON payload of typed items: `{ id, type, target, base, change }`. `base` is the live state the item was built against.
- The statuses are `jpp-pending`, `jpp-applied`, `jpp-rejected`, `jpp-stale` and `jpp-discarded`.
- The SHA-256 hash of `post_content` identifies the version a person approves.

## Safeguards

- **Validation on read.** Each handler checks every stored item's shape and allowlists, and a failure empties the proposal, so it cannot be previewed or applied (`proposal_invalid`). For `post_fields`, text meta must already be sanitized. Titles, content and excerpts are filtered with kses when proposed, even for users with `unfiltered_html`, so the preview, which filters them again before rendering, shows everything apply will write; apply filters them again as the person applying. Apply checks a proposed page template still exists. A status set outside the feature, such as trash, reads as `discarded`.
- **Conflicts.** Apply checks every item against its `base` first. If any changed, nothing is written and the proposal becomes stale. A successful apply marks stale any other pending proposal that shares a target and can no longer apply. For `post_fields`, any write to a post's title, content, excerpt or slug changes its modified time, so other pending proposals for that post go stale. A meta-only or term-only apply leaves other proposals for the same post pending.
- **Preview requests.**
  - A preview covers only the URL carrying the `jetpack_proposal` parameter. Links from it lead to the live site, and nothing is remembered between requests. Each item has its own `preview_url`.
  - Previews need a logged-in user who can review every item, and they bypass page caches.
  - While a preview renders, writes to the previewed posts and their meta are blocked. Term writes and direct database writes are not.
  - An outdated proposal shows the live site, with a notice.
- **Revisions.** Title, content and excerpt changes go through `wp_update_post()`, so they create a revision credited to the person applying. Slug, featured image, term and meta changes create none.
- **Jetpack Sync.** Proposals add their post type to Sync's post type denylist, through its option filters, while the flag is on.

## Locks

Apply, update, discard and reject each hold a `_jetpack_proposal_lock_<ID>` option while they run; the others get `proposal_locked`. An apply also holds a `_jetpack_proposal_lock_target_<md5>` option for each target it writes, such as `post:12`, so two proposals for the same post cannot apply at once.

Locks never expire. They are released when the call finishes, at shutdown, and from the `wp_php_error_message` filter, since WordPress's fatal error handler exits before later shutdown functions run. A worker killed outright leaves them behind: list them with `wp option list --search='_jetpack_proposal_lock_*' --format=json`, confirm the request on the recorded `host` has stopped, then `wp option delete <option name>`.

Retrying an apply that died is safe: anything it wrote shows up as a conflict, so the retry goes stale without writing.

## Known limits

- **Apply has no transaction.** If one item fails, the others are still applied and the proposal is marked applied. Each item's outcome is in `applied`. An apply that dies partway is reported as `apply_stopped`, without saying which items were written.
- **Some writes are not guarded.** The write guard cannot stop term writes or direct `$wpdb` writes.
- **The stale scan is capped.** It only checks the newest 100 pending proposals. Older ones that overlap stay pending, but apply still refuses them.

## Tests

`tests/php-sqlite/features/proposals/` runs against SQLite, because WorDBless cannot run the queries Proposals depends on. Run it with `composer phpunit-sqlite` from the package directory. It also runs as part of `composer test-php`.
