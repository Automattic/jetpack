<?php
/**
 * Primary class file for the Jetpack Classic Theme Helper Plugin plugin.
 *
 * @package automattic/classic-theme-helper-plugin-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Assets;

/**
 * Class Classic_Theme_Helper_Plugin
 */
class Classic_Theme_Helper_Plugin {

	/**
	 * Constructor.
	 */
	public function __construct() {
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
			'classic-theme-helper-plugin',
			'build/index.js',
			CLASSIC_THEME_HELPER_PLUGIN_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'classic-theme-helper-plugin',
			)
		);
		Assets::enqueue_script( 'classic-theme-helper-plugin' );
	}

	/**
	 * Render the initial state into a JavaScript variable.
	 *
	 * @return string
	 */
	public function render_initial_state() {
		return 'var jetpackClassicThemeHelperPluginInitialState=JSON.parse(decodeURIComponent("' . rawurlencode( wp_json_encode( $this->initial_state() ) ) . '"));';
	}

	/**
	 * Get the initial state data for hydrating the React UI.
	 *
	 * @return array
	 */
	public function initial_state() {
		return array(
			'apiRoot'           => esc_url_raw( rest_url() ),
			'apiNonce'          => wp_create_nonce( 'wp_rest' ),
			'registrationNonce' => wp_create_nonce( 'jetpack-registration-nonce' ),
		);
	}

	/**
	 * Main plugin settings page.
	 */
	public function plugin_settings_page() {
		?>
			<div id="classic-theme-helper-plugin-root"></div>
		<?php
	}
}
