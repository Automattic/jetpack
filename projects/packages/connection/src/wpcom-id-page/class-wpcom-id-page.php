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
		// The Connectors UI (as of WP 7.0-beta5) only renders connectors with
		// type 'ai_provider' and method 'api_key'. Using those values here so
		// WordPress.com ID appears on the Settings > Connectors page. Once the
		// UI supports additional types this should use 'cloud_service' / 'none'.
		$registry->register(
			'wordpress_com',
			array(
				'name'           => __( 'WordPress.com ID', 'jetpack-connection' ),
				'description'    => __( 'Connect your site to WordPress.com for enhanced functionality, Jetpack services, and centralized management.', 'jetpack-connection' ),
				'type'           => 'ai_provider',
				'logo_url'       => plugins_url( 'images/wpcom-logo.svg', __FILE__ ),
				'authentication' => array(
					'method'          => 'api_key',
					'credentials_url' => admin_url( 'tools.php?page=wpcom-id' ),
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
			<h1><?php esc_html_e( 'WordPress.com ID', 'jetpack-connection' ); ?></h1>
			<div id="wpcom-id-container"></div>
		</div>
		<?php
	}
}
