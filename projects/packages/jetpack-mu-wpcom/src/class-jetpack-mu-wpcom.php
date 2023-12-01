<?php
/**
 * Enhances your site with features powered by WordPress.com
 * This package is intended for internal use on WordPress.com sites only (simple and Atomic).
 * Internal PT Reference: p9dueE-6jY-p2
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack;

/**
 * Jetpack_Mu_Wpcom main class.
 */
class Jetpack_Mu_Wpcom {

	const PACKAGE_VERSION = '5.2.0-alpha';
	const PKG_DIR         = __DIR__ . '/../';

	/**
	 * Initialize the class.
	 */
	public static function init() {
		if ( did_action( 'jetpack_mu_wpcom_initialized' ) ) {
			return;
		}

		// Shared code for src/features.
		require_once self::PKG_DIR . 'src/common/index.php'; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath

		// Coming Soon feature.
		add_action( 'plugins_loaded', array( __CLASS__, 'load_coming_soon' ) );

		add_action( 'plugins_loaded', array( __CLASS__, 'load_features' ) );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_wpcom_rest_api_endpoints' ) );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_launchpad' ), 0 );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_block_theme_previews' ) );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_site_editor_dashboard_link' ) );

		add_action( 'plugins_loaded', array( __CLASS__, 'load_marketplace_products_updater' ) );

		add_action( 'plugins_loaded', array( __CLASS__, 'load_first_posts_stream_helpers' ) );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_domain_email_nag' ) );

		// Unified navigation fix for changes in WordPress 6.2.
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'unbind_focusout_on_wp_admin_bar_menu_toggle' ) );

		// Load the Map block settings.
		add_action( 'enqueue_block_assets', array( __CLASS__, 'load_map_block_settings' ), 999 );

		// Load the Newsletter category settings.
		add_action( 'enqueue_block_assets', array( __CLASS__, 'load_newsletter_categories_settings' ), 999 );
		/**
		 * Runs right after the Jetpack_Mu_Wpcom package is initialized.
		 *
		 * @since 0.1.2
		 */
		do_action( 'jetpack_mu_wpcom_initialized' );
	}

	/**
	 * Load features that don't need any special loading considerations.
	 */
	public static function load_features() {
		require_once __DIR__ . '/features/100-year-plan/enhanced-ownership.php';
		require_once __DIR__ . '/features/100-year-plan/locked-mode.php';

		require_once __DIR__ . '/features/media/heif-support.php';

		require_once __DIR__ . '/features/block-patterns/block-patterns.php';
	}

	/**
	 * Load the Coming Soon feature.
	 */
	public static function load_coming_soon() {
		/**
		 * On WoA sites, users may be using non-symlinked older versions of the FSE plugin.
		 * If they are, check the active version to avoid redeclaration errors.
		 */
		if ( ! function_exists( 'is_plugin_active' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}
		$invalid_fse_version_active = is_plugin_active( 'full-site-editing/full-site-editing-plugin.php' ) && version_compare( get_plugin_data( WP_PLUGIN_DIR . '/full-site-editing/full-site-editing-plugin.php' )['Version'], '3.56084', '<' );
		if ( $invalid_fse_version_active ) {
			return;
		}

		if (
			( defined( 'WPCOM_PUBLIC_COMING_SOON' ) && WPCOM_PUBLIC_COMING_SOON ) ||
			apply_filters( 'a8c_enable_public_coming_soon', false )
		) {
			require_once __DIR__ . '/features/coming-soon/coming-soon.php';
		}
	}

	/**
	 * Load the Launchpad feature.
	 */
	public static function load_launchpad() {
		require_once __DIR__ . '/features/launchpad/launchpad.php';
	}
	/**
	 * Load the domain email nag feature.
	 */
	public static function load_domain_email_nag() {
		require_once __DIR__ . '/features/domain-email-nag/domain-email-nag.php';
	}

	/**
	 * Load WP REST API plugins for wpcom.
	 */
	public static function load_wpcom_rest_api_endpoints() {
		if ( ! function_exists( 'wpcom_rest_api_v2_load_plugin' ) ) {
			return;
		}

		// We don't use `wpcom_rest_api_v2_load_plugin_files` because it operates inconsisently.
		$plugins = glob( __DIR__ . '/features/wpcom-endpoints/*.php' );

		if ( ! is_array( $plugins ) ) {
			return;
		}

		foreach ( array_filter( $plugins, 'is_file' ) as $plugin ) {
			require_once $plugin;
		}
	}

	/**
	 * Adds a global variable containing the map provider in a map_block_settings object to the window object.
	 */
	public static function load_map_block_settings() {
		if (
			! function_exists( 'get_current_screen' )
			|| \get_current_screen() === null
		) {
			return;
		}

		// Return early if we are not in the block editor.
		if ( ! wp_should_load_block_editor_scripts_and_styles() ) {
			return;
		}

		$map_provider = apply_filters( 'wpcom_map_block_map_provider', 'mapbox' );
		wp_localize_script( 'jetpack-blocks-editor', 'Jetpack_Maps', array( 'provider' => $map_provider ) );
	}

	/**
	 * Adds a global variable containing where the newsletter categories should be shown.
	 */
	public static function load_newsletter_categories_settings() {
		if (
			! function_exists( 'get_current_screen' )
			|| \get_current_screen() === null
		) {
			return;
		}

		// Return early if we are not in the block editor.
		if ( ! wp_should_load_block_editor_scripts_and_styles() ) {
			return;
		}

		$newsletter_categories_location = apply_filters( 'wpcom_newsletter_categories_location', 'block' );
		wp_localize_script( 'jetpack-blocks-editor', 'Jetpack_Subscriptions', array( 'newsletter_categories_location' => $newsletter_categories_location ) );
	}

	/**
	 * Load Gutenberg's Block Theme Previews feature.
	 */
	public static function load_block_theme_previews() {
		if ( defined( 'IS_GUTENBERG_PLUGIN' ) && IS_GUTENBERG_PLUGIN ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			if ( ! empty( $_GET['wp_theme_preview'] ) ) {
				require_once __DIR__ . '/features/block-theme-previews/block-theme-previews.php';
			}
		}
	}

	/**
	 * Change the Site Editor's dashboard link.
	 */
	public static function load_site_editor_dashboard_link() {
		require_once __DIR__ . '/features/site-editor-dashboard-link/site-editor-dashboard-link.php';
	}

	/**
	 * Unbinds focusout event handler on #wp-admin-bar-menu-toggle introduced in WordPress 6.2.
	 *
	 * The focusout event handler is preventing the unified navigation from being closed on mobile.
	 */
	public static function unbind_focusout_on_wp_admin_bar_menu_toggle() {
		wp_add_inline_script( 'common', '(function($){ $(document).on("wp-responsive-activate", function(){ $(".is-nav-unification #wp-admin-bar-menu-toggle, .is-nav-unification #adminmenumain").off("focusout"); } ); }(jQuery) );' );
	}

	/**
	 * Load WPCOM Marketplace products updates provider.
	 *
	 * @return void
	 */
	public static function load_marketplace_products_updater() {
		require_once __DIR__ . '/features/marketplace-products-updater/class-marketplace-products-updater.php';

		\Marketplace_Products_Updater::init();
	}

	/**
	 * Load First Posts stream helpers.
	 *
	 * @return void
	 */
	public static function load_first_posts_stream_helpers() {
		require_once __DIR__ . '/features/first-posts-stream/first-posts-stream-helpers.php';
	}
}
