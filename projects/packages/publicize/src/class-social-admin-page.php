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
		add_action( 'admin_menu', array( $this, 'add_menu' ) );

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
				/**
				 * `add_submenu_page` allows multiple submenus with the same slug,
				 * but `remove_submenu_page` only removes the first one it finds with the given slug.
				 *
				 * We add the menu using `admin_menu` hook unlike the old Social plugin,
				 * which used the `init` hook, which runs before `admin_menu`.
				 * So, the old Social plugin's menu is before the new one in $submenu global.
				 *
				 * So, `remove_submenu_page` should remove the menu added by the old Social plugin.
				 *
				 * @see https://developer.wordpress.org/reference/functions/add_submenu_page
				 * @see https://developer.wordpress.org/reference/functions/remove_submenu_page
				 */
				remove_submenu_page( 'jetpack', 'jetpack-social' );
			}
		}
	}

	/**
	 * Add the admin menu.
	 */
	public function add_menu() {

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

			/**
			 * Use priority 20 to ensure that we can dequeue the old Social assets.
			 */
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ), 20 );
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

		// Dequeue the old Social assets.
		wp_dequeue_script( 'jetpack-social' );
		wp_dequeue_style( 'jetpack-social' );

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
