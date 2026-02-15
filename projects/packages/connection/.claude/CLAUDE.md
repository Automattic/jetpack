# Jetpack Connection Package

Everything needed to connect a WordPress site to the WordPress.com (WPCOM) infrastructure. This package handles site registration, user authorization, token management, authenticated API requests, and identity crisis detection.

## Package Overview

- **Composer name**: `automattic/jetpack-connection`
- **Namespace**: `Automattic\Jetpack\Connection`
- **Entry point**: `actions.php` (hooks into `plugins_loaded` to call `Connection_Assets::configure()`)
- **PHP**: >=7.2
- **Test configs**: `phpunit.9.xml.dist`, `phpunit.11.xml.dist`

## Directory Structure

```
src/
  class-manager.php           # Central gateway - orchestrates all connection operations
  class-client.php            # Low-level signed HTTP requests to WPCOM
  class-tokens.php            # Token storage, retrieval, validation
  class-rest-connector.php    # Registers REST API endpoints for connection ops
  class-rest-authentication.php # Authenticates incoming WPCOM requests
  class-secrets.php           # Temporary secrets for registration/authorization
  class-webhooks.php          # OAuth callback handling
  class-error-handler.php     # Connection error reporting and display
  class-plugin.php            # Plugin metadata (which plugin uses this connection)
  class-plugin-storage.php    # Persistent plugin registry
  class-urls.php              # URL normalization for site/home URLs
  class-nonce-handler.php     # Replay attack prevention
  class-external-storage.php  # External storage providers (VIP, Atomic)
  class-utils.php             # Constants defaults, utility functions
  class-server-sandbox.php    # Dev sandbox routing
  class-heartbeat.php         # Periodic health checks
  class-tracking.php          # Tracks event integration
  class-authorize-json-api.php # Third-party JSON API authorization
  class-connection-notice.php # Admin notices for connection errors
  class-initial-state.php     # JS initial state for React components
  class-package-version.php   # Package version constant
  class-package-version-tracker.php # Tracks installed package versions
  class-partner.php           # Partner/affiliate code management
  class-partner-coupon.php    # Partner coupon handling
  class-terms-of-service.php  # TOS acceptance tracking
  class-tokens-locks.php      # Token operation locking
  class-user-account-status.php # WPCOM account status checks
  class-users-connection-admin.php # User connection admin UI
  class-xmlrpc-async-call.php # Batched async XML-RPC calls
  class-xmlrpc-connector.php  # XML-RPC method registration
  interface-manager.php       # Manager interface (deprecated)
  interface-storage-provider.php # External storage interface
  traits/
    trait-wpcom-rest-api-proxy-request.php  # WPCOM REST API proxy
  identity-crisis/            # URL mismatch detection between local site and WPCOM
    class-identity-crisis.php
    class-rest-endpoints.php
    class-ui.php
    class-url-secret.php
    class-exception.php
  sso/                        # Single Sign-On with WPCOM
    class-sso.php
    class-helpers.php
    class-force-2fa.php
    class-notices.php
    class-user-admin.php
  webhooks/
    class-authorize-redirect.php  # Handles redirect-based authorization
legacy/                       # Legacy compatibility classes (global namespace)
  class-jetpack-options.php       # Jetpack_Options - option storage with grouped options
  class-jetpack-signature.php     # Jetpack_Signature - HMAC request signing
  class-jetpack-ixr-client.php    # Jetpack_IXR_Client - XML-RPC client
  class-jetpack-ixr-clientmulticall.php
  class-jetpack-xmlrpc-server.php # Jetpack_XMLRPC_Server - incoming XML-RPC
  class-jetpack-tracks-client.php
  class-jetpack-tracks-event.php
tests/php/                    # PHPUnit tests (unit + integration)
docs/                         # Developer guides
dist/                         # Built JS/CSS assets
```

## How WPCOM Communication Works

### WPCOM API Endpoints

All REST API calls go through `Client::remote_request()` which signs requests via `Jetpack_Signature`.

Base URLs (defined in `class-utils.php`):
- **REST API**: `https://public-api.wordpress.com` (`JETPACK__WPCOM_JSON_API_BASE`)
- **XML-RPC/Registration**: `https://jetpack.wordpress.com/jetpack.` (`JETPACK__API_BASE`)

Key WPCOM endpoints consumed:
- `POST jetpack.wordpress.com/jetpack.register/{api_version}` - Site registration
- `POST jetpack.wordpress.com/jetpack.token/{api_version}` - OAuth token exchange
- `POST public-api.wordpress.com/wpcom/v2/sites/{blog_id}/jetpack-token-health` - Token validation
- `POST public-api.wordpress.com/wpcom/v2/sites/{blog_id}/jetpack-report-error/` - Error reporting

