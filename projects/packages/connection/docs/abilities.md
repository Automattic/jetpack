# Connection Abilities (WordPress Abilities API)

The Connection package registers abilities with the [WordPress Abilities API](https://make.wordpress.org/core/) so that AI agents and other consumers can inspect a site's Jetpack connection state through the standard `wp-abilities/v1` REST surface (and as an MCP tool) instead of reverse-engineering `Jetpack_Options` keys.

The relevant class is `Automattic\Jetpack\Connection\Abilities\Connection_Abilities`, which extends the shared `Registrar` from the `automattic/jetpack-wp-abilities` package.

> **Requirements:** The Abilities API ships with WordPress 6.9+. On older versions the registration hooks never fire, so initialization is a safe no-op.

## Registered abilities

| Ability | Type | Description |
|---------|------|-------------|
| `jetpack/get-connection-status` | read-only | Returns the site-level Jetpack connection state in one zero-argument call. |

All abilities are registered under the shared `jetpack` ability category (label `Jetpack`), which the Jetpack plugin also contributes to.

### `jetpack/get-connection-status`

A read-only, idempotent ability that is safe to poll. It takes no input and returns:

| Field | Type | Description |
|-------|------|-------------|
| `site_registered` | `boolean` | `true` when the site has a blog id and a blog token. |
| `user_connected` | `boolean` | `true` when at least one user has linked their WordPress.com account. |
| `master_user` | `integer\|null` | Local user id of the connection owner (the user who registered the site), or `null` if there is no owner. |
| `blog_id` | `integer\|null` | The WordPress.com site id, or `null` when the site has not been registered. |
| `registration_url` | `string\|null` | The wp-admin URL the site owner should visit to register the site when `site_registered` is `false`; `null` once the site is registered. |
| `connection_version` | `string` | The running Jetpack Connection package version. |

**Permissions:** Access is gated on `current_user_can( 'jetpack_admin_page' )`, mirroring the capability used by the Jetpack admin page.

**MCP:** This ability is opted into the MCP tool surface (`meta.mcp.public = true`), so it is exposed as a public MCP tool.

## Initialization

The abilities are not registered automatically when you configure the connection package — a consumer must call `init()` once. The Jetpack plugin does this during its own setup:

```php
\Automattic\Jetpack\Connection\Abilities\Connection_Abilities::init();
```

`init()` hooks the category and ability registration onto the `wp_abilities_api_categories_init` and `wp_abilities_api_init` actions respectively, so it is safe to call early (for example on `plugins_loaded`).

## Filters

| Filter | Description |
|--------|-------------|
| `jetpack_connection_abilities_manager` | Filters the `Manager` instance used to resolve connection state. Primarily a testing seam — production callers should leave the default. Non-`Manager` return values are discarded. |

## Unit tests

The abilities are covered by PHPUnit tests in `tests/php/abilities/Connection_Abilities_Test.php`:

```bash
cd projects/packages/connection
composer phpunit -- --filter Connection_Abilities_Test
```
