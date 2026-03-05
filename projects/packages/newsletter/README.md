# Jetpack Newsletter

This package provides some of the newsletter functionality for Jetpack, including:

- **Settings page** — A wp-admin settings screen for newsletter configuration (`Jetpack > Newsletter`).
- **URL helper** — Centralized logic for generating the correct newsletter settings URL based on site type and configuration.
- **Reader link** — An admin bar link to the WordPress.com Reader.

Other functionality remains in the subscriptions module of Jetpack itself.

## Initialization

Both `Settings` and `Reader_Link` use singleton-style initialization. Call their `init()` methods early (e.g., on `plugins_loaded`):

```php
use Automattic\Jetpack\Newsletter\Settings;
use Automattic\Jetpack\Newsletter\Reader_Link;

Settings::init();
Reader_Link::init();
```

## Settings page

The settings page is gated behind the `jetpack_wp_admin_newsletter_settings_enabled` filter (defaults to `false`). When enabled, it registers a `Jetpack > Newsletter` submenu page in wp-admin with a React-based settings UI.

### Filters

#### `jetpack_wp_admin_newsletter_settings_enabled`

A temporary filter used during development of this package. When `true`, the new wp-admin newsletter settings page is used. When `false` (default), the existing settings pages are used instead (Calypso on WoA/Simple sites, the Jetpack Settings `#/newsletter` tab on standalone Jetpack sites). This filter will be removed once the new settings page is ready for general use.

```php
add_filter( 'jetpack_wp_admin_newsletter_settings_enabled', '__return_true' );
```

#### `jetpack_show_newsletter_menu_item`

Controls visibility of the `Jetpack > Newsletter` menu item when the settings page is enabled. Defaults to `true`. Set to `false` to hide the menu item while keeping the page accessible via direct URL.

Only takes effect when `jetpack_wp_admin_newsletter_settings_enabled` is `true`.

```php
add_filter( 'jetpack_show_newsletter_menu_item', '__return_false' );
```

### Behavior by site type

| Site type | Settings enabled = false | Settings enabled = true |
|---|---|---|
| **Standalone Jetpack** | No menu item. Tab in Jetpack Settings `#/newsletter`. | `Jetpack > Newsletter` menu item linking to wp-admin settings page. |
| **WoW** | `Jetpack > Newsletter` menu item linking to Calypso. | `Jetpack > Newsletter` menu item linking to wp-admin settings page. |
| **Simple** | `Jetpack > Newsletter` menu item linking to Calypso. | `Jetpack > Newsletter` menu item linking to wp-admin settings page. |

On WoW and Simple sites, the menu item when `settings_enabled = false` is added by `jetpack-mu-wpcom`'s `wpcom-admin-menu.php`, not by this package.

### Reading page notice

When the subscriptions module is active, a notice is added to the wp-admin **Settings → Reading** page next to the "For each post in a feed" option. It clarifies that the RSS excerpt setting does not control newsletter emails and links to the Newsletter settings page.

## URL helper

`Urls::get_newsletter_settings_url()` returns the appropriate newsletter settings URL based on site type and filter state. When the settings page is enabled, it always returns the wp-admin URL. Otherwise, it returns the Calypso or Jetpack Settings URL depending on site type and interface preference.

```php
Urls::get_newsletter_settings_url( $site_slug, $force_calypso_fallback, $relative_calypso_path );
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `$site_slug` | `string\|null` | `null` | Site slug for Calypso URLs (e.g., `example.com`). Use `( new Status() )->get_site_suffix()`. |
| `$force_calypso_fallback` | `bool` | `false` | Force Calypso URL as fallback (e.g., for Personal/Premium Atomic plans). |
| `$relative_calypso_path` | `bool` | `false` | Return a relative Calypso path (`/settings/newsletter/...`) instead of a full URL. |

On WoA sites when the new settings page is not enabled, the returned URL depends on the `wpcom_admin_interface` option — `wp-admin` returns the Jetpack Settings URL, while a Calypso preference returns the Calypso URL.

## Reader link

### `activate_on_connection()`

`Reader_Link::activate_on_connection()` auto-activates the `wpcom-reader` module when a site is first connected to WordPress.com. It skips activation if modules were previously initialized (e.g., the user disconnected and reconnected), respecting prior module choices.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Newsletter is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
