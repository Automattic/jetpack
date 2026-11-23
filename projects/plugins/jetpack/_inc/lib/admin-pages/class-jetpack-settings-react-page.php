<?php
/**
 * The Jetpack Settings admin page.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\My_Jetpack\Google_Analytics_Settings;
use Automattic\Jetpack\My_Jetpack\Initializer as My_Jetpack_Initializer;
use Automattic\Jetpack\PremiumAnalytics\Analytics;
use Automattic\Jetpack\SEO\Initializer as SEO_Initializer;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

require_once __DIR__ . '/class.jetpack-admin-page.php';
require_once __DIR__ . '/class-jetpack-redux-state-helper.php';
require_once __DIR__ . '/class-jetpack-wp-build-page.php';

/**
 * Renders the Settings app, whose connection screens also serve unconnected sites.
 *
 * @since 16.3
 */
class Jetpack_Settings_React_Page extends Jetpack_Admin_Page {
	/**
	 * Register the page before the site connects, for the connection screen.
	 *
	 * @var bool
	 */
	protected $dont_show_if_not_active = false;

	/**
	 * Whether the REST API is off and the page falls back to the modules list.
	 *
	 * @var bool
	 */
	protected $is_redirecting = false;

	/**
	 * The wp-build route's page id, which must not be the `jetpack-settings` menu slug.
	 *
	 * @var string
	 */
	const WP_BUILD_PAGE_ID = 'jetpack-settings-dashboard';

	/**
	 * Whether this request loaded the wp-build route.
	 *
	 * @var bool
	 */
	private $is_wp_build_loaded = false;

