# Identity Crisis (IDC)

Detects and resolves URL mismatches between what WPCOM expects (`wpcom_home`/`wpcom_siteurl`) and the site's actual URLs. Commonly triggered by site migrations, cloning, domain changes, or dynamic URLs via `$_SERVER['HTTP_HOST']` in `wp-config.php`.

## How IDC is Detected

1. Every outgoing WPCOM request (via `jetpack_remote_request_url` filter) appends `home` and `siteurl` query args
2. WPCOM compares these against stored values and returns `idc_detected` in the response body if they mismatch
3. `check_http_response_for_idc_detected()` picks this up from any `jetpack_received_remote_request_response` action
4. Error codes: `jetpack_url_mismatch`, `jetpack_home_url_mismatch`, `jetpack_site_url_mismatch`
5. IDC data stored in `sync_error_idc` option (non-compact, so `jetpack_sync_error_idc` in DB)

## Safe Mode

When in IDC, the site enters **safe mode**. This is not a full disconnection — the connection and tokens remain intact. What changes:

- **Sync is blocked.** `Status::in_safe_mode()` returns `true`, and `Sync\Actions::sync_allowed()` returns `false`. No data (posts, options, comments) is synced to WPCOM, preventing the cloned/migrated site from overwriting production data.
- **SSO is disabled.** Login via WordPress.com is blocked with a notice ("Logging in with WordPress.com is disabled for sites that are in safe mode").
- **Disconnect is suppressed.** The `jetpack_connection_disconnect_site_wpcom` filter returns `false`, preventing the site from notifying WPCOM during disconnect (to avoid disconnecting the production site).
- **IDC URL args skipped.** `add_idc_query_args_to_url()` skips appending `home`/`siteurl` to outgoing requests when `validate_sync_error_idc_option()` is true.
- **Admin UI shows IDC banner.** The React IDC resolution screen displays in wp-admin with options to resolve. An admin bar button labeled "Jetpack Safe Mode" appears.

Everything else continues to work — the site remains connected, REST API endpoints are available, tokens are valid, and authenticated WPCOM requests (outside of sync) still function.

Key options:
- `sync_error_idc` — IDC error data: local URLs, WPCOM URLs, error code, timing fields (`last_checked`, `next_check_delay`)
- `safe_mode_confirmed` — Admin explicitly confirmed safe mode
- `migrate_for_idc` — Flags that sync actions should be accepted (URL migration path)
- `identity_crisis_url_secret` — Short-lived secret (5min) for verifying same-site IDC
- `identity_crisis_ip_requester` — IP addresses making requests (for IP-based site URLs)

WPCOM URLs are stored **reversed** in the database (to survive search-and-replace during migrations). The `reverse_wpcom_urls_for_idc` filter on `jetpack_options` un-reverses them on read.

## Remote Validation (Auto-Resolution)

IDC validates periodically against WPCOM to auto-clear if the mismatch resolves:

- Progressive backoff: starts at 1 hour, doubles each check (1h → 2h → 4h → ...), max 30 days
- Uses `jetpack-token-health/blog` endpoint with current URLs
- If WPCOM no longer detects IDC, the `sync_error_idc` option is deleted automatically
- Skipped if safe mode is confirmed by admin
- Protected by `jetpack_idc_validation_lock` transient to prevent concurrent validations

## Resolution Paths (User-Initiated)

Three options via REST endpoints (require `jetpack_disconnect` capability):

1. **Confirm Safe Mode** (`POST /jetpack/v4/identity-crisis/confirm-safe-mode`) — Keep site in safe mode, stop auto-validation
2. **Migrate** (`POST /jetpack/v4/identity-crisis/migrate`) — Transfer stats/subscribers from old URL to new URL. Sets `migrate_for_idc` option
3. **Start Fresh** (`POST /jetpack/v4/identity-crisis/start-fresh`) — Disconnect without notifying WPCOM, re-register as new site. Fires `jetpack_idc_disconnect` action

## URL Secret Verification

`URL_Secret` class creates short-lived secrets (5 min) stored in `identity_crisis_url_secret` option. Used by WPCOM to verify whether two URLs belong to the same physical site (same DB = same secret).

Endpoints:
- `GET /jetpack/v4/identity-crisis/idc-url-validation` — Returns URLs + creates secret (requires blog token auth)
- `GET /jetpack/v4/identity-crisis/url-secret` — Fetch existing secret (requires blog token auth)
- `POST /jetpack/v4/identity-crisis/compare-url-secret` — Compare secret (only on non-connected sites)

## Files

All under `src/identity-crisis/`. Note the namespace split: the main class lives in `Automattic\Jetpack`, everything else in `Automattic\Jetpack\IdentityCrisis`.

- `class-identity-crisis.php` — `Automattic\Jetpack\Identity_Crisis`. Core detection, validation, backoff logic
- `class-rest-endpoints.php` — `Automattic\Jetpack\IdentityCrisis\REST_Endpoints`. REST API endpoints
- `class-ui.php` — `Automattic\Jetpack\IdentityCrisis\UI`. Admin UI: enqueues React IDC screen, provides initial state to JS
- `class-url-secret.php` — `Automattic\Jetpack\IdentityCrisis\URL_Secret`. Short-lived secret creation/comparison
- `class-exception.php` — `Automattic\Jetpack\IdentityCrisis\Exception`. IDC-specific exception class
- `_inc/admin.jsx` — React entry point for the IDC resolution screen (built to `dist/identity-crisis.js`)
- `_inc/style.scss`, `_inc/admin-bar.scss` — IDC UI styles

## Key Constants / Filters

- `JETPACK_SHOULD_HANDLE_IDC` — Constant to force IDC handling on/off
- `jetpack_should_handle_idc` — Filter, defaults to `true` on single sites, `false` on multisite with `SUNRISE`
- `jetpack_sync_error_idc_validation` — Filter the validation result
- `jetpack_idc_disconnect` — Action fired during "start fresh" resolution
- `jetpack_idc_authorization_url` — Filter the reconnection URL after start-fresh

## Persistent Blog ID

`jetpack_persistent_blog_id` (standalone WP option, not in `jetpack_options`) survives disconnection. Sent during re-registration so WPCOM can associate the new connection with the original site for potential data recovery.