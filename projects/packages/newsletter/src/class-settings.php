<?php
/**
 * A class that adds a newsletter settings screen to wp-admin.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Paths;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Tracks_Client;

/**
 * A class responsible for adding a newsletter settings screen to wp-admin.
 */
class Settings {

	const PACKAGE_VERSION = '0.5.2';
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
		// Add the Reading settings notice regardless of the new UI feature flag,
		// as long as subscriptions are active.
		if ( $this->is_subscriptions_active() ) {
			add_action( 'admin_init', array( $this, 'add_reading_page_notice' ) );
		}

		if ( ! $this->expose_to_users() ) {
			return;
		}

		$host = new Host();

		// On wpcom Simple, the Jetpack menu is created at priority 999999 by wpcom-admin-menu.php,
		// which will call add_wp_admin_submenu() directly. Skip adding the menu here to avoid
		// trying to add a submenu before the parent menu exists.
		if ( $host->is_wpcom_simple() ) {
			return;
		}

		// Add admin menu item.
		// Use priority 999 to ensure menu items are queued BEFORE Admin_Menu::admin_menu_hook_callback
		// runs at priority 1000 to process all queued items.
		add_action( 'admin_menu', array( $this, 'add_wp_admin_menu' ), 999 );

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
	 * Add the newsletter settings submenu to the Jetpack menu.
	 *
	 * Note: This method is NOT called on wpcom Simple sites. Simple sites use
	 * add_wp_admin_submenu() called from wpcom-admin-menu.php instead.
	 *
	 * Menu visibility rules:
	 * - wpcom Atomic: Show under 'jetpack' if module active, hidden if inactive.
	 * - Standalone Jetpack: Show under 'jetpack' if module active, hidden if inactive.
	 */
	public function add_wp_admin_menu() {
		if ( ! $this->expose_to_users() ) {
			return;
		}

		$host             = new Host();
		$is_module_active = $this->is_subscriptions_active();

		// Show in Jetpack menu if module active, hidden page if inactive.
		$parent_slug = $is_module_active ? 'jetpack' : '';

		// On Atomic, use add_submenu_page. On standalone Jetpack, use Admin_Menu when active.
		$use_jetpack_menu = ! $host->is_woa_site() && $is_module_active;

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
	 * Add the newsletter settings submenu directly under the Jetpack menu.
	 *
	 * This method is called from wpcom-admin-menu.php on Simple sites at late priority
	 * (999999) when the Jetpack menu already exists.
	 *
	 * Similar to Subscribers_Dashboard::add_wp_admin_submenu().
	 */
	public function add_wp_admin_submenu() {
		if ( ! $this->expose_to_users() ) {
			return;
		}

		$page_suffix = add_submenu_page(
			'jetpack',
			/** "Newsletter" is a product name, do not translate. */
			'Newsletter',
			'Newsletter',
			'manage_options',
			'jetpack-newsletter',
			array( $this, 'render' )
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
		}
	}

	/**
	 * Admin init actions.
	 */
	public function admin_init() {
		add_filter( 'jetpack_admin_js_script_data', array( $this, 'add_script_data' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Add newsletter-specific data to the global JetpackScriptData object.
	 *
	 * @param array $data The existing script data.
	 * @return array The modified script data.
	 */
	public function add_script_data( $data ) {
		$current_user = wp_get_current_user();
		$theme        = wp_get_theme();

		$site_url     = get_site_url();
		$site_raw_url = preg_replace( '(^https?://)', '', $site_url );

		$host                   = new Host();
		$status                 = new Status();
		$blog_id                = (int) $host->get_wpcom_site_id();
		$is_wpcom_simple        = $host->is_wpcom_simple();
		$is_block_theme         = wp_is_block_theme();
		$setup_payment_plan_url = ( $is_wpcom_simple ? 'https://wordpress.com/earn/payments/' : 'https://cloud.jetpack.com/monetize/payments/' ) . rawurlencode( $site_raw_url );

		$wp_admin_subscriber_management_enabled = apply_filters( 'jetpack_wp_admin_subscriber_management_enabled', false );

		// Populate blog_id which is needed for API calls on Simple sites.
		$data['site']['wpcom']['blog_id'] = $blog_id;

		// Add newsletter-specific data.
		// Note: Common data like admin_url, rest_nonce, rest_root, title, is_wpcom_platform,
		// and user.current_user.display_name are already provided by Script_Data.
		$data['newsletter'] = array(
			'isBlockTheme'                    => $is_block_theme,
			'themeStylesheet'                 => $theme->get_stylesheet(),
			'email'                           => $current_user->user_email,
			'gravatar'                        => get_avatar_url( $current_user->ID ),
			'dateExample'                     => gmdate( get_option( 'date_format' ), time() ),
			'subscriberManagementUrl'         => $this->get_subscriber_management_url( $wp_admin_subscriber_management_enabled, $is_wpcom_simple, $site_raw_url, $blog_id ),
			'isSubscriptionSiteEditSupported' => $is_block_theme,
			'setupPaymentPlansUrl'            => $setup_payment_plan_url,
			'isSitePublic'                    => ! $status->is_private_site() && ! $status->is_coming_soon(),
			'tracksUserData'                  => Jetpack_Tracks_Client::get_connected_user_tracks_identity(),
		);

		return $data;
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
				'in_footer'    => true,
				'textdomain'   => 'jetpack-newsletter',
				'enqueue'      => true,
				'dependencies' => array( 'jetpack-script-data' ),
			)
		);

		// Enqueue the Tracks script for analytics.
		wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
	}

	/**
	 * Get the subscriber management URL based on site type and filter settings.
	 *
	 * - If jetpack_wp_admin_subscriber_management_enabled filter is true: wp-admin subscribers page
	 * - If filter is false AND wpcom simple site: wordpress.com/subscribers/$domain
	 * - If filter is false AND Jetpack site: jetpack.com redirect URL
	 *
	 * @param bool   $wp_admin_enabled Whether wp-admin subscriber management is enabled.
	 * @param bool   $is_wpcom_simple  Whether this is a wpcom simple site.
	 * @param string $site_raw_url     The site URL without protocol.
	 * @param int    $blog_id          The blog ID.
	 * @return string The subscriber management URL.
	 */
	private function get_subscriber_management_url( $wp_admin_enabled, $is_wpcom_simple, $site_raw_url, $blog_id ) {
		// If wp-admin subscriber management is enabled, use the wp-admin page.
		if ( $wp_admin_enabled ) {
			return admin_url( 'admin.php?page=subscribers' );
		}

		// For wpcom simple sites, use the wordpress.com URL.
		if ( $is_wpcom_simple ) {
			return 'https://wordpress.com/subscribers/' . $site_raw_url;
		}

		// For Jetpack sites, use the jetpack.com redirect URL.
		$site_id = $blog_id ? $blog_id : Connection_Manager::get_site_id();
		return Redirect::get_url(
			'jetpack-settings-jetpack-manage-subscribers',
			array( 'site' => $site_id )
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

	/**
	 * Register a notice on the Reading settings page to clarify that the RSS
	 * excerpt setting does not control newsletter emails.
	 *
	 * @since 0.5.1
	 */
	public function add_reading_page_notice() {
		add_settings_field(
			'jetpack_newsletter_reading_notice',
			'',
			array( $this, 'render_reading_page_notice' ),
			'reading',
			'default'
		);
	}

	/**
	 * Render the clarifying notice on the Reading settings page.
	 *
	 * Uses JavaScript to relocate the notice next to the "For each post in a feed"
	 * (rss_use_excerpt) setting.
	 *
	 * @since 0.5.1
	 */
	public function render_reading_page_notice() {
		/*
		 * Filter the settings page URL so it points to the correct settings page
		 * regardless of whether the new newsletter UI is enabled.
		 */
		/* This filter is already documented in projects/plugins/jetpack/class.jetpack.php */
		$newsletter_url = apply_filters(
			'jetpack_module_configuration_url_subscriptions',
			admin_url( 'admin.php?page=jetpack#/newsletter' )
		);

		printf(
			'<p class="description" id="jetpack-newsletter-reading-notice">%s</p>',
			sprintf(
				wp_kses(
					/* translators: %s is a link to the Newsletter settings page. */
					__( 'To control what’s included in newsletter emails, visit your <a href="%s">Newsletter settings</a>.', 'jetpack-newsletter' ),
					array(
						'a' => array(
							'href' => array(),
						),
					)
				),
				esc_url( $newsletter_url )
			)
		);
		?>
		<script type="text/javascript">
			document.addEventListener( 'DOMContentLoaded', function() {
				var notice = document.getElementById( 'jetpack-newsletter-reading-notice' );
				var excerptInput = document.querySelector( 'input[name="rss_use_excerpt"]' );
				var excerptRow = excerptInput ? excerptInput.closest( 'tr' ) : null;

				if ( ! notice || ! excerptRow ) {
					return;
				}

				// Remember the original parent before moving the notice.
				var originalTable = notice.closest( 'table' );
				var excerptTable = excerptRow.closest( 'table' );

				// Move the notice into the rss_use_excerpt row's fieldset.
				excerptRow.querySelector( 'td' ).appendChild( notice );

				// Remove the now-empty original table (if it's different from the excerpt's table).
				if ( originalTable && originalTable !== excerptTable ) {
					originalTable.remove();
				}
			} );
		</script>
		<?php
	}
}
