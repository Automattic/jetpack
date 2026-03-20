<?php
/**
 * WordPress.com ID admin page.
 *
 * Registers an admin page under Tools that displays connection and sync data.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Assets;
use Jetpack_Options;

/**
 * WordPress.com ID admin page handler.
 *
 * @since $$next-version$$
 */
class Wpcom_Id_Page {

	/**
	 * Whether the page has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Initialize the admin page.
	 */
	public static function init() {
		if ( static::$initialized ) {
			return;
		}
		static::$initialized = true;

		add_action( 'admin_menu', array( static::class, 'add_menu' ) );
		add_action( 'wp_connectors_init', array( static::class, 'register_connector' ) );
		add_action( 'admin_enqueue_scripts', array( static::class, 'maybe_enqueue_connectors_module' ) );
	}

	/**
	 * Register WordPress.com ID as a connector in the WP core Connectors screen.
	 *
	 * The wp_connectors_init action is available in WordPress 7.0+.
	 * On older versions this action never fires, so the hook is safely a no-op.
	 *
	 * @since $$next-version$$
	 *
	 * @param \WP_Connector_Registry $registry Connector registry instance.
	 */
	public static function register_connector( $registry ) {
		// @phan-suppress-previous-line PhanUndeclaredTypeParameter -- WP 7.0+ class.
		$registry->register( // @phan-suppress-current-line PhanUndeclaredClassMethod -- WP 7.0+ class.
			'wordpress_com',
			array(
				'name'           => __( 'WordPress.com account', 'jetpack-connection' ),
				'description'    => __( 'Connect your site to WordPress.com for enhanced functionality, Jetpack and WooCommerce services, and centralized management.', 'jetpack-connection' ),
				'type'           => 'cloud_service',
				'logo_url'       => plugins_url( 'images/wpcom-logo.svg', __FILE__ ),
				'authentication' => array(
					'method' => 'none',
				),
			)
		);
	}

	/**
	 * Register the submenu page under WordPress Tools.
	 */
	public static function add_menu() {
		$menu_title = __( 'WordPress.com ID', 'jetpack-connection' );

		$error_count = static::get_error_count();
		if ( $error_count > 0 ) {
			$menu_title .= sprintf( ' <span class="awaiting-mod">%d</span>', $error_count );
		}

		$page_suffix = add_submenu_page(
			'tools.php',
			__( 'WordPress.com ID', 'jetpack-connection' ),
			$menu_title,
			'manage_options',
			'wpcom-id',
			array( static::class, 'render' )
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( static::class, 'admin_init' ) );
		}
	}

	/**
	 * Get the count of displayable connection errors.
	 *
	 * @return int Number of connection errors.
	 */
	private static function get_error_count() {
		$errors = Error_Handler::get_instance()->get_displayable_errors();

		if ( ! is_array( $errors ) || empty( $errors ) ) {
			return 0;
		}

		$count = 0;
		foreach ( $errors as $user_errors ) {
			if ( is_array( $user_errors ) ) {
				$count += count( $user_errors );
			}
		}

		return $count;
	}

	/**
	 * Enqueue the connectors card script module on the Settings > Connectors page.
	 *
	 * Uses the WP script module system (WP 6.5+) so the JS file can import
	 * from @wordpress/connectors which is only available as a script module.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $hook_suffix The current admin page hook suffix.
	 */
	public static function maybe_enqueue_connectors_module( $hook_suffix ) {
		/*
		 * The Connectors page hook suffix varies across WP core versions and the
		 * Gutenberg plugin:
		 *  - WP core 7.0:  'options-connectors.php'
		 *  - Gutenberg:    'settings_page_options-connectors-wp-admin'
		 *
		 * Match any admin page whose hook suffix contains "connectors".
		 */
		$is_connectors_page = str_contains( $hook_suffix, 'connectors' );

		if ( ! $is_connectors_page || ! class_exists( 'WP_Connector_Registry' ) ) {
			return;
		}

		$module_url = plugins_url( 'js/connectors-card.js', __FILE__ );

		$manager      = new Manager();
		$is_connected = $manager->is_connected() && $manager->has_connected_owner();

		$module_data = array(
			'isConnected' => $is_connected,
			'manageUrl'   => admin_url( 'tools.php?page=wpcom-id' ),
			'logoUrl'     => plugins_url( 'images/wpcom-logo.svg', __FILE__ ),
			'name'        => __( 'WordPress.com account', 'jetpack-connection' ),
			'description' => __( 'Connect your site to WordPress.com for enhanced functionality, Jetpack and WooCommerce services, and centralized management.', 'jetpack-connection' ),
		);

		/*
		 * Print the script module tag in the admin footer scripts.
		 *
		 * WP 7.0's wp_enqueue_script_module() does not reliably print
		 * externally-registered modules on the Connectors page, so we
		 * output the tag ourselves. The import map already contains
		 * `@wordpress/connectors` from core, which is the only dependency
		 * the module resolves at runtime. For `@wordpress/element` and
		 * `@wordpress/i18n` the module uses the classic-script globals
		 * (wp.element / wp.i18n) that are always present on admin pages.
		 *
		 * Priority 100 ensures this runs AFTER the WP script module
		 * system prints the import map (priority 50). Module scripts
		 * must appear after the import map in the HTML.
		 */
		add_action(
			'admin_print_footer_scripts',
			static function () use ( $module_url, $module_data ) {
				printf(
					'<script id="wpcom-connector-data" type="application/json">%s</script>',
					wp_json_encode( $module_data, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP )
				);
				printf(
					'<script type="module" src="%s"></script>', // phpcs:ignore WordPress.WP.EnqueuedResources.NonEnqueuedScript -- script modules need type="module"; wp_enqueue_script_module does not print on this page.
					esc_url( add_query_arg( 'ver', filemtime( __DIR__ . '/js/connectors-card.js' ), $module_url ) )
				);
			},
			100
		);
	}

	/**
	 * Page load callback. Enqueues scripts only on this admin page.
	 */
	public static function admin_init() {
		add_action( 'admin_enqueue_scripts', array( static::class, 'enqueue_scripts' ) );
	}

	/**
	 * Enqueue the page scripts and pass initial state.
	 */
	public static function enqueue_scripts() {
		Assets::register_script(
			'wpcom_id_page',
			'../../dist/wpcom-id.js',
			__FILE__,
			array(
				'enqueue'    => true,
				'in_footer'  => true,
				'textdomain' => 'jetpack-connection',
			)
		);

		wp_localize_script(
			'wpcom_id_page',
			'wpcomIdInitialState',
			static::get_initial_state()
		);

		Initial_State::render_script( 'wpcom_id_page' );
	}

	/**
	 * Build the initial state data for the page.
	 *
	 * @return array
	 */
	private static function get_initial_state() {
		$blog_id = Jetpack_Options::get_option( 'id' );

		return array(
			'apiRoot'           => esc_url_raw( rest_url() ),
			'apiNonce'          => wp_create_nonce( 'wp_rest' ),
			'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			'blogId'            => $blog_id ? (int) $blog_id : null,
			'siteUrl'           => Urls::site_url(),
			'homeUrl'           => Urls::home_url(),
		);
	}

	/**
	 * Render the admin page markup.
	 */
	public static function render() {
		?>
		<div class="wrap">
			<div id="wpcom-id-container"></div>
		</div>
		<?php
	}
}
