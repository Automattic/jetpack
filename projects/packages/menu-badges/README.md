# Menu Badges

Central registry and renderer for Jetpack admin-menu notification-count badges.

Products report a count against a Jetpack menu item to the `Notification_Counts`
registry; `Menu_Renderer` (wired by `Menu_Badges::init()`) is the sole writer of
those badges into the wp-admin `$menu`/`$submenu` globals, and it also feeds the
top-level total into the WP.com admin-menu REST response. This replaces every
feature poking at `$menu`/`$submenu` on its own.

## Usage

Wire the renderer (idempotent — call it from every consumer that registers a
count), then register your count:

```php
\Automattic\Jetpack\Menu_Badges\Menu_Badges::init();

\Automattic\Jetpack\Menu_Badges\Notification_Counts::register(
	'jetpack-forms', // Unique id for your entry.
	array(
		'menu_slug' => 'jetpack-forms-responses', // Submenu item slug to badge; null for top-level total only.
		'count'     => 3,                          // Magnitude for 'count' entries.
		'type'      => 'count',                    // 'count' (uses `count`) or 'attention' (contributes 1).
	)
);
```

Guard the `register()` call on the same capability as the menu item it badges
(e.g. `current_user_can( 'manage_options' )`), so the top-level total never
includes counts the current user can't act on.

To live-update a badge after a client-side change, without a page reload:

```js
window.jetpackMenuBadges.setCount( 'jetpack-forms-responses', 2 );
```

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

menu-badges is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
