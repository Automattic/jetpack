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
		 * The Connectors page slug varies between WP core and the Gutenberg plugin:
		 *  - WP core:   'connectors-wp-admin'          → hook 'settings_page_connectors-wp-admin'
		 *  - Gutenberg: 'options-connectors-wp-admin'   → hook 'settings_page_options-connectors-wp-admin'
		 */
		$is_connectors_page = str_contains( $hook_suffix, 'connectors' )
			&& str_starts_with( $hook_suffix, 'settings_page_' );

		if ( ! $is_connectors_page
			|| ! function_exists( 'wp_register_script_module' )
			|| ! class_exists( 'WP_Connector_Registry' ) ) {
			return;
		}

		$module_id = '@automattic/jetpack-connection-connectors';

		wp_register_script_module(
			$module_id,
			plugins_url( 'js/connectors-card.js', __FILE__ ),
			array(
				array(
					'id'     => '@wordpress/connectors',
					'import' => 'dynamic',
				),
				array(
					'id'     => '@wordpress/element',
					'import' => 'dynamic',
				),
				array(
					'id'     => '@wordpress/i18n',
					'import' => 'dynamic',
				),
			),
			filemtime( __DIR__ . '/js/connectors-card.js' )
		);

		wp_enqueue_script_module( $module_id );

		$manager      = new Manager();
		$is_connected = $manager->is_connected() && $manager->has_connected_owner();

		add_filter(
			'script_module_data_' . $module_id,
			static function () use ( $is_connected ) {
				return array(
					'isConnected' => $is_connected,
					'manageUrl'   => admin_url( 'tools.php?page=wpcom-id' ),
					'logoUrl'     => plugins_url( 'images/wpcom-logo.svg', __FILE__ ),
					'name'        => __( 'WordPress.com account', 'jetpack-connection' ),
					'description' => __( 'Connect your site to WordPress.com for enhanced functionality, Jetpack and WooCommerce services, and centralized management.', 'jetpack-connection' ),
				);
			}
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
