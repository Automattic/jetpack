# VideoPress abilities

VideoPress registers abilities through the shared Jetpack WP Abilities registrar on WordPress 6.9 and later. Older WordPress versions continue loading without registering abilities. The MCP Adapter is optional.

## Enable a pilot

Before VideoPress initializes, enable the shared rollout gate and the VideoPress pilot option:

```php
add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
```

```sh
wp option update videopress_abilities_enabled 1
```

The shared gate affects all participating Jetpack registrars. Configure its existing per-registration filter, `jetpack_wp_abilities_should_register`, if the pilot should expose only an allowlist. VideoPress does not enable that shared gate itself. Remove the VideoPress option to disable its registration on subsequent requests.

## Available abilities

| Name | Permission | Result |
| --- | --- | --- |
| `videopress/get-site-status` | `manage_options` | Activation, connection prerequisites, VideoPress site ID, and host type. |
| `videopress/get-settings` | `manage_options` | Effective video privacy default, automatic subtitle opt-out, preload opt-out, inline player preference, share-menu opt-out, site privacy, and host type. |

The settings read accepts an empty object and rejects unknown input fields. It performs no remote request, requires no active module or connection, and returns the same values as `Data::get_videopress_settings()`. On WordPress.com Simple, default video privacy follows site privacy.

This ability is read-only and idempotent. It opts into REST with `meta.show_in_rest` and MCP with `meta.mcp.public`; discovery does not bypass its permission callback. The execution callback also checks permission for direct PHP callers.

With authenticated administrator credentials, discover the `videopress` category at `/wp-json/wp-abilities/v1/abilities?category=videopress` and execute with `GET /wp-json/wp-abilities/v1/abilities/videopress/get-settings/run`. MCP clients use the installed adapter's discovery and execution tools.

The status read uses local connection state without fetching plans or remote site data. `active` follows the existing VideoPress standalone-plugin/module check. `connection_allows_actions` reports the connection prerequisite for the acting user, not permission to mutate a video or proof of plan entitlement. A registered site ID can remain present while its connection is broken. It is `null` when no positive site ID is configured.

## Incremental delivery

The first PR adds registration and settings reads; the second adds site status diagnostics. Follow-up PRs add capability discovery, then video library reads. Media writes, uploads and processing, editorial operations, channel management, and analytics follow as separate feature PRs. Each new ability needs its own schema, permission and host availability checks, and behavior tests.
