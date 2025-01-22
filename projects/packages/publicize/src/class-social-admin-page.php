<?php
/**
 * Social Admin Page class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;

/**
 * The class to handle the Social Admin Page.
 */
class Social_Admin_Page {

	/**
	 * The instance of the class.
	 *
	 * @var Social_Admin_Page
	 */
	private static $instance;

	/**
	 * Initialize the class.
	 *
	 * @return Social_Admin_Page
	 */
	public static function init() {
		if ( ! isset( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * The constructor.
	 */
	private function __construct() {
		/**
		 * We want to hook into init after the old Social plugin,
		 * to ensure that the new sub menu item is added after the old one.
		 *
		 * Thus, we use a priority of 20 instead of the default 10.
		 *
		 * The reason being that `add_submenu_page` allows multiple submenus with the same slug,
		 * but `remove_submenu_page` only removes the first one it finds with the given slug.
		 *
		 * @see https://developer.wordpress.org/reference/functions/add_submenu_page
		 * @see https://developer.wordpress.org/reference/functions/remove_submenu_page
		 */
		add_action( 'init', array( $this, 'do_init' ), 20 );

		/**
		 * Admin_Menu::add_menu uses 1000, so we use 2000
		 * to ensure we remove the old Social menu item after it has been added.
		 */
		add_action( 'admin_menu', array( $this, 'remove_old_social_menu_item' ), 2000 );
	}

	/**
	 * Remove the page added by old versions of Social.
	 */
	public function remove_old_social_menu_item() {

		if ( defined( 'JETPACK_SOCIAL_PLUGIN_ROOT_FILE' ) ) {

			$plugin_data = get_plugin_data( (string) constant( 'JETPACK_SOCIAL_PLUGIN_ROOT_FILE' ), false, false );

			$plugin_version = $plugin_data['Version'];

			// If it's the old social version, remove the submenu page.
			// TODO Update the version and operator before next Social release.
			if ( version_compare( $plugin_version, '6.0.0', '<' ) ) {
				remove_submenu_page( 'jetpack', 'jetpack-social' );
			}
		}
	}

	/**
	 * Initialize.
	 */
	public function do_init() {

		// If Social plugin is active.
		if ( defined( 'JETPACK_SOCIAL_PLUGIN_DIR' ) ) {
			Admin_Menu::add_menu(
				__( 'Jetpack Social', 'jetpack-publicize-pkg' ),
				_x( 'Social', 'The Jetpack Social product name, without the Jetpack prefix', 'jetpack-publicize-pkg' ),
				'manage_options',
				'jetpack-social',
				array( $this, 'render' ),
				4
			);

			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ) );
		}
	}

	/**
	 * Render the admin page.
	 */
	public function render() {
		?>
			<div id="jetpack-social-root"></div>
		<?php
	}

	/**
	 * Enqueue admin scripts and styles.
	 */
	public function enqueue_admin_scripts() {
		$screen = get_current_screen();
		if ( empty( $screen ) || 'jetpack_page_jetpack-social' !== $screen->base ) {
			return;
		}

		Assets::register_script(
			'social-admin-page',
			'../build/social-admin-page.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-publicize-pkg',
				'enqueue'    => true,
			)
		);
	}
}
