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
    // send notification to $owner->user_email
}
```

### Admin Notifications (`lib/admin-notifications.php`)

| Function | Returns | Description |
|----------|---------|-------------|
| `wpcom_send_bell_notification( $recipient_id, $type, $data, $dedup_key )` | `void` | Send a WP.com bell notification. No-ops if unavailable. |
| `wpcom_send_email_notification( $to_email, $subject, $html )` | `void` | Send an HTML email via `wp_html_mail` or `wp_mail`. |
| `wpcom_build_email_html( $hero_url, $heading, $body, $cta_url, $cta_label )` | `string` | Build a branded HTML email template. |

**`wpcom_send_bell_notification` parameters:**
- `$recipient_id` (int) — User ID to notify
- `$type` (string) — Notification type identifier (e.g. `'rtc_collaborator_blocked'`)
- `$data` (array) — Payload attached to the notification
- `$dedup_key` (string) — Deduplication key; repeat calls update the existing note

**`wpcom_build_email_html` output:** Single-column branded email with hero image, heading, body text, and CTA button. Uses `#3858e9` brand color.

**Example:**
```php
$owner_id = wpcom_get_site_owner_id();
$owner    = get_userdata( $owner_id );

wpcom_send_bell_notification(
    $owner_id,
    'my_feature_event',
    array( 'blog_id' => get_current_blog_id(), 'post_id' => $post_id ),
    sprintf( 'my-feature-%d-%d', get_current_blog_id(), $post_id )
);

$html = wpcom_build_email_html(
    'https://example.com/hero.png',
    'Something happened',
    'Description of what happened and what to do.',
    'https://wordpress.com/action-url',
    'Take Action'
);
wpcom_send_email_notification( $owner->user_email, 'Something happened', $html );
```

### Site Slug (`lib/site-slug.php`)

| Function | Returns | Description |
|----------|---------|-------------|
| `wpcom_get_site_slug()` | `string` | Site slug for WP.com URLs. |

**Environment behavior:**
- **Simple:** native `wpcom_get_site_slug()` (this lib does not override it)
- **Atomic:** falls back to `Jetpack\Status::get_site_suffix()`
- **Self-hosted:** returns the `home_url()` hostname

## Testing

Tests are in `tests/php/lib/`. Run with:
```bash
cd projects/packages/jetpack-mu-wpcom
composer phpunit -- --testsuite=lib
```

Some tests may skip in environments where `Jetpack_Options` is not available.

## Adding New Operations

1. Create a new file in `src/lib/` (one file per domain)
2. Use the `wpcom_` function prefix
3. Add a `require_once` in `src/lib/load.php`
4. Add tests in `tests/php/lib/`
5. Document the function in this AGENTS.md file
