<?php
/**
 * Primary class file for the Jetpack Launchpad plugin.
 *
 * @package automattic/jetpack-launch-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;

/**
 * Class Jetpack_Launchpad
 */
class Jetpack_Launchpad {

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Set up the REST authentication hooks.
		Connection_Rest_Authentication::init();

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Launchpad', 'jetpack-launchpad' ),
			_x( 'Launchpad', 'The Jetpack Launchpad product name, without the Jetpack prefix', 'jetpack-launchpad' ),
			'manage_options',
			'jetpack-launchpad',
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
						'slug'     => JETPACK_LAUNCHPAD_PLUGIN_SLUG,
						'name'     => JETPACK_LAUNCHPAD_PLUGIN_NAME,
						'url_info' => JETPACK_LAUNCHPAD_PLUGIN_URI,
					)
				);
			},
			1
		);

		// Add "Settings" link to plugins page.
		add_filter(
			'plugin_action_links_' . JETPACK_LAUNCHPAD_PLUGIN_FOLDER . '/jetpack-launchpad.php',
			function ( $actions ) {
				$settings_link = '<a href="' . esc_url( admin_url( 'admin.php?page=jetpack-launchpad' ) ) . '">' . __( 'Settings', 'jetpack-launchpad' ) . '</a>';
				array_unshift( $actions, $settings_link );

				return $actions;
			}
		);
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
			'jetpack-launchpad',
			'build/index.js',
			JETPACK_LAUNCHPAD_PLUGIN_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-launchpad',
			)
		);
		Assets::enqueue_script( 'jetpack-launchpad' );
		// Initial JS state including JP Connection data.
		wp_add_inline_script( 'jetpack-launchpad', $this->get_initial_state(), 'before' );
		wp_add_inline_script( 'jetpack-launchpad', Connection_Initial_State::render(), 'before' );
	}

	/**
	 * Main plugin settings page.
	 */
	public function plugin_settings_page() {
		?>
			<div id="jetpack-launchpad-root"></div>
		<?php
	}

	/**
	 * Return the rendered initial state JavaScript code.
	 *
	 * @return string
	 */
	private function get_initial_state() {
		require_once JETPACK_LAUNCHPAD_PLUGIN_DIR . '/src//php/class-initial-state.php';
		return ( new Initial_State() )->render();
	}

	/**
	 * Redirects to plugin page when the plugin is activated
	 *
	 * @access public
	 * @static
	 *
	 * @param string $plugin Path to the plugin file relative to the plugins directory.
	 */
	public static function plugin_activation( $plugin ) {
		if ( JETPACK_LAUNCHPAD_PLUGIN_ROOT_FILE_RELATIVE_PATH === $plugin ) {
			wp_safe_redirect( esc_url( admin_url( 'admin.php?page=jetpack-launchpad' ) ) );
			exit;
		}
	}

	/**
	 * Removes plugin from the connection manager
	 * If it's the last plugin using the connection, the site will be disconnected.
	 *
	 * @access public
	 * @static
	 */
	public static function plugin_deactivation() {
		$manager = new Connection_Manager( 'jetpack-launchpad' );
		$manager->remove_connection();
	}
}
