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

The settings page is controlled by the `jetpack_wp_admin_newsletter_settings_enabled` filter (defaults to `true`). It registers a `Jetpack > Newsletter` submenu page in wp-admin with a React-based settings UI.

### Filters

#### `jetpack_wp_admin_newsletter_settings_enabled`

Controls whether the new wp-admin newsletter settings page is used. Defaults to `true`. When `false`, the existing settings pages are used instead (Calypso on WoA/Simple sites, the Jetpack Settings `#/newsletter` tab on standalone Jetpack sites). This filter will be removed in a future release.

```php
add_filter( 'jetpack_wp_admin_newsletter_settings_enabled', '__return_false' );
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

`Urls::get_newsletter_settings_url()` returns the appropriate newsletter settings URL based on site type and filter state.

## Reader link

### `activate_on_connection()`

`Reader_Link::activate_on_connection()` auto-activates the `wpcom-reader` module when a site is first connected to WordPress.com. It skips activation if modules were previously initialized (e.g., the user disconnected and reconnected), respecting prior module choices.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Newsletter is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
