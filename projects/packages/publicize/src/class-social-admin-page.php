<?php
/**
 * Social Admin Page class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Publicize\Publicize_Utils as Utils;

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
	}

	/**
	 * Add the admin menu.
	 */
	public function add_menu() {

		if ( ! Publicize_Script_Data::has_feature_flag( 'admin-page' ) ) {
			return;
		}

		// Remove the old Social menu item, if it exists.
		Admin_Menu::remove_menu( 'jetpack-social' );

		// If this isn't an admin (or someone with the capability to change the module status )
		// and Publicize is inactive, then don't render the admin page.
		if ( ! current_user_can( 'manage_options' ) && ! Utils::is_publicize_active() ) {
			return;
		}

		$page_suffix = Admin_Menu::add_menu(
			__( 'Jetpack Social', 'jetpack-publicize-pkg' ),
			_x( 'Social', 'The Jetpack Social product name, without the Jetpack prefix', 'jetpack-publicize-pkg' ),
			'publish_posts',
			'jetpack-social',
			array( $this, 'render' ),
			4
		);

		add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		/**
		 * Use priority 20 to ensure that we can dequeue the old Social assets.
		 */
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_scripts' ), 20 );

		// Initialize the media library for the social image generator.
		wp_enqueue_media();
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
