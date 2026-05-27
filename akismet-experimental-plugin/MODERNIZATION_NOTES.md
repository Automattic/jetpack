# Akismet Experimental UI — branch notes

- **Plugin name:** Akismet Experimental UI
- **Path:** `akismet-experimental-plugin/`
- **Purpose:** Internal R&D — prototype admin UI for Akismet. Not shipped to WP.org.

## Activation

```php
// wp-config.php — preview mode (read-only).
define( 'AKISMET_EXPERIMENTAL_UI', true );

// Optional further gates (default off — see internal docs):
// define( 'AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS', true );
// define( 'AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API', true );
```

## Guardrails (summary)

- All three constants default OFF. Production sites do not define any of them.
- Real Blackbox API calls are gated behind `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API`; otherwise handlers serve deterministic mocks.
- Comment moderation writes are gated behind `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS`; otherwise the UI renders the buttons but blocks the request with a "preview mode" notice.
- The Blackbox Bearer key never reaches the browser; a PHPUnit tripwire (`tests/phpunit/test-bearer-tripwire.php`) asserts this.

## Owners

- Devin Walker (devin.walker@a8c.com) — exploration owner
