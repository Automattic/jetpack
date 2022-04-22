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
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\Publicize\Publicize_UI;

/**
 * Class Jetpack_Social
 */
class Jetpack_Social {
	const JETPACK_PUBLICIZE_MODULE_SLUG = 'publicize';

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Social', 'jetpack-social' ),
			_x( 'Social', 'The Jetpack Social product name, without the Jetpack prefix', 'jetpack-social' ),
			'manage_options',
			'jetpack-social',
			array( $this, 'plugin_settings_page' ),
			99
		);
		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );

		// Init Jetpack packages and ConnectionUI.
		add_action(
			'plugins_loaded',
			function () {
				$config = new Automattic\Jetpack\Config();
				// Connection package.
				$config->ensure(
					'connection',
					array(
						'slug'     => JETPACK_SOCIAL_PLUGIN_SLUG,
						'name'     => JETPACK_SOCIAL_PLUGIN_NAME,
						'url_info' => JETPACK_SOCIAL_PLUGIN_URI,
					)
				);
				// Sync package.
				$config->ensure( 'sync' );

				// Identity crisis package.
				$config->ensure( 'identity_crisis' );

				// Publicize package.
				$config->ensure( 'publicize' );
			},
			1
		);

		My_Jetpack_Initializer::init();

		new Publicize_UI();

		add_action( 'rest_api_init', array( $this, 'register_rest_route' ) );
		// Priority >10 to run this filter after the Jetpack plugin runs this filter.
		add_filter( 'jetpack_sync_callable_whitelist', array( $this, 'filter_sync_callable_whitelist' ), 11, 1 );
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
	}

	/**
	 * Enqueue plugin admin scripts and styles.
	 */
	public function enqueue_admin_scripts() {

		Assets::register_script(
			'jetpack-social',
			'build/index.js',
			JETPACK_SOCIAL_PLUGIN_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-social',
			)
		);

		Assets::enqueue_script( 'jetpack-social' );
		// Initial JS state including JP Connection data.
		wp_add_inline_script( 'jetpack-social', Connection_Initial_State::render(), 'before' );
		wp_add_inline_script( 'jetpack-social', $this->render_initial_state(), 'before' );
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render_initial_state() {
		return 'var jetpackSocialInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->initial_state() ) ) . '"));';
	}

	/**
	 * Get the initial state data for hydrating the React UI.
	 *
	 * @return array
	 */
	public function initial_state() {
		global $publicize;

		return array(
			'apiRoot'           => esc_url_raw( rest_url() ),
			'apiNonce'          => wp_create_nonce( 'wp_rest' ),
			'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
			'connections'       => $publicize->get_all_connections_for_user(),
		);
	}

	/**
	 * Main plugin settings page.
	 */
	public function plugin_settings_page() {
		?>
			<div id="jetpack-social-root"></div>
		<?php
	}

	/**
	 * Calypso and Jetpack Cloud use this endpoint to check if the connections
	 * screen should be shown. If the Jetpack plugin isn't active, we use this
	 * endpoint to communicate the status of the Publicize module.
	 */
	public function register_rest_route() {
		// The Jetpack plugin provides its own version of this endpoint.
		// See: Jetpack_Core_Json_Api_Endpoints
		if ( class_exists( 'Jetpack' ) ) {
			return;
		}

		register_rest_route(
			'jetpack/v4',
			'/module/all',
			array(
				'methods'  => WP_REST_Server::READABLE,
				'callback' => function () {
					return rest_ensure_response(
						array(
							self::JETPACK_PUBLICIZE_MODULE_SLUG => array(
								'activated' => ( new Modules() )->is_active( self::JETPACK_PUBLICIZE_MODULE_SLUG ),
							),
						)
					);
				},
			)
		);
	}

	/**
	 * Whitelist the `active_modules` option for Jetpack Sync.
	 *
	 * If the Jetpack plugin is active, this filter won't run (because it has
	 * a lower priority and checks for the existence of `active_modules`).
	 *
	 * @param array $callables Array of callables to sync.
	 * @return array
	 */
	public function filter_sync_callable_whitelist( $callables ) {
		$callables['active_modules'] = function () use ( $callables ) {
			$synced_active_modules = array_key_exists( 'active_modules', $callables ) ? $callables['active_modules']() : array();
			$publicize_is_active   = ( new Modules() )->is_active( self::JETPACK_PUBLICIZE_MODULE_SLUG );

			if ( ! $publicize_is_active ) {
				return $synced_active_modules;
			}

			return array_unique( array_merge( $synced_active_modules, array( self::JETPACK_PUBLICIZE_MODULE_SLUG ) ) );
		};

		return $callables;
	}

	/**
	 * Activate the Publicize module on plugin activation.
	 *
	 * @static
	 *
	 * @param string $plugin Path to the plugin file relative to the plugins directory.
	 */
	public static function plugin_activation( $plugin ) {
		if ( JETPACK_SOCIAL_PLUGIN_ROOT_FILE_RELATIVE_PATH === $plugin ) {
			( new Modules() )->activate( self::JETPACK_PUBLICIZE_MODULE_SLUG, false, false );
		}
	}
}
