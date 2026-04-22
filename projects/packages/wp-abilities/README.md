# Jetpack WP Abilities

Shared utilities for registering a category and its abilities with the [WordPress Abilities API](https://make.wordpress.org/core/) from Jetpack packages and plugins.

The `Registrar` base class owns the boilerplate every consumer would otherwise hand-roll: hooking into `wp_abilities_api_categories_init` / `wp_abilities_api_init` (or dispatching immediately when those actions have already fired), and guarding the Abilities API function calls so the class is safe on WordPress versions older than 6.9.

## Usage

Extend `Registrar`, override the three static getters, and call `init()` from the consumer's bootstrap.

```php
use Automattic\Jetpack\WP_Abilities\Registrar;

class My_Plugin_Abilities extends Registrar {

	public static function get_category_slug(): string {
		return 'my-plugin';
	}

	public static function get_category_definition(): array {
		return array(
			'label'       => 'My Plugin',
			'description' => __( 'Abilities for My Plugin.', 'my-plugin' ),
		);
	}

	public static function get_abilities(): array {
		return array(
			'my-plugin/get-things' => array(
				'label'               => __( 'List things', 'my-plugin' ),
				'description'         => __( 'Return the list of things the user can access.', 'my-plugin' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(),
					'additionalProperties' => false,
				),
				'execute_callback'    => array( __CLASS__, 'get_things' ),
				'permission_callback' => array( __CLASS__, 'can_read_things' ),
				'meta'                => array(
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
					'show_in_rest' => true,
				),
			),
		);
	}

	public static function can_read_things(): bool {
		return current_user_can( 'read' );
	}

	public static function get_things( $input = null ) {
		return array( 'things' => array() );
	}
}

My_Plugin_Abilities::init();
```

If an ability spec omits `category`, the registrar auto-injects `get_category_slug()`. If the spec sets `category` explicitly (for cross-registrar shared abilities), the explicit value is preserved.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we recommend using [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader for maximum interoperability with other plugins that use this package.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack WP Abilities is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt).
