# WPCom Lib — Reusable Operations

Generic helper functions that work on both Simple and Atomic/WoW WordPress.com sites. Use these instead of reimplementing platform-specific logic.

## Available Operations

### Site Owner (`lib/site-owner.php`)

| Function | Returns | Description |
|----------|---------|-------------|
| `wpcom_get_site_owner_id()` | `int` | Plan/site owner user ID. Returns `0` on self-hosted. |
| `wpcom_is_site_owner()` | `bool` | Whether the current user is the site owner. |

**Environment behavior:**
- **Simple:** uses `wpcom_get_blog_owner()`
- **Atomic:** uses Jetpack `master_user` option
- **Self-hosted:** returns `0` / `false`

**Example:**
```php
$owner_id = wpcom_get_site_owner_id();
if ( $owner_id ) {
    $owner = get_userdata( $owner_id );
    // send notification to $owner
}
```

### Admin Notifications (`lib/admin-notifications.php`)

| Function | Returns | Description |
|----------|---------|-------------|
| `wpcom_send_bell_notification( $recipient_id, $type, $data, $dedup_key )` | `void` | Send a WP.com bell notification. No-ops if unavailable. |

**`wpcom_send_bell_notification` parameters:**
- `$recipient_id` (int) — User ID to notify
- `$type` (string) — Notification type identifier (e.g. `'rtc_collaborator_blocked'`)
- `$data` (array) — Payload attached to the notification
- `$dedup_key` (string) — Deduplication key; repeat calls update the existing note

**Example:**
```php
$owner_id = wpcom_get_site_owner_id();

wpcom_send_bell_notification(
    $owner_id,
    'my_feature_event',
    array( 'blog_id' => get_current_blog_id(), 'post_id' => $post_id ),
    sprintf( 'my-feature-%d-%d', get_current_blog_id(), $post_id )
);
```

### Blog Transients (`lib/transients.php`)

| Function | Returns | Description |
|----------|---------|-------------|
| `wpcom_set_blog_transient( $key, $value, $expiration )` | `bool` | Set a blog-scoped transient. |
| `wpcom_get_blog_transient( $key )` | `mixed` | Get a blog-scoped transient. Returns `false` if not set. |
| `wpcom_delete_blog_transient( $key )` | `bool` | Delete a blog-scoped transient. |

**Why use these instead of `set_transient()` directly?** Intent clarity. These wrappers make it explicit that the data is per-blog. On Simple sites (multisite), `set_transient()` already stores per-blog in each blog's `wp_options` table. On Atomic (single-site), there is only one blog. The wrappers add no runtime logic.

**Example:**
```php
// Rate-limit an action to once per day per blog.
if ( ! wpcom_get_blog_transient( 'my_feature_throttle' ) ) {
    wpcom_set_blog_transient( 'my_feature_throttle', 1, DAY_IN_SECONDS );
    // Do the thing...
}
```

## Testing

Tests are in `tests/php/lib/`. Run with:
```bash
cd projects/packages/jetpack-mu-wpcom
composer phpunit -- --testsuite=lib
```

## Adding New Operations

1. Create a new file in `src/lib/` (one file per domain)
2. Use the `wpcom_` function prefix
3. Add a `require_once` in `src/lib/load.php`
4. Add tests in `tests/php/lib/`
5. Document the function in this AGENTS.md file
