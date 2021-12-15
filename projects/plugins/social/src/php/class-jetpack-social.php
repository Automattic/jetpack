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
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;

/**
 * Class Jetpack_Social
 */
class Jetpack_Social {
	/**
	 * Constructor.
	 */
	public function __construct() {
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
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_block_editor_scripts' ) );

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
			},
			1
		);

		// Add "Settings" link to plugins page.
		add_filter(
			'plugin_action_links_' . JETPACK_SOCIAL_PLUGIN_FOLDER . '/jetpack-social.php',
			function ( $actions ) {
				$settings_link = '<a href="' . esc_url( admin_url( 'admin.php?page=jetpack-social' ) ) . '">' . __( 'Settings', 'jetpack-social' ) . '</a>';
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
		wp_add_inline_script( 'jetpack-social', $this->get_initial_state(), 'before' );
		wp_add_inline_script( 'jetpack-social', Connection_Initial_State::render(), 'before' );
	}

	/**
	 * Enqueue plugin block editor scripts and styles.
	 */
	public function enqueue_block_editor_scripts() {
		Assets::register_script(
			'jetpack-social-editor',
			'build/editor.js',
			JETPACK_SOCIAL_PLUGIN_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-social',
			)
		);
		Assets::enqueue_script( 'jetpack-social-editor' );
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
	 * Return the rendered initial state JavaScript code.
	 *
	 * @return string
	 */
	private function get_initial_state() {
		require_once JETPACK_SOCIAL_PLUGIN_DIR . '/src//php/class-initial-state.php';
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
		if ( JETPACK_BACKUP_PLUGIN_ROOT_FILE_RELATIVE_PATH === $plugin ) {
			wp_safe_redirect( esc_url( admin_url( 'admin.php?page=jetpack-backup' ) ) );
			exit;
		}
	}

	/**
	 * Removes plugin from the Connection Manager
	 * If it's the last plugin using the connection, the site will be disconnected.
	 *
	 * @access public
	 * @static
	 */
	public static function plugin_deactivation() {
		$manager = new Connection_Manager( 'jetpack-social' );
		$manager->remove_connection();
	}
}
