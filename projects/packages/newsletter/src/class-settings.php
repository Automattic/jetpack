<?php
/**
 * A class that adds the unified Newsletter screen to wp-admin.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use Jetpack_Tracks_Client;

/**
 * A class responsible for adding the unified Newsletter screen to wp-admin.
 *
 * The page is built on @wordpress/admin-ui's `Page` and the wp-build pipeline
 * (mirroring the Subscribers Dashboard chassis), and exposes two routes —
 * `/` (Subscribers, placeholder until Phase 2) and `/settings` — under one
 * admin menu item.
 */
class Settings {

	const PACKAGE_VERSION = '0.8.5';

	/**
	 * URL-facing menu slug. Stays at the historical `jetpack-newsletter` so
	 * existing bookmarks, support docs, and deep links keep working.
	 *
	 * @var string
	 */
	const ADMIN_SLUG = 'jetpack-newsletter';

	/**
	 * Internal slug emitted by `@wordpress/build` (`wpPlugin.pages[0]` plus
	 * the `-wp-admin` suffix the build template appends). Used to find the
	 * auto-generated render / enqueue functions and to mount the boot app.
	 *
	 * @var string
	 */
	const WP_BUILD_SLUG = 'jetpack-newsletter-wp-admin';

	/**
	 * Whether the class has been initialized.
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
		return apply_filters( 'jetpack_show_newsletter_menu_item', true );
	}

	/**
	 * Subscribe to necessary hooks.
	 */
	public function init_hooks() {
		self::load_wp_build();
		self::fix_boot_import_map_ordering();
		self::bridge_wp_build_enqueue();

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
	 * Load wp-build generated registration files. Mirrors Forms / Subscribers.
	 */
	public static function load_wp_build() {
		// Polyfill `@wordpress/boot`, `@wordpress/route`, `@wordpress/a11y` modules
		// + `wp-theme`, `wp-views`, `wp-private-apis`, `wp-notices` classic-script
		// handles for sites running WP without the script-modules these depend on.
		WP_Build_Polyfills::register(
			'jetpack-newsletter',
			array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS )
		);

		$wp_build_index = dirname( __DIR__ ) . '/build/build.php';
		if ( file_exists( $wp_build_index ) ) {
			require_once $wp_build_index;
		}
	}

	/**
	 * Bridge wp-build's auto-generated enqueue function — which checks for
	 * `?page=jetpack-newsletter-wp-admin` — to our user-facing slug
	 * `?page=jetpack-newsletter`. Hooked at priority 9 so the wp-build copy
	 * (registered at priority 10) sees the original `$_GET['page']` and
	 * skips its own enqueue.
	 */
	public static function bridge_wp_build_enqueue() {
		add_action(
			'admin_enqueue_scripts',
			static function ( $hook_suffix ) {
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended
				if ( ! isset( $_GET['page'] ) || self::ADMIN_SLUG !== $_GET['page'] ) {
					return;
				}

				$enqueue_fn = 'jetpack_newsletter_jetpack_newsletter_wp_admin_enqueue_scripts';
				if ( ! function_exists( $enqueue_fn ) ) {
					return;
				}

				// phpcs:disable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
				$original     = isset( $_GET['page'] ) ? sanitize_text_field( wp_unslash( $_GET['page'] ) ) : null;
				$_GET['page'] = self::WP_BUILD_SLUG;
				call_user_func( $enqueue_fn, $hook_suffix );
				if ( null === $original ) {
					unset( $_GET['page'] );
				} else {
					$_GET['page'] = $original;
				}
				// phpcs:enable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
			},
			9
		);
	}

	/**
	 * Fix import map ordering for the wp-build boot script.
	 *
	 * In wp-admin, _wp_footer_scripts (classic scripts) and print_import_map
	 * both hook into admin_print_footer_scripts at priority 10, but
	 * _wp_footer_scripts is registered first. This causes the inline
	 * import("@wordpress/boot") to execute before the import map exists.
	 *
	 * This fix moves the import() call from the classic inline script to a
	 * <script type="module"> printed at priority 20 (after the import map).
	 *
	 * @todo Remove once @wordpress/build ships with the loader.js fix upstream
	 *       (WordPress/gutenberg#76870) and Jetpack updates the dependency.
	 */
	public static function fix_boot_import_map_ordering() {
		$handle = self::WP_BUILD_SLUG . '-prerequisites';

		add_action(
			'admin_enqueue_scripts',
			static function () use ( $handle ) {
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended
				if ( ! isset( $_GET['page'] ) || self::ADMIN_SLUG !== $_GET['page'] ) {
					return;
				}

				$data = wp_scripts()->get_data( $handle, 'after' );
				if ( empty( $data ) ) {
					return;
				}

				$boot_script = null;
				$remaining   = array();
				foreach ( $data as $line ) {
					if ( strpos( $line, '@wordpress/boot' ) !== false ) {
						$boot_script = $line;
					} else {
						$remaining[] = $line;
					}
				}

				if ( null === $boot_script ) {
					return;
				}

				wp_scripts()->add_data( $handle, 'after', $remaining );

				add_action(
					'admin_print_footer_scripts',
					static function () use ( $boot_script ) {
						wp_print_inline_script_tag( $boot_script, array( 'type' => 'module' ) );
					},
					20
				);
			},
			PHP_INT_MAX
		);
	}

