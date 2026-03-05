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
	}

	/**
	 * Register the submenu page under WordPress Tools.
	 */
	public static function add_menu() {
		$page_suffix = add_submenu_page(
			'tools.php',
			__( 'WordPress.com ID', 'jetpack-connection' ),
			__( 'WordPress.com ID', 'jetpack-connection' ),
			'manage_options',
			'wpcom-id',
			array( static::class, 'render' )
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( static::class, 'admin_init' ) );
		}
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
