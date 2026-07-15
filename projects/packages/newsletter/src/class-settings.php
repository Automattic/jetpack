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
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Jetpack_Tracks_Client;

/**
 * A class responsible for adding a newsletter settings screen to wp-admin.
 */
class Settings {

	const PACKAGE_VERSION = '0.12.0';

	const ADMIN_PAGE_SLUG = 'jetpack-newsletter';

	/**
	 * Filter name that gates the wp-build–based dashboard.
	 *
	 * When this filter returns true, "Jetpack > Newsletter" renders the new
	 * wp-build dashboard instead of the legacy Newsletter Settings React app.
	 */
	const MODERNIZATION_FILTER = 'rsm_jetpack_ui_modernization_newsletter';

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
	 * Check if the subscriptions module is active.
	 *
	 * @return bool
	 */
	private function is_subscriptions_active() {
		return ( new Modules() )->is_active( 'subscriptions' );
	}

	/**
	 * Determine whether to show the Newsletter menu item.
	 * When true, shown regardless of subscriptions module state.
	 *
	 * @return bool
	 */
	private function should_show_menu_item() {
		/**
		 * Filter to control Newsletter menu item visibility.
		 * Defaults to true.
		 *
		 * @since 0.6.0
		 * @param bool $show Whether to show the menu item.
		 */
		return apply_filters(
			'jetpack_show_newsletter_menu_item',
			true
		);
	}

	/**
	 * Subscribe to necessary hooks.
	 */
	public function init_hooks() {
		// Transitional Subscribers announcement page (active only while the
		// modernization filter is on): registers its AJAX/admin-post handlers
		// and wp-build loading here so they exist on admin-ajax.php and
		// admin-post.php requests. The menu itself is added by the Jetpack
		// plugin's subscriptions module, which owns the Subscribers placement.
		Subscribers_Announcement::init();

		// Add the Reading settings notice as long as subscriptions are active.
		if ( $this->is_subscriptions_active() ) {
			add_action( 'admin_init', array( $this, 'add_reading_page_notice' ) );
		}

		// Hijack the config URLs to point to our settings page.
		// Priority 20 to override the default URL set in subscriptions.php.
		add_filter(
			'jetpack_module_configuration_url_subscriptions',
			function () {
				return Urls::get_newsletter_settings_url();
			},
			20
		);

		// Defer wp-build loading to admin_menu (priority 1) on every host. The
		// modernization filter — which third parties typically register from a
		// plugins_loaded callback — needs to have been applied before we read it,
		// and the wp-build render function needs to be defined before any menu
		// callback runs (priority 999 on standalone Jetpack, priority 999999 on
		// wpcom Simple via wpcom-admin-menu.php's call to add_wp_admin_submenu).
		// Settings::init() runs synchronously from load-jetpack.php at
		// plugin-file-include time — before any plugins_loaded callback fires —
		// so an inline check here would always see the unfiltered default.
		add_action( 'admin_menu', array( __CLASS__, 'maybe_load_wp_build' ), 1 );

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
	}

	/**
	 * Load wp-build for the Newsletter admin page when modernization is enabled.
	 *
	 * Hooked to `admin_menu` priority 1 so the modernization filter has been
	 * registered by any opt-in code (mu-plugins, snippets, themes) before we
	 * read it, and so the wp-build render function and enqueue hook are in
	 * place before `add_wp_admin_menu` runs at priority 999.
	 *
	 * @return void
	 */
	public static function maybe_load_wp_build() {
		if ( ! self::is_modernized() || ! self::is_newsletter_admin_request() ) {
			return;
		}

		self::load_wp_build();
		add_action( 'current_screen', array( __CLASS__, 'alias_screen_id_for_wp_build' ) );
	}

