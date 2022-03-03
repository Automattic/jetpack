<?php
/**
 * Primary class file for the Jetpack Reach plugin.
 *
 * @package automattic/jetpack-reach-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;

/**
 * Class Jetpack_Reach
 */
class Jetpack_Reach {

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Set up the REST authentication hooks.

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Reach', 'jetpack-reach' ),
			_x( 'Reach', 'The Jetpack Reach product name, without the Jetpack prefix', 'jetpack-reach' ),
			'manage_options',
			'jetpack-reach',
			array( $this, 'plugin_settings_page' ),
			99
		);
		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );

		My_Jetpack_Initializer::init();
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
			'jetpack-reach',
			'build/index.js',
			JETPACK_REACH_PLUGIN_ROOT_FILE,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-reach',
			)
		);
		Assets::enqueue_script( 'jetpack-reach' );
	}

	/**
	 * Main plugin settings page.
	 */
	public function plugin_settings_page() {
		?>
			<div id="jetpack-reach-root"></div>
		<?php
	}
}
