<?php
/**
 * A class that adds a newsletter settings screen to wp-admin.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Paths;
use Automattic\Jetpack\Status\Host;

/**
 * A class responsible for adding a newsletter settings screen to wp-admin.
 */
class Settings {

	const PACKAGE_VERSION = '0.1.0';
	/**
	 * Whether the class has been initialized
	 *
	 * @var boolean
	 */
	private static $initialized = false;

	/**
	 * Init Newsletter Settings if it wasn't already.
	 */
	public static function init() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			( new self() )->init_hooks();
		}
	}

	/**
	 * Determine whether to expose the new settings UI to users.
	 *
	 * @return bool
	 */
	private function expose_to_users() {
		/**
		 * Enables the new in-development newsletter settings UI in wp-admin.
		 *
		 * @since 15.3.0
		 *
		 * @param bool $enabled Whether to enable the new newsletter settings UI. Default false.
		 */
		return apply_filters( 'jetpack_wp_admin_newsletter_settings_enabled', false );
	}

	/**
	 * Subscribe to necessary hooks.
	 */
	public function init_hooks() {
		if ( ! $this->expose_to_users() ) {
			return;
		}
		// Add admin menu item.
		add_action( 'admin_menu', array( $this, 'add_wp_admin_menu' ), 1000 );

		// Hijack the config URLs to point to our settings page.
		// Customize the configuration URL to lead to the Subscriptions settings.
		add_filter(
			'jetpack_module_configuration_url_subscriptions',
			function () {
				return ( new Paths() )->admin_url( array( 'page' => 'jetpack-newsletter' ) );
			}
		);
	}

	/**
	 * Add the newsletter settings menu to the Jetpack menu.
	 */
	public function add_wp_admin_menu() {
		if ( ( new Host() )->is_wpcom_platform() ) {
			$page_suffix = add_submenu_page(
				'jetpack',
				/** "Newsletter" is a product name, do not translate. */
				'Newsletter',
				'Newsletter',
				'manage_options',
				'jetpack-newsletter',
				array( $this, 'render' )
			);
		} else {
			$page_suffix = Admin_Menu::add_menu(
				/** "Newsletter" is a product name, do not translate. */
				'Newsletter',
				'Newsletter',
				'manage_options',
				'jetpack-newsletter',
				array( $this, 'render' ),
				10
			);
		}

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
		}
	}

	/**
	 * Admin init actions.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Load the admin scripts.
	 */
	public function load_admin_scripts() {
		Assets::register_script(
			'jetpack-newsletter',
			'../build/newsletter.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-newsletter',
				'enqueue'    => true,
			)
		);
	}

	/**
	 * Render the newsletter settings page.
	 */
	public function render() {
		?>
		<div id="newsletter-settings-root"></div>
		<?php
	}
}