### Request Signing

Every authenticated request includes an HMAC signature built by `Jetpack_Signature` (in `legacy/`):

```
Authorization header contains:
- token: Public token identifier
- timestamp: Request time
- nonce: Random string for replay protection
- body-hash: SHA1 of request body (base64)
- signature: HMAC-SHA256 of (token, timestamp, nonce, body-hash, method, url)
```

The signing secret is the private half of the blog or user token, never sent over the network.

### Two Communication Channels

1. **REST API** (`Client::remote_request()`): Primary channel for site-to-WPCOM requests. Signs requests and sends them via `wp_remote_request()`.

2. **XML-RPC** (`Jetpack_IXR_Client`): Used for WPCOM-to-site callbacks and async batched operations. Includes `XMLRPC_Async_Call` for fire-and-forget calls dispatched at `shutdown`.

## Connection Flow

### 1. Site Registration (`Manager::register()`)

1. Generate temporary secrets via `Secrets::generate('register', user_id, 600)`
2. POST to WPCOM `/register` with site URL, secrets, plugin metadata
3. Receive back `jetpack_id` (WPCOM blog ID) and `jetpack_secret` (blog token)
4. Store blog token via `Tokens::update_blog_token()`
5. Fire `jetpack_site_registered` action

### 2. User Authorization (OAuth flow)

1. Build authorization URL pointing to WPCOM Calypso
2. User redirected to WPCOM, authenticates, grants access
3. WPCOM redirects back with authorization `code`
4. `Webhooks::handle_authorize()` exchanges code for token via POST to `/token`
5. Token validated (type `X_JETPACK`, scope includes role signature)
6. Store user token via `Tokens::update_user_token()`
7. First authorized user becomes "connection owner" (`master_user`)
8. Fire `jetpack_user_authorized` action

### 3. Disconnection (`Manager::disconnect_site()`)

1. Notify WPCOM via `disconnect_site_wpcom()`
2. Delete all tokens locally
3. Clear nonces, deactivate heartbeat
4. Fire `jetpack_site_disconnected` action

## Option Storage via `Jetpack_Options`

Options are organized into **grouped options** (stored as serialized arrays within a single WP option row) and **non-compact options** (stored as individual WP options with `jetpack_` prefix). This is managed by `Jetpack_Options` in `legacy/class-jetpack-options.php`.

### Grouped Option Types

| WP Option Row | Group Key | Purpose |
|---|---|---|
| `jetpack_options` | `compact` | General public Jetpack settings |
| `jetpack_private_options` | `private` | Sensitive data (tokens, secrets) |

### Where Connection Data Lives

**`jetpack_private_options`** (private group) — sensitive connection credentials:
- `blog_token` — (string) The site-level blog token (`key.secret`)
- `user_tokens` — (array) User tokens keyed by user ID
- `user_token` — (string) Single user token (deprecated)
- `purchase_token` — (string) Token for logged-out user purchases
- `token_lock` — (string) Token lock in format `expiration_date|||site_url`

**`jetpack_options`** (compact group) — non-sensitive connection metadata:
- `id` — (int) The WPCOM Blog ID
- `master_user` — (int) User ID of the connection owner
- `time_diff` — (int) Server clock offset for signature validation
- `public` — (int|bool) Site publicity setting
- `last_heartbeat` — (int) Timestamp of last heartbeat

**Non-compact options** (individual `jetpack_*` rows):
- `jetpack_activated` — Activation state
- `jetpack_tos_agreed` — (bool) Terms of service acceptance
- `jetpack_unique_connection` — (array) Connection/disconnection counter
- `jetpack_unique_registrations` — (int) Registration counter

### External Storage Override

Hosting platforms (VIP, Atomic) can provide custom storage backends for critical options via `Storage_Provider_Interface`. The allowlisted options for external storage are: `blog_token`, `id`, `master_user`, `user_tokens`. Controlled via `JETPACK_EXTERNAL_STORAGE_DISABLED` constant.

### Accessing Options

Always use `Jetpack_Options::get_option('name')` — never `get_option()` directly for connection data. The class handles routing to the correct grouped option or individual option automatically.

Token format: `{public_key}.{private_secret}` — the secret half is used for HMAC signing and never transmitted.

## REST API Endpoints (registered by this package)