	/**
	 * Add the newsletter settings submenu to the Jetpack menu.
	 *
	 * Note: This method is NOT called on wpcom Simple sites. Simple sites use
	 * add_wp_admin_submenu() called from wpcom-admin-menu.php instead.
	 */
	public function add_wp_admin_menu() {
		// On sites using Jetpack, only show the menu if the site is connected.
		if ( ! ( new Connection_Manager() )->is_connected() ) {
			return;
		}

		// On the modernized dashboard, the Newsletter screen is only useful when the
		// subscriptions module is active, so skip registering the menu entirely when it
		// is off. Gated on the modernization flag to leave legacy behavior unchanged.
		if ( self::is_modernized() && ! $this->is_subscriptions_active() ) {
			return;
		}

		$host = new Host();

		// should_show_menu_item() controls visibility of the menu item.
		$show_menu   = $this->should_show_menu_item();
		$parent_slug = $show_menu ? 'jetpack' : '';

		// On Atomic, use add_submenu_page. On standalone Jetpack, use Admin_Menu when showing in menu.
		$use_jetpack_menu = ! $host->is_woa_site() && $show_menu;

		$callback = self::is_modernized() && function_exists( 'jetpack_newsletter_jetpack_newsletter_dashboard_wp_admin_render_page' )
			? 'jetpack_newsletter_jetpack_newsletter_dashboard_wp_admin_render_page'
			: array( $this, 'render' );

		// Register menu item.
		if ( $use_jetpack_menu ) {
			$page_suffix = Admin_Menu::add_menu(
				/** "Newsletter" is a product name, do not translate. */
				'Newsletter',
				'Newsletter',
				'manage_options',
				'jetpack-newsletter',
				$callback,
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
				$callback
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
	 */
	public function add_wp_admin_submenu() {
		// On the modernized dashboard, the Newsletter screen is only useful when the
		// subscriptions module is active, so skip registering the menu entirely when it
		// is off. Gated on the modernization flag to leave legacy behavior unchanged.
		if ( self::is_modernized() && ! $this->is_subscriptions_active() ) {
			return;
		}

		$parent_slug = $this->should_show_menu_item() ? 'jetpack' : '';
		$callback    = self::is_modernized() && function_exists( 'jetpack_newsletter_jetpack_newsletter_dashboard_wp_admin_render_page' )
			? 'jetpack_newsletter_jetpack_newsletter_dashboard_wp_admin_render_page'
			: array( $this, 'render' );
		$page_suffix = add_submenu_page(
			$parent_slug,
			/** "Newsletter" is a product name, do not translate. */
			'Newsletter',
			'Newsletter',
			'manage_options',
			'jetpack-newsletter',
			$callback
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

		$host                   = new Host();
		$status                 = new Status();
		$site_suffix            = $status->get_site_suffix();
		$blog_id                = (int) $host->get_wpcom_site_id();
		$is_wpcom               = $host->is_wpcom_platform();
		$is_block_theme         = wp_is_block_theme();
		$setup_payment_plan_url = ( $is_wpcom ? 'https://wordpress.com/earn/payments/' : 'https://cloud.jetpack.com/monetize/payments/' ) . $site_suffix;

		$wp_admin_subscriber_management_enabled = apply_filters( 'jetpack_wp_admin_subscriber_management_enabled', true );

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
			'subscriberManagementUrl'         => $this->get_subscriber_management_url( $wp_admin_subscriber_management_enabled, $is_wpcom, $site_suffix, $blog_id ),
			'subscriberManagementEnabled'     => (bool) $wp_admin_subscriber_management_enabled,
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
		// This callback is registered via `admin_enqueue_scripts` from `admin_init`,
		// which itself fires on `load-{$page_suffix}` in `add_wp_admin_menu()` — so it
		// only fires on the Newsletter admin page; no need to re-check the page here.
		// The Tracks transport is required on both surfaces — `analytics.initialize`
		// only queues events into `window._tkq`; without `jp-tracks` loaded, no
		// pixel.gif requests fire and the queue grows forever.
		wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );

		if ( self::is_modernized() ) {
			// wp-build manages the rest of its enqueue pipeline. The legacy
			// newsletter script and JetpackScriptData are intentionally skipped
			// for the wp-build dashboard.
			return;
		}

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
	}

	/**
	 * Get the subscriber management URL based on site type and filter settings.
	 *
	 * - If jetpack_wp_admin_subscriber_management_enabled filter is true: wp-admin subscribers page
	 * - If filter is false AND wpcom site: wordpress.com/subscribers/$domain
	 * - If filter is false AND Jetpack site: jetpack.com redirect URL
	 *
	 * @param bool   $wp_admin_enabled Whether wp-admin subscriber management is enabled.
	 * @param bool   $is_wpcom         Whether this is a WordPress.com site.
	 * @param string $site_suffix      The Calypso site suffix (home host, slashes as `::`).
	 * @param int    $blog_id          The blog ID.
	 * @return string The subscriber management URL.
	 */
	private function get_subscriber_management_url( $wp_admin_enabled, $is_wpcom, $site_suffix, $blog_id ) {
		// If wp-admin subscriber management is enabled, use the wp-admin page.
		if ( $wp_admin_enabled ) {
			return admin_url( 'admin.php?page=subscribers' );
		}

		// For wpcom sites, use the wordpress.com URL.
		if ( $is_wpcom ) {
			return 'https://wordpress.com/subscribers/' . $site_suffix;
		}

		// For Jetpack sites, use the jetpack.com redirect URL.
		$site_id = $blog_id ? (int) $blog_id : Connection_Manager::get_site_id( true );
		$args    = ( ! empty( $site_id ) )
			? array( 'site' => $site_id )
			: array();

		return Redirect::get_url(
			'jetpack-settings-jetpack-manage-subscribers',
			$args
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
		$newsletter_url = Urls::get_newsletter_settings_url();

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

	/**
	 * Load the wp-build entry file and register its polyfills.
	 *
	 * Only called on `?page=jetpack-newsletter` admin requests when the
	 * modernization filter is enabled. Keeps wp-build off every other request.
	 *
	 * @return void
	 */
	private static function load_wp_build() {
		$build_index = dirname( __DIR__ ) . '/build/build.php';

		if ( ! file_exists( $build_index ) ) {
			return;
		}

		require_once $build_index;

		\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::register(
			'jetpack-newsletter',
			array_merge(
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::SCRIPT_HANDLES,
				\Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills::MODULE_IDS
			)
		);
	}

	/**
	 * Alias the current screen ID to satisfy wp-build's auto-generated enqueue check.
	 *
	 * Wp-build's `<page>-wp-admin` enqueue callback enqueues only when the screen ID
	 * matches the wp-build page slug (`jetpack-newsletter-dashboard`). Our wp-admin
	 * menu slug stays `jetpack-newsletter`, so we mutate the screen object in place
	 * to make the check pass without changing the user-facing URL.
	 *
	 * Hooked only when modernization is on AND we're on the Newsletter admin page,
	 * so this never affects any other request.
	 *
	 * @param \WP_Screen|null $screen The current screen object (passed by WP).
	 * @return void
	 */
	public static function alias_screen_id_for_wp_build( $screen ) {
		if ( ! is_object( $screen ) ) {
			return;
		}

		$screen->id = 'jetpack-newsletter-dashboard';
	}

	/**
	 * Returns true when the wp-build modernization filter is enabled.
	 *
	 * The modernized Newsletter dashboard, wp-admin subscriber management, and the
	 * retired Calypso Subscribers submenu now default on for every site. Hosts (and
	 * a11ns who want the legacy view back) can still force the legacy experience with
	 * `add_filter( self::MODERNIZATION_FILTER, '__return_false' );`.
	 *
	 * @return bool
	 */
	private static function is_modernized() {
		return (bool) apply_filters( self::MODERNIZATION_FILTER, true );
	}

	/**
	 * Returns true when the current request targets the Newsletter admin page.
	 *
	 * Used to scope wp-build loading to the one page that needs it. The
	 * `$_GET['page']` value is populated by wp-admin/admin.php before any of
	 * our hooks fire, so this check is reliable from `init_hooks()` onwards.
	 *
	 * @return bool
	 */
	private static function is_newsletter_admin_request() {
		if ( ! is_admin() || ! isset( $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return false;
		}

		return sanitize_text_field( wp_unslash( $_GET['page'] ) ) === self::ADMIN_PAGE_SLUG; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}
}
