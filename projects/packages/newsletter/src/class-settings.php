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

	const PACKAGE_VERSION = '0.1.3';
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

		wp_add_inline_script(
			'jetpack-newsletter',
			'window.jetpackNewsletterSettings = ' . wp_json_encode( $this->get_settings_data() ) . ';',
			'before'
		);
	}

	/**
	 * Get the data to be passed to the newsletter settings page.
	 *
	 * @return array
	 */
	private function get_settings_data() {
		$current_user = wp_get_current_user();
		$theme        = wp_get_theme();

		// Get blog ID if available (for WordPress.com sites).
		$blog_id = defined( 'Jetpack_Options' ) && class_exists( 'Jetpack_Options' )
			? \Jetpack_Options::get_option( 'id', 0 )
			: 0;

		// Get site URL without protocol.
		$site_url     = get_site_url();
		$site_raw_url = preg_replace( '(^https?://)', '', $site_url );

		return array(
			'isBlockTheme'                       => wp_is_block_theme(),
			'siteAdminUrl'                       => admin_url(),
			'themeStylesheet'                    => $theme->get_stylesheet(),
			'blogID'                             => $blog_id,
			'siteRawUrl'                         => $site_raw_url,
			'email'                              => $current_user->user_email,
			'gravatar'                           => get_avatar_url( $current_user->ID ),
			'displayName'                        => $current_user->display_name,
			'dateExample'                        => gmdate( get_option( 'date_format' ), time() ),
			'wpAdminSubscriberManagementEnabled' => apply_filters( 'jetpack_wpcom_subscriber_management_enabled', false ),
			'isSubscriptionSiteEditSupported'    => wp_is_block_theme(),
			'setupPaymentPlansUrl'               => $this->get_jetpack_cloud_url( 'monetize/payments' ),
			'isSitePublic'                       => (int) get_option( 'blog_public' ) === 1,
		);
	}

	/**
	 * Get a Jetpack Cloud URL.
	 *
	 * @param string $path The path to append to the Jetpack Cloud URL.
	 * @return string
	 */
	private function get_jetpack_cloud_url( $path = '' ) {
		$site_suffix = '';
		if ( defined( 'Jetpack_Options' ) && class_exists( 'Jetpack_Options' ) ) {
			$blog_id = \Jetpack_Options::get_option( 'id', 0 );
			if ( $blog_id ) {
				$site_suffix = $blog_id;
			}
		}

		if ( ! $site_suffix ) {
			$site_url    = get_site_url();
			$site_suffix = preg_replace( '(^https?://)', '', $site_url );
		}

		return 'https://cloud.jetpack.com/' . ltrim( $path, '/' ) . '/' . $site_suffix;
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