| Endpoint | Method | Purpose |
|---|---|---|
| `/jetpack/v4/connection/register` | POST | Register site, get blog token |
| `/jetpack/v4/connection/authorize_url` | GET | Get user authorization URL |
| `/jetpack/v4/connection` | GET | Connection status |
| `/jetpack/v4/connection` | POST | Disconnect site |
| `/jetpack/v4/connection/reconnect` | POST | Full or partial reconnect |
| `/jetpack/v4/connection/check` | GET | Connection health check |
| `/jetpack/v4/connection/plugins` | GET | List connected plugins |
| `/jetpack/v4/connection/owner` | POST | Set connection owner |
| `/jetpack/v4/user-token` | POST | Update user token |
| `/jetpack/v4/remote_authorize` | POST | WPCOM-initiated user auth |
| `/jetpack/v4/remote_provision` | POST | Provision site with plan |
| `/jetpack/v4/remote_register` | POST | Remote site registration |
| `/jetpack/v4/remote_connect` | POST | Remote user connection |
| `/jetpack/v4/verify_registration` | POST | Verify registration secrets |

## Key Hooks

### Actions (fired by this package)
- `jetpack_site_registered` — After successful site registration
- `jetpack_user_authorized` — After user token stored
- `jetpack_authorize_starting` — Before authorization begins
- `jetpack_authorize_ending_authorized` — After full authorization completes
- `jetpack_unlinked_user` — After user disconnected
- `jetpack_site_before_disconnected` / `jetpack_site_disconnected` — Site disconnection
- `jetpack_verify_signature_error` — Signature verification failed
- `jetpack_connection_error_notice` — Display connection error admin notice
- `jetpack_heartbeat` — Periodic heartbeat
- `jetpack_reconnection_completed` — After reconnection

### Filters (extensibility points)
- `jetpack_remote_request_url` — Modify outgoing request URL
- `jetpack_connection_status` — Modify connection status response
- `jetpack_connection_error_notice_message` — Customize error message text
- `jetpack_token_redirect_url` — Customize post-authorization redirect
- `jetpack_build_authorize_url` — Modify the WPCOM authorization URL
- `jetpack_client_verify_ssl_certs` — Enable SSL certificate verification
- `jetpack_connection_secret_generator` — Custom secret generation callable
- `jetpack_offline_mode` — Force offline/dev mode
- `jetpack_rest_connection_check_response` — Modify connection check result
- `jetpack_options` — Filter any Jetpack option value on retrieval

## Sub-systems

### Identity Crisis (IDC)
Detects URL mismatches between the local site and what WPCOM has stored. Prevents data corruption when a site is migrated or cloned. Located in `src/identity-crisis/`.

### SSO (Single Sign-On)
Allows WPCOM users to log into the WordPress site using their WPCOM credentials. Includes 2FA enforcement. Located in `src/sso/`.

### Error Handler
Captures authentication failures, stores them in the database, optionally reports to WPCOM for validation. Verified errors are displayed as admin notices. See `docs/error-handling.md`.

### External Storage
Allows hosting platforms (VIP, Atomic) to provide custom token storage backends via `Storage_Provider_Interface`. See `class-external-storage.php`.

## Testing

```bash
# Run PHP tests
jetpack test php packages/connection

# Run specific test
jetpack test php packages/connection -- --filter=ManagerTest
```

## Key Dependencies

- `automattic/jetpack-constants` — Constant management
- `automattic/jetpack-status` — Site status checks (offline mode, staging)
- `automattic/jetpack-roles` — WordPress role mapping
- `automattic/jetpack-redirect` — WPCOM redirect URL building
- `automattic/jetpack-a8c-mc-stats` — Usage statistics
- `automattic/jetpack-admin-ui` — Admin page registration
- `automattic/jetpack-assets` — Asset management for JS/CSS

## Common Patterns When Modifying This Package

- Use `Manager` as the primary interface — avoid direct `Client` or `Tokens` calls from outside the package when possible.
- Token operations should go through `Tokens` class methods, not direct option reads.
- New REST endpoints go in `REST_Connector` — follow the existing pattern of separate permission callback and handler methods.
- WPCOM API calls must go through `Client::remote_request()` to ensure proper signing.
- Legacy classes in `legacy/` use the global namespace (`Jetpack_*`) — avoid adding new classes there.
- Use `Jetpack_Options::get_option()` for connection-specific options rather than `get_option()` directly. The class routes to the correct grouped/non-compact storage automatically.
- Tokens live in `jetpack_private_options` — never store sensitive credentials in `jetpack_options` (compact group).
