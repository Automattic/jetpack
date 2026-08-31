# Jetpack Newsletter

This package provides some of the newsletter functionality for Jetpack, including:

- **Settings page** — A wp-admin settings screen for newsletter configuration (`Jetpack > Newsletter`).
- **URL helper** — Centralized logic for generating the correct newsletter settings URL based on site type and configuration.
- **Reader link** — An admin bar link to the WordPress.com Reader.
- **Daily Writing Prompt widget** — A wp-admin dashboard widget that surfaces blogging prompts.

Other functionality remains in the subscriptions module of Jetpack itself.

## Initialization

`Settings`, `Reader_Link`, and `Writing_Prompt_Widget` use singleton-style initialization. Call their `init()` methods early (e.g., on `plugins_loaded`):

```php
use Automattic\Jetpack\Newsletter\Settings;
use Automattic\Jetpack\Newsletter\Reader_Link;
use Automattic\Jetpack\Newsletter\Writing_Prompt_Widget;

Settings::init();
Reader_Link::init();
Writing_Prompt_Widget::init();
```

## Settings page

Registers a `Jetpack > Newsletter` submenu page in wp-admin with a React-based settings UI.

### Filters

#### `jetpack_show_newsletter_menu_item`

Controls visibility of the `Jetpack > Newsletter` menu item. Defaults to `true`. Set to `false` to hide the menu item while keeping the page accessible via direct URL.

```php
add_filter( 'jetpack_show_newsletter_menu_item', '__return_false' );
```

### Reading page notice

When the subscriptions module is active, a notice is added to the wp-admin **Settings → Reading** page next to the "For each post in a feed" option. It clarifies that the RSS excerpt setting does not control newsletter emails and links to the Newsletter settings page.

## URL helper

`Urls::get_newsletter_settings_url()` returns the wp-admin newsletter settings URL.

## Reader link

### `activate_on_connection()`

`Reader_Link::activate_on_connection()` auto-activates the `wpcom-reader` module when a site is first connected to WordPress.com. It skips activation if modules were previously initialized (e.g., the user disconnected and reconnected), respecting prior module choices.

## Daily Writing Prompt widget

`Writing_Prompt_Widget::init()` registers a `Daily Writing Prompt` dashboard widget for users who can `manage_options`. The widget renders a hydration container and enqueues the `writing-prompt` build assets, which mount a React app that fetches the latest blogging prompts from `/wpcom/v3/blogging-prompts` and lets the user jump into answering one.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Newsletter is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