	/**
	 * Add the unified Newsletter menu item.
	 *
	 * Note: This method is NOT called on wpcom Simple sites. Simple sites use
	 * add_wp_admin_submenu() called from wpcom-admin-menu.php instead.
	 */
	public function add_wp_admin_menu() {
		// On sites using Jetpack, only show the menu if the site is connected.
		if ( ! ( new Connection_Manager() )->is_connected() ) {
			return;
		}

		$host = new Host();

		// should_show_menu_item() controls visibility of the menu item.
		$show_menu   = $this->should_show_menu_item();
		$parent_slug = $show_menu ? 'jetpack' : '';

		$render_fn = 'jetpack_newsletter_jetpack_newsletter_wp_admin_render_page';
		$callback  = function_exists( $render_fn ) ? $render_fn : array( $this, 'render' );

		// On Atomic, use add_submenu_page. On standalone Jetpack, use Admin_Menu when showing in menu.
		$use_jetpack_menu = ! $host->is_woa_site() && $show_menu;

		// Register menu item.
		if ( $use_jetpack_menu ) {
			$page_suffix = Admin_Menu::add_menu(
				/** "Newsletter" is a product name, do not translate. */
				'Newsletter',
				'Newsletter',
				'manage_options',
				self::ADMIN_SLUG,
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
				self::ADMIN_SLUG,
				$callback
			);
		}

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
		}
	}

	/**
	 * Add the unified Newsletter submenu directly under the Jetpack menu.
	 *
	 * This method is called from wpcom-admin-menu.php on Simple sites at late priority
	 * (999999) when the Jetpack menu already exists.
	 */
	public function add_wp_admin_submenu() {
		$parent_slug = $this->should_show_menu_item() ? 'jetpack' : '';

		$render_fn = 'jetpack_newsletter_jetpack_newsletter_wp_admin_render_page';
		$callback  = function_exists( $render_fn ) ? $render_fn : array( $this, 'render' );

		$page_suffix = add_submenu_page(
			$parent_slug,
			/** "Newsletter" is a product name, do not translate. */
			'Newsletter',
			'Newsletter',
			'manage_options',
			self::ADMIN_SLUG,
			$callback
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
		}
	}

	/**
	 * Admin init actions.
	 *
	 * The wp-build-generated enqueue (registered via load_wp_build) handles the
	 * boot scripts and styles. We still expose newsletter-specific data via
	 * jetpack_admin_js_script_data so the React app can read connection /
	 * blog identifiers without a separate REST roundtrip.
	 */
	public function admin_init() {
		add_filter( 'jetpack_admin_js_script_data', array( $this, 'add_script_data' ) );
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
		$is_wpcom               = $host->is_wpcom_platform();
		$is_block_theme         = wp_is_block_theme();
		$setup_payment_plan_url = ( $is_wpcom ? 'https://wordpress.com/earn/payments/' : 'https://cloud.jetpack.com/monetize/payments/' ) . rawurlencode( $site_raw_url );

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
			'subscriberManagementUrl'         => $this->get_subscriber_management_url( $wp_admin_subscriber_management_enabled, $is_wpcom, $site_raw_url, $blog_id ),
			'subscriberManagementEnabled'     => (bool) $wp_admin_subscriber_management_enabled,
			'isSubscriptionSiteEditSupported' => $is_block_theme,
			'setupPaymentPlansUrl'            => $setup_payment_plan_url,
			'isSitePublic'                    => ! $status->is_private_site() && ! $status->is_coming_soon(),
			'tracksUserData'                  => Jetpack_Tracks_Client::get_connected_user_tracks_identity(),
		);

		return $data;
	}

	/**
	 * Get the subscriber management URL based on site type and filter settings.
	 *
	 * - If jetpack_wp_admin_subscriber_management_enabled filter is true: in-admin Newsletter page
	 * - If filter is false AND wpcom site: wordpress.com/subscribers/$domain
	 * - If filter is false AND Jetpack site: jetpack.com redirect URL
	 *
	 * @param bool   $wp_admin_enabled Whether wp-admin subscriber management is enabled.
	 * @param bool   $is_wpcom         Whether this is a WordPress.com site.
	 * @param string $site_raw_url     The site URL without protocol.
	 * @param int    $blog_id          The blog ID.
	 * @return string The subscriber management URL.
	 */
	private function get_subscriber_management_url( $wp_admin_enabled, $is_wpcom, $site_raw_url, $blog_id ) {
		// If wp-admin subscriber management is enabled, point at the unified Newsletter page.
		if ( $wp_admin_enabled ) {
			return Urls::get_newsletter_settings_url();
		}

		// For wpcom sites, use the wordpress.com URL.
		if ( $is_wpcom ) {
			return 'https://wordpress.com/subscribers/' . $site_raw_url;
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
	 * Fallback render when wp-build's generated function is not available.
	 *
	 * In normal use the menu callback is the auto-generated render function
	 * from `build/pages/jetpack-newsletter/page-wp-admin.php`.
	 */
	public function render() {
		echo '<div id="' . esc_attr( self::WP_BUILD_SLUG ) . '-app" class="boot-layout-container"></div>';
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
}