	/**
	 * Whether this request should load wp-build.
	 *
	 * An IDC-blocked page shows only the IDC banner, which the wp-build template would hide.
	 *
	 * @since 16.3
	 *
	 * @return bool
	 */
	public function should_load_wp_build() {
		if ( ! is_admin() ) {
			return false;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Reading the page slug only.
		if ( ! isset( $_GET['page'] ) || 'jetpack-settings' !== sanitize_text_field( wp_unslash( $_GET['page'] ) ) ) {
			return false;
		}

		return ! $this->block_page_rendering_for_idc();
	}

	/**
	 * Load wp-build before the admin menu is built, on the Settings request only.
	 *
	 * @since 16.3
	 *
	 * @return void
	 */
	public function maybe_load_wp_build() {
		if ( $this->should_load_wp_build() ) {
			$this->is_wp_build_loaded = Jetpack_WP_Build_Page::load( self::WP_BUILD_PAGE_ID );
		}
	}

	/**
	 * Register Settings with the admin shell, which switches between Jetpack dashboards without a page load.
	 *
	 * @since 16.5
	 *
	 * @param array $members Shell members keyed by admin page slug.
	 * @return array
	 */
	public function add_admin_shell_member( $members ) {
		// During IDC the page shows only the IDC banner.
		if (
			( new Host() )->is_wpcom_simple()
			|| ! file_exists( JETPACK__PLUGIN_DIR . 'build/build.php' )
			|| ! $this->can_access_settings()
			|| $this->block_page_rendering_for_idc()
		) {
			return $members;
		}

		$members['jetpack-settings'] = array(
			'build_prefix' => 'jetpack_plugin',
			'build_page'   => self::WP_BUILD_PAGE_ID,
			'init_modules' => array( '@jetpack-plugin/init' ),
			'title'        => __( 'Settings', 'jetpack' ),
			// The landing tab, and so its subtitle, is picked in the browser from modules, plan and pages.
			'header'       => array(
				'title'    => __( 'Settings', 'jetpack' ),
				'subtitle' => null,
			),
			'capability'   => 'jetpack_admin_page',
			'handles'      => array( 'react-plugin', 'jetpack-script-data', 'jp-tracks', 'wp-jp-i18n-loader' ),
			'load'         => array( $this, 'load_as_admin_shell_guest' ),
		);
		return $members;
	}

	/**
	 * Ready the Settings routes and page data while another dashboard's page is open, without the screen ID alias.
	 *
	 * @since 16.5
	 *
	 * @return void
	 */
	public function load_as_admin_shell_guest() {
		// A menu hover builds the page state, which saves module defaults and copies of per-user values; the page's own load saves them.
		if ( self::is_admin_shell_guest_request() ) {
			$user_id     = get_current_user_id();
			$keep_stored = static function ( $value, $old_value ) {
				return $old_value;
			};
			foreach ( array( 'sharing-options', 'monitor_receive_notifications' . $user_id, 'post_by_email_address' . $user_id ) as $option ) {
				add_filter( 'pre_update_option_' . $option, $keep_stored, 10, 2 );
			}
			// The purchase token lives among the connection tokens, so hold back only that key.
			add_filter(
				'pre_update_option_jetpack_private_options',
				static function ( $value, $old_value ) {
					if ( ! is_array( $value ) ) {
						return $value;
					}
					if ( is_array( $old_value ) && isset( $old_value['purchase_token'] ) ) {
						$value['purchase_token'] = $old_value['purchase_token'];
					} else {
						unset( $value['purchase_token'] );
					}
					return $value;
				},
				10,
				2
			);
		}

		$this->is_wp_build_loaded = Jetpack_WP_Build_Page::load( self::WP_BUILD_PAGE_ID, false );
		if ( $this->is_wp_build_loaded ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'page_admin_scripts' ) );
		}
	}

	/**
	 * Whether this is the admin shell's hover request, not another dashboard's page readying Settings for a switch.
	 *
	 * @return bool
	 */
	private static function is_admin_shell_guest_request() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Compared only; the shell checks the nonce.
		return wp_doing_ajax() && isset( $_GET['action'] ) && \Automattic\Jetpack\Admin_UI\Admin_Shell::GUEST_ACTION === wp_unslash( $_GET['action'] );
	}

	/**
	 * Whether this request renders through wp-build.
	 *
	 * @since 16.3
	 *
	 * @return bool
	 */
	public function should_render_wp_build() {
		return $this->is_wp_build_loaded && function_exists( 'jetpack_plugin_jetpack_settings_dashboard_wp_admin_render_page' );
	}

	/**
	 * The route bundle's classic script dependencies (e.g. `lodash`), which wp-build registers
	 * as a script module without them, leaving globals like `window.lodash` undefined.
	 *
	 * @since 16.3
	 *
	 * @return string[]
	 */
	protected function get_wp_build_script_dependencies() {
		$asset_path = JETPACK__PLUGIN_DIR . 'build/routes/settings/content.min.asset.php';
		if ( ! file_exists( $asset_path ) ) {
			return array();
		}

		$asset = include $asset_path;
		return $asset['dependencies'] ?? array();
	}

	/**
	 * Register the page; only its sidebar entry keeps the Settings access gate.
	 *
	 * Shares the bottom tier with Beta Tester so it lands below the alphabetical run;
	 * the upsell still renders underneath because Admin_Menu appends it after sorting.
	 *
	 * @return string The page hook.
	 */
	public function get_page_hook() {
		if ( ! $this->can_access_settings() || array() === self::get_remaining_tabs() ) {
			add_filter( 'jetpack_admin_menu_visibility', array( __CLASS__, 'hide_menu_item' ) );
		}

		$position = defined( Admin_Menu::class . '::POSITION_LAST' ) ? Admin_Menu::POSITION_LAST : 998;

		$hook = Admin_Menu::add_menu(
			__( 'Settings', 'jetpack' ),
			__( 'Settings', 'jetpack' ),
			'jetpack_admin_page',
			'jetpack-settings',
			array( $this, 'render' ),
			$position,
			array( 'key' => 'jetpack-settings' )
		);

		// The IDC banner is a core-style notice, and during IDC it is all this page shows.
		remove_action( "load-$hook", array( Admin_Menu::class, 'hide_core_admin_notices' ) );

		return $hook;
	}

	/**
	 * Hide the sidebar entry from users who cannot use Settings, or who have no tab left on it.
	 *
	 * @param array $states Menu item key to visibility state.
	 * @return array
	 */
	public static function hide_menu_item( $states ) {
		$states['jetpack-settings'] = 'hidden';
		return $states;
	}

	/**
	 * The tabs Settings still shows this user once settings move to My Jetpack, which the sidebar entry and the nav both follow.
	 *
	 * @since $$next-version$$
	 *
	 * @return string[]|null Tab routes without the slash, or null while settings stay here: consolidation is off, or the user cannot manage modules.
	 */
	public static function get_remaining_tabs() {
		if ( ! current_user_can( 'jetpack_manage_modules' ) || ! self::are_settings_moving_out() ) {
			return null;
		}

		$available = Jetpack::get_available_modules();
		$has_any   = static function ( array $modules ) use ( $available ) {
			return array() !== array_intersect( $modules, $available );
		};

		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		$tabs = array();

		if (
			! did_action( 'jetpack_protect_dashboard_initialized' )
			&& ( $has_any( array( 'protect', 'sso', 'vaultpress' ) ) || is_plugin_active( 'akismet/akismet.php' ) )
		) {
			$tabs[] = 'security';
		}

		$has_seo_page        = method_exists( SEO_Initializer::class, 'is_seo_surface_visible' ) && SEO_Initializer::is_seo_surface_visible();
		$has_analytics_panel = method_exists( Google_Analytics_Settings::class, 'is_available' ) && Google_Analytics_Settings::is_available();
		// Stats v2 counts wherever it booted, the Premium Analytics plugin included.
		$has_stats_v2   = method_exists( Analytics::class, 'is_initialized' ) ? Analytics::is_initialized() : Jetpack::is_premium_analytics_enabled();
		$has_stats_page = Stats_Options::get_option( 'enable_odyssey_stats' ) || $has_stats_v2;
		if (
			( ! $has_seo_page && $has_any( array( 'seo-tools', 'canonical-urls', 'verification-tools', 'sitemaps' ) ) )
			|| ( ( new Host() )->is_woa_site() && ! $has_analytics_panel )
			|| ( ! $has_stats_page && $has_any( array( 'stats' ) ) )
		) {
			$tabs[] = 'traffic';
		}

		if ( $has_any( array( 'wordads' ) ) && ! Jetpack_Ads_Settings_Home::is_moved_off_settings() ) {
			$tabs[] = 'earn';
		}

		return $tabs;
	}

	/**
	 * Add page actions.
	 *
	 * @param string $hook Hook of current page.
	 * @return void
	 */
	public function add_page_actions( $hook ) {
		add_action( "load-$hook", array( $this, 'add_fallback_redirects' ) );
	}

	/**
	 * Send browsers that cannot run the app to the modules list.
	 *
	 * @return void
	 */
	public function add_fallback_redirects() {
		if ( ! $this->is_rest_api_enabled() ) {
			$this->is_redirecting = true;
			add_action( 'admin_head', array( $this, 'add_fallback_head_meta' ) );
		}

		add_action( 'admin_head', array( $this, 'add_noscript_head_meta' ) );
	}

	/**
	 * Determine whether a user can access the Jetpack Settings page.
	 *
	 * Rules are:
	 * - user is allowed to see the Jetpack Admin
	 * - site is connected or in offline mode
	 * - non-admins only need access to the settings when there are modules they can manage.
	 *
	 * @return bool $can_access_settings Can the user access settings.
	 */
	private function can_access_settings() {
		$connection = new Connection_Manager( 'jetpack' );
		$status     = new Status();

		// User must have the necessary permissions to see the Jetpack settings pages.
		if ( ! current_user_can( 'edit_posts' ) ) {
			return false;
		}

		// In offline mode, allow access to admins.
		if ( $status->is_offline_mode() && current_user_can( 'manage_options' ) ) {
			return true;
		}

		// If not in offline mode but site is not connected, bail.
		if ( ! Jetpack::is_connection_ready() ) {
			return false;
		}

		/*
		 * Additional checks for non-admins.
		*/
		if ( ! current_user_can( 'manage_options' ) ) {
			// If the site isn't connected at all, bail.
			if ( ! $connection->has_connected_owner() ) {
				return false;
			}

			/*
			 * If they haven't connected their own account yet,
			 * they have no use for the settings page.
			 * They will not be able to manage any settings.
			 */
			if ( ! $connection->is_user_connected() ) {
				return false;
			}

			/*
			 * Non-admins only have access to settings
			 * for the following modules:
			 * - Publicize
			 * - Post By Email, until it lives only on their Profile page
			 * If those modules are not available, bail.
			 */
			if (
				( ! Jetpack::is_module_active( 'post-by-email' ) || self::are_settings_moving_out() )
					&& (
						! Jetpack::is_module_active( 'publicize' ) ||
						! current_user_can( 'publish_posts' )
					)
			) {
				return false;
			}
		}

		// fallback.
		return true;
	}

	/**
	 * Whether settings move to My Jetpack, which leaves Post by Email for non-admins only on their Profile page.
	 *
	 * Uses the check that needs no admin menu, since this runs while the menu is built.
	 *
	 * @return bool
	 */
	private static function are_settings_moving_out() {
		return method_exists( My_Jetpack_Initializer::class, 'is_settings_consolidation_on_for_site' )
			&& My_Jetpack_Initializer::is_settings_consolidation_on_for_site();
	}

	/**
	 * Add action to render page specific HTML.
	 *
	 * @return void
	 */
	public function page_render() {
		/** This action is already documented in class.jetpack-admin-page.php */
		do_action( 'jetpack_notices' );

		if ( $this->should_render_wp_build() ) {
			jetpack_plugin_jetpack_settings_dashboard_wp_admin_render_page(); // @phan-suppress-current-line PhanUndeclaredFunction -- should_render_wp_build() checks function_exists(); defined in the generated build/pages/, which Phan excludes.
			return;
		}

		echo '<p class="jp-settings-build-error">';
		esc_html_e( 'Jetpack Settings could not load. Try running: ', 'jetpack' );
		echo '<code>pnpm jetpack build plugins/jetpack</code>';
		echo '</p>';
	}

	/**
	 * Load styles for static page.
	 */
	public function additional_styles() {
		// The route bundle carries these styles.
		if ( $this->should_render_wp_build() ) {
			return;
		}

		Jetpack_Admin_Page::load_wrapper_styles();
	}

	/**
	 * Load admin page scripts.
	 */
	public function page_admin_scripts() {
		// A fallback page, or one without the route (IDC-blocked or unbuilt), renders no app to feed.
		if ( $this->is_redirecting || ! $this->should_render_wp_build() ) {
			return;
		}

		$status          = new Status();
		$is_offline_mode = $status->is_offline_mode();
		$site_suffix     = $status->get_site_suffix();

		// wp-build enqueues the route bundle; this handle carries the inline state and classic dependencies.
		wp_register_script( 'react-plugin', false, $this->get_wp_build_script_dependencies(), JETPACK__VERSION, true );
		wp_enqueue_script( 'react-plugin' );

		$blog_id_prop = '';
		if ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) {
			$blog_id = Connection_Manager::get_site_id( true );
			if ( $blog_id ) {
				$blog_id_prop = ', currentBlogID: "' . (int) $blog_id . '"';
			}
		}

		if ( ! $is_offline_mode && Jetpack::is_connection_ready() ) {
			// Required for Analytics.
			wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );
		}

		// Add objects to be passed to the initial state of the app.
		// Use wp_add_inline_script instead of wp_localize_script, see https://core.trac.wordpress.org/ticket/25280.
		wp_add_inline_script( 'react-plugin', 'var Initial_State=' . wp_json_encode( Jetpack_Redux_State_Helper::get_initial_state(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';', 'before' );

		// This will set the default URL of the jp_redirects lib.
		wp_add_inline_script( 'react-plugin', 'var jetpack_redirects = { currentSiteRawUrl: "' . $site_suffix . '"' . $blog_id_prop . ' };', 'before' );

		// Adds Connection package initial state.
		Connection_Initial_State::render_script( 'react-plugin' );
	}
}
