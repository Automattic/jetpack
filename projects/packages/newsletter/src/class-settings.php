<?php
/**
 * A class that adds a newsletter settings screen to wp-admin.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Modules;
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
	 * Check if the subscriptions module is active.
	 *
	 * @return bool
	 */
	private function is_subscriptions_active() {
		return ( new Modules() )->is_active( 'subscriptions' );
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
		$is_module_active = $this->is_subscriptions_active();
		$host             = new Host();

		// Determine parent slug and menu registration method.
		// - wpcom simple: Always show in Jetpack menu (module always active).
		// - wpcom atomic: Show in Jetpack menu if active, hidden page if inactive.
		// - Jetpack: Show in Jetpack menu if active, hidden page if inactive.
		if ( $host->is_wpcom_platform() ) {
			$parent_slug      = ( $host->is_wpcom_simple() || $is_module_active ) ? 'jetpack' : '';
			$use_jetpack_menu = false; // Use add_submenu_page for all wpcom sites.
		} else {
			$parent_slug      = $is_module_active ? 'jetpack' : '';
			$use_jetpack_menu = $is_module_active;
		}

		// Register menu item.
		if ( $use_jetpack_menu ) {
			$page_suffix = Admin_Menu::add_menu(
				/** "Newsletter" is a product name, do not translate. */
				'Newsletter',
				'Newsletter',
				'manage_options',
				'jetpack-newsletter',
				array( $this, 'render' ),
				10
			);
		} else {
			$page_suffix = add_submenu_page(
				$parent_slug,
				/** "Newsletter" is a product name, do not translate. */
				'Newsletter',
				'Newsletter',
				'manage_options',
				'jetpack-newsletter',
				array( $this, 'render' )
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
			'window.jetpackNewsletterSettings = ' . wp_json_encode( $this->get_settings_data(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
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

		$site_url     = get_site_url();
		$site_raw_url = preg_replace( '(^https?://)', '', $site_url );

		$host                   = new Host();
		$blog_id                = (int) $host->get_wpcom_site_id();
		$is_wpcom               = $host->is_wpcom_platform();
		$is_wpcom_simple        = $host->is_wpcom_simple();
		$base_url               = $is_wpcom ? 'https://wordpress.com/earn/payments/' : 'https://cloud.jetpack.com/monetize/payments/';
		$setup_payment_plan_url = $base_url . $site_raw_url;

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
			'setupPaymentPlansUrl'               => $setup_payment_plan_url,
			'isSitePublic'                       => (int) get_option( 'blog_public' ) === 1,
			'isWpcomPlatform'                    => $is_wpcom,
			'isWpcomSimple'                      => $is_wpcom_simple,
			'isSubscriptionsActive'              => $this->is_subscriptions_active(),
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
