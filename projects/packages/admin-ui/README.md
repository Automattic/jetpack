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

Menu items may also include optional customization metadata as the final parameter:

```PHP
Admin_Menu::add_menu(
	__( 'Jetpack Forms', 'jetpack-forms' ),
	__( 'Forms', 'jetpack-forms' ),
	'edit_pages',
	'jetpack-forms-admin',
	'__return_null',
	10,
	array(
		'id'          => 'forms',
		'group'       => 'create',
		'group_label' => __( 'Create', 'jetpack-admin-ui' ),
		'order'       => 20,
	)
);
```

The customized menu remains behind filters for rollout:

- `jetpack_admin_menu_customization_enabled` makes the feature available.
- `jetpack_admin_menu_customization_default_enabled` lets new installs or rollout cohorts default to the recommended layout.
- `jetpack_admin_menu_customization_active` can override the saved active state for host-specific rollout logic.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

admin-ui is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
