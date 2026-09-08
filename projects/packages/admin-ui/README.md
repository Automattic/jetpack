# admin-ui

Generic Jetpack wp-admin UI elements
## How to use
### Menu Registration

Use the Admin_Menu class to add your plugin under the Jetpack top level menu in WP-Admin.

This package will make sure to register the top level menu, if not registered yet, and will add the new menu(s) item(s) under it.

Use the `add_menu` to register your menu, no need to do it inside the `admin_menu` hook. You can do it in your plugin initialization.

The parameters this method gets are the same parameters `add_submenu_page` gets, except that you don't need to inform `parent` menu.

Example:

```PHP
use Automattic\Jetpack\Admin_UI\Admin_Menu;

$page_suffix = Admin_Menu::add_menu(
	__( 'My Awesome plugin', 'my-awesome-plugin' ),
	__( 'My Awesome plugin', 'my-awesome-plugin' ),
	'manage_options',
	'my-awesome-plugin',
	'__my_plugin_page_callback'
);
add_action( 'load-' . $page_suffix, 'my_plugin_do_stuff_on_page_load' );

```

### Menu visibility

An item can declare what gates it, so that turning its feature off removes it from the sidebar. Pass the declaration as the seventh argument:

```PHP
Admin_Menu::add_menu(
	'Jetpack Search',
	'Search',
	'manage_options',
	'jetpack-search',
	array( $this, 'render' ),
	null,
	array( 'product' => 'search' )
);
```

| Key | Meaning |
| -- | -- |
| `product` | A My Jetpack product slug. Its `is_active()` decides, which covers both module-gated and plugin-gated products. |
| `module` | A Jetpack module name. For items with no product class behind them. A standalone plugin must also declare the module through `jetpack_get_available_standalone_modules`, or it never reads as active. |
| `key` | The name a host uses for this item in the filter below. Defaults to the menu slug; declare one when the slug is a URL. |

Everything fails open. An item that declares no gate, a gate naming a product that isn't registered, and a site where My Jetpack didn't initialize all leave the item in place, so declaring a gate can only ever remove an item deliberately.

Declaring a gate is a commitment that the page renders something sensible when the gate is unsatisfied, because a host can force it visible anyway — see below.

### Host control

`jetpack_admin_menu_visibility` filters a map of item key to state. Absent keys stay `default`.

| State | Meaning |
| -- | -- |
| `default` | Show the item if its gate is satisfied. What every item does unless a host says otherwise. |
| `visible` | Show the item whatever its gate says. |
| `hidden` | Keep the item out whatever its gate says. |

```PHP
add_filter(
	'jetpack_admin_menu_visibility',
	function ( $items ) {
		// Keep an entry point for a product this platform sells but the site hasn't activated.
		$items['jetpack-search'] = Admin_Menu::VISIBILITY_VISIBLE;
		// Drop a product this platform doesn't offer.
		$items['jetpack-videopress'] = Admin_Menu::VISIBILITY_HIDDEN;

		return $items;
	}
);
```

The whole map is passed at once so two mu-plugins setting different keys merge rather than clobber each other. `visible` cannot expose a page to someone who lacks the capability for it — `add_submenu_page()` refuses those regardless.

Only items registered through `Admin_Menu::add_menu()` are in the map. Anything added with a bare `add_submenu_page()` is out of this filter's reach.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

admin-ui is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

