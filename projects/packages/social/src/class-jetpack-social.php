<?php
/**
 * Primary class file for the Jetpack Social plugin.
 *
 * @package automattic/jetpack-social-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;

/**
 * Class Jetpack_Social
 */
class Jetpack_Social {

	const JETPACK_SOCIAL_SLUG = 'jetpack-social';

	const JETPACK_SOCIAL_NAME = 'Jetpack Social';

	const JETPACK_SOCIAL_URI = 'https://jetpack.com/jetpack-social';

	/**
	 * Constructor.
	 */
	public static function initialize() {
		if ( did_action( 'jetpack-social-init' ) ) {
			return;
		}

		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Social', 'jetpack-social' ),
			_x( 'Social', 'The Jetpack Social product name, without the Jetpack prefix', 'jetpack-social' ),
			'manage_options',
			'jetpack-social',
			array( __CLASS__, 'plugin_settings_page' ),
			99
		);
		add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );

		// Init Jetpack packages and ConnectionUI.
		add_action(
			'plugins_loaded',
			function () {
				$config = new Automattic\Jetpack\Config();
				// Connection package.
				$config->ensure(
					'connection',
					array(
						'slug'     => self::JETPACK_SOCIAL_SLUG,
						'name'     => self::JETPACK_SOCIAL_NAME,
						'url_info' => self::JETPACK_SOCIAL_URI,
					)
				);
				// Sync package.
				$config->ensure( 'sync' );

				// Identity crisis package.
				$config->ensure( 'identity_crisis' );
			},
			1
		);

		/**
		 * Fires right after the Jetpack Social package is initialized.
		 */
		do_action( 'jetpack-social-init' );

		My_Jetpack_Initializer::init();
	}

	/**
	 * Initialize the admin resources.
	 */
	public static function admin_init() {
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Enqueue plugin admin scripts and styles.
	 */
	public static function enqueue_admin_scripts() {

		Assets::register_script(
			'jetpack-social',
			'../build/index.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'package-name',
			)
		);
		Assets::enqueue_script( 'jetpack-social' );
		// Initial JS state including JP Connection data.
		wp_add_inline_script( 'jetpack-social', Connection_Initial_State::render(), 'before' );
		wp_add_inline_script( 'jetpack-social', self::render_initial_state(), 'before' );

	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public static function render_initial_state() {
		return 'var jetpackSocialInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( self::initial_state() ) ) . '"));';
	}

	/**
	 * Get the initial state data for hydrating the React UI.
	 *
	 * @return array
	 */
	public static function initial_state() {
		return array(
			'apiRoot'           => esc_url_raw( rest_url() ),
			'apiNonce'          => wp_create_nonce( 'wp_rest' ),
			'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
		);
	}

	/**
	 * Main plugin settings page.
	 */
	public static function plugin_settings_page() {
		?>
			<div id="jetpack-social-root"></div>
		<?php
	}
}
