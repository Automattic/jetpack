<?php
/**
 * A class that adds a subscribers dashboard to wp-admin.
 *
 * @package automattic/jetpack-subscribers
 */

namespace Automattic\Jetpack\Subscribers_Dashboard;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;

/**
 * Responsible for adding a subscribers dashboard to wp-admin.
 *
 * @package jetpack-subscribers
 */
class Dashboard {
	const VERSION = '0.5.4';

	/**
	 * Slug used by wp-build's auto-generated page-wp-admin.php.
	 *
	 * Must match `wpPlugin.pages[0]` in package.json plus the `-wp-admin` suffix
	 * the build template appends.
	 *
	 * @var string
	 */
	const ADMIN_SLUG = 'jetpack-subscribers-wp-admin';

	/**
	 * Whether the class has been initialized
	 *
	 * @var boolean
	 */
	private static $initialized = false;

	/**
	 * Whether the menu was added.
	 *
	 * @var boolean
	 */
	private static $menu_added = false;

	/**
	 * Priority for the dashboard menu
	 *
	 * @var int
	 */
	protected $menu_priority = 999;

	/**
	 * Init Subscribers dashboard.
	 */
	public static function init() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			( new self() )->init_hooks();
		}
	}

	/**
	 * Initialize the hooks.
	 */
	public function init_hooks() {
		self::load_wp_build();
		self::fix_boot_import_map_ordering();

		add_action( 'admin_menu', array( $this, 'add_wp_admin_submenu' ), $this->menu_priority );
	}

	/**
	 * Load wp-build generated registration files. Mirrors Forms' approach.
	 */
	public static function load_wp_build() {
		// Polyfill `@wordpress/boot`, `@wordpress/route`, `@wordpress/a11y` modules
		// + `wp-theme`, `wp-views`, `wp-private-apis`, `wp-notices` classic-script
		// handles for sites running WP without the script-modules these depend on.
		WP_Build_Polyfills::register(
			'jetpack-subscribers-dashboard',
			array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
		);

		$wp_build_index = dirname( __DIR__ ) . '/build/build.php';
		if ( file_exists( $wp_build_index ) ) {
			require_once $wp_build_index;
		}
	}

	/**
	 * Fix import map ordering for the wp-build boot script.
	 *
	 * In wp-admin, _wp_footer_scripts (classic scripts) and print_import_map
	 * both hook into admin_print_footer_scripts at priority 10, but
	 * _wp_footer_scripts is registered first. This causes the inline
	 * import("@wordpress/boot") to execute before the import map exists.
	 *
	 * This fix moves the import() call from the classic inline script to a
	 * <script type="module"> printed at priority 20 (after the import map).
	 *
	 * @todo Remove once @wordpress/build ships with the loader.js fix upstream
	 *       (WordPress/gutenberg#76870) and Jetpack updates the dependency.
	 */
	public static function fix_boot_import_map_ordering() {
		$handle = self::ADMIN_SLUG . '-prerequisites';

		add_action(
			'admin_enqueue_scripts',
			static function () use ( $handle ) {
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended
				if ( ! isset( $_GET['page'] ) || self::ADMIN_SLUG !== $_GET['page'] ) {
					return;
				}

				$data = wp_scripts()->get_data( $handle, 'after' );
				if ( empty( $data ) ) {
					return;
				}

				$boot_script = null;
				$remaining   = array();
				foreach ( $data as $line ) {
					if ( strpos( $line, '@wordpress/boot' ) !== false ) {
						$boot_script = $line;
					} else {
						$remaining[] = $line;
					}
				}

				if ( null === $boot_script ) {
					return;
				}

				wp_scripts()->add_data( $handle, 'after', $remaining );

				add_action(
					'admin_print_footer_scripts',
					static function () use ( $boot_script ) {
						wp_print_inline_script_tag( $boot_script, array( 'type' => 'module' ) );
					},
					20
				);
			},
			PHP_INT_MAX
		);
	}

	/**
	 * The page to be added to submenu.
	 */
	public function add_wp_admin_submenu() {
		if ( ! apply_filters( 'jetpack_wp_admin_subscriber_management_enabled', false ) || self::$menu_added ) {
			return;
		}

		$render_fn = 'jetpack_subscribers_dashboard_jetpack_subscribers_wp_admin_render_page';
		$callback  = function_exists( $render_fn ) ? $render_fn : array( $this, 'render' );

		$page_suffix = null;
		if ( ( new Host() )->is_wpcom_platform() ) {
			$page_suffix = add_submenu_page(
				'users.php',
				__( 'Subscribers', 'jetpack-subscribers-dashboard' ),
				__( 'Subscribers', 'jetpack-subscribers-dashboard' ),
				'manage_options',
				self::ADMIN_SLUG,
				$callback
			);
		} else {
			$page_suffix = Admin_Menu::add_menu(
				__( 'Subscribers', 'jetpack-subscribers-dashboard' ),
				_x( 'Subscribers', 'product name shown in menu', 'jetpack-subscribers-dashboard' ),
				'manage_options',
				self::ADMIN_SLUG,
				$callback
			);
		}

		if ( $page_suffix ) {
			self::$menu_added = true;
		}
	}

	/**
	 * Fallback render when wp-build's generated function is not available.
	 *
	 * In normal use the menu callback is the auto-generated render function
	 * from `build/pages/jetpack-subscribers-dashboard/page-wp-admin.php`.
	 */
	public function render() {
		echo '<div id="jetpack-subscribers-wp-admin-app" class="boot-layout-container"></div>';
	}
}
