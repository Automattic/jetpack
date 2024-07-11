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
	const PACKAGE_VERSION = '5.44.0-alpha';
	const PKG_DIR         = __DIR__ . '/../';
	const BASE_DIR        = __DIR__ . '/';
	const BASE_FILE       = __FILE__;

	/**
	 * Initialize the class.
	 */
	public static function init() {
		if ( did_action( 'jetpack_mu_wpcom_initialized' ) ) {
			return;
		}

		// Shared code for src/features.
		require_once self::PKG_DIR . 'src/common/index.php'; // phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath

		// Load features that don't need any special loading considerations.
		add_action( 'plugins_loaded', array( __CLASS__, 'load_features' ) );

		// Load ETK features that need higher priority than the ETK plugin.
		add_action( 'plugins_loaded', array( __CLASS__, 'load_etk_features' ), 0 );

		/*
		 * Please double-check whether you really need to load your feature separately.
		 * Chances are you can just add it to the `load_features` method.
		 */
		add_action( 'plugins_loaded', array( __CLASS__, 'load_launchpad' ), 0 );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_coming_soon' ) );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_wpcom_rest_api_endpoints' ) );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_block_theme_previews' ) );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_wpcom_command_palette' ) );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_wpcom_admin_interface' ) );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_wpcom_site_management_widget' ) );
		add_action( 'plugins_loaded', array( __CLASS__, 'load_replace_site_visibility' ) );

		// These features run only on simple sites.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			add_action( 'plugins_loaded', array( __CLASS__, 'load_verbum_comments' ) );
			add_action( 'wp_loaded', array( __CLASS__, 'load_verbum_comments_admin' ) );
			add_action( 'admin_menu', array( __CLASS__, 'load_wpcom_simple_odyssey_stats' ) );
		}

		// These features run only on atomic sites.
		if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
			add_action( 'plugins_loaded', array( __CLASS__, 'load_custom_css' ) );
		}

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
		// Shared features.
		require_once __DIR__ . '/features/agency-managed/agency-managed.php';

		// Please keep the features in alphabetical order.
		require_once __DIR__ . '/features/100-year-plan/enhanced-ownership.php';
		require_once __DIR__ . '/features/100-year-plan/locked-mode.php';
		require_once __DIR__ . '/features/admin-color-schemes/admin-color-schemes.php';
		require_once __DIR__ . '/features/block-patterns/block-patterns.php';
		require_once __DIR__ . '/features/blog-privacy/blog-privacy.php';
		require_once __DIR__ . '/features/cloudflare-analytics/cloudflare-analytics.php';
		require_once __DIR__ . '/features/error-reporting/error-reporting.php';
		require_once __DIR__ . '/features/first-posts-stream/first-posts-stream-helpers.php';
		require_once __DIR__ . '/features/font-smoothing-antialiased/font-smoothing-antialiased.php';
		// To avoid potential collisions with ETK.
		if ( ! class_exists( 'A8C\FSE\Help_Center' ) ) {
			require_once __DIR__ . '/features/help-center/class-help-center.php';
		}
		require_once __DIR__ . '/features/import-customizations/import-customizations.php';
		require_once __DIR__ . '/features/marketplace-products-updater/class-marketplace-products-updater.php';
		require_once __DIR__ . '/features/media/heif-support.php';
		require_once __DIR__ . '/features/site-editor-dashboard-link/site-editor-dashboard-link.php';
		require_once __DIR__ . '/features/wpcom-admin-dashboard/wpcom-admin-dashboard.php';
		require_once __DIR__ . '/features/wpcom-admin-bar/wpcom-admin-bar.php';
		require_once __DIR__ . '/features/wpcom-admin-menu/wpcom-admin-menu.php';
		require_once __DIR__ . '/features/wpcom-block-editor/class-jetpack-wpcom-block-editor.php';
		require_once __DIR__ . '/features/wpcom-block-editor/functions.editor-type.php';
		require_once __DIR__ . '/features/wpcom-sidebar-notice/wpcom-sidebar-notice.php';
		require_once __DIR__ . '/features/wpcom-themes/wpcom-themes.php';

		// Initializers, if needed.
		\Marketplace_Products_Updater::init();
		\Automattic\Jetpack\Classic_Theme_Helper\Main::init();
		\Automattic\Jetpack\Classic_Theme_Helper\Featured_Content::setup();

		// Only load the Calypsoify and Masterbar features on WoA sites.
		if ( class_exists( '\Automattic\Jetpack\Status\Host' ) && ( new \Automattic\Jetpack\Status\Host() )->is_woa_site() ) {
			\Automattic\Jetpack\Calypsoify\Jetpack_Calypsoify::get_instance();
			// This is temporary. After we cleanup Masterbar on WPCOM we should load Masterbar for Simple sites too.
			\Automattic\Jetpack\Masterbar\Main::init();
		}
		// Gets autoloaded from the Scheduled_Updates package.
		if ( class_exists( 'Automattic\Jetpack\Scheduled_Updates' ) ) {
			Scheduled_Updates::init();
		}
	}

	/**
	 * Laod ETK features that need higher priority than the ETK plugin.
	 * Can be moved back to load_features() once the feature no longer exists in the ETK plugin.
	 */
	public static function load_etk_features() {
		require_once __DIR__ . '/features/hide-homepage-title/hide-homepage-title.php';
		require_once __DIR__ . '/features/jetpack-global-styles/class-global-styles.php';
		require_once __DIR__ . '/features/mailerlite/subscriber-popup.php';
		require_once __DIR__ . '/features/override-preview-button-url/override-preview-button-url.php';
		require_once __DIR__ . '/features/paragraph-block-placeholder/paragraph-block-placeholder.php';
		require_once __DIR__ . '/features/tags-education/tags-education.php';
		require_once __DIR__ . '/features/wpcom-block-description-links/wpcom-block-description-links.php';
		require_once __DIR__ . '/features/wpcom-documentation-links/wpcom-documentation-links.php';
		require_once __DIR__ . '/features/wpcom-whats-new/wpcom-whats-new.php';
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

		/**
		 * Explicitly pass $markup = false in get_plugin_data to avoid indirectly calling wptexturize that could cause unintended side effects.
		 * See: https://developer.wordpress.org/reference/functions/get_plugin_data/
		 */
		$invalid_fse_version_active =
			is_plugin_active( 'full-site-editing/full-site-editing-plugin.php' ) &&
			version_compare( get_plugin_data( WP_PLUGIN_DIR . '/full-site-editing/full-site-editing-plugin.php', false )['Version'], '3.56084', '<' );

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
	 * Unbinds focusout event handler on #wp-admin-bar-menu-toggle introduced in WordPress 6.2.
	 *
	 * The focusout event handler is preventing the unified navigation from being closed on mobile.
	 */
	public static function unbind_focusout_on_wp_admin_bar_menu_toggle() {
		wp_add_inline_script( 'common', '(function($){ $(document).on("wp-responsive-activate", function(){ $(".is-nav-unification #wp-admin-bar-menu-toggle, .is-nav-unification #adminmenumain").off("focusout"); } ); }(jQuery) );' );
	}

	/**
	 * Determine whether to disable the comment experience.
	 *
	 * @param int $blog_id The blog ID.
	 * @return boolean
	 */
	private static function should_disable_comment_experience( $blog_id ) {
		$path_wp_for_teams = WP_CONTENT_DIR . '/lib/wpforteams/functions.php';

		if ( file_exists( $path_wp_for_teams ) ) {
			require_once $path_wp_for_teams;
		}

		// This covers both P2 and P2020 themes.
		$is_p2     = str_contains( get_stylesheet(), 'pub/p2' ) || function_exists( '\WPForTeams\is_wpforteams_site' ) && is_wpforteams_site( $blog_id );
		$is_forums = str_contains( get_stylesheet(), 'a8c/supportforums' ); // Not in /forums.

		$verbum_option_enabled = get_blog_option( $blog_id, 'enable_verbum_commenting', true );

		if ( empty( $verbum_option_enabled ) ) {
			return true;
		}

		// Don't load any comment experience in the Reader, GlotPress, wp-admin, or P2.
		return ( 1 === $blog_id || TRANSLATE_BLOG_ID === $blog_id || is_admin() || $is_p2 || $is_forums );
	}

	/**
	 * Load Verbum Comments.
	 */
	public static function load_verbum_comments() {
		if ( class_exists( 'Verbum_Comments' ) ) {
			return;
		} else {
			$blog_id = get_current_blog_id();
			// Jetpack loads Verbum though an iframe from jetpack.wordpress.com.
			// So we need to check the GET request for the blogid.
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			if ( isset( $_GET['blogid'] ) ) {
				$blog_id = intval( $_GET['blogid'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			}
			if ( self::should_disable_comment_experience( $blog_id ) ) {
				return;
			}
			require_once __DIR__ . '/features/verbum-comments/class-verbum-comments.php';
			new \Automattic\Jetpack\Verbum_Comments();
		}
	}

	/**
	 * Load Verbum Comments Settings.
	 */
	public static function load_verbum_comments_admin() {
		require_once __DIR__ . '/features/verbum-comments/assets/class-verbum-admin.php';
		new \Automattic\Jetpack\Verbum_Admin();
	}

	/**
	 * Load WPCOM Command Palette.
	 *
	 * @return void
	 */
	public static function load_wpcom_command_palette() {
		if ( is_agency_managed_site() || ! current_user_has_wpcom_account() ) {
			return;
		}
		require_once __DIR__ . '/features/wpcom-command-palette/wpcom-command-palette.php';
	}

	/**
	 * Load Odyssey Stats in Simple sites.
	 */
	public static function load_wpcom_simple_odyssey_stats() {
		if ( get_option( 'wpcom_admin_interface' ) === 'wp-admin' ) {
			require_once __DIR__ . '/features/wpcom-simple-odyssey-stats/wpcom-simple-odyssey-stats.php';
		}
	}

	/**
	 * Load WPCOM Admin Interface.
	 *
	 * @return void
	 */
	public static function load_wpcom_admin_interface() {
		require_once __DIR__ . '/features/wpcom-admin-interface/wpcom-admin-interface.php';
	}

	/**
	 * Load WPCOM Site Management widget.
	 */
	public static function load_wpcom_site_management_widget() {
		if ( is_agency_managed_site() || ! current_user_has_wpcom_account() || ! current_user_can( 'manage_options' ) ) {
			return;
		}
		if ( get_option( 'wpcom_admin_interface' ) === 'wp-admin' ) {
			require_once __DIR__ . '/features/wpcom-site-management-widget/class-wpcom-site-management-widget.php';
		}
	}

	/**
	 * Load Replace Site Visibility feature.
	 */
	public static function load_replace_site_visibility() {
		require_once __DIR__ . '/features/replace-site-visibility/replace-site-visibility.php';
	}

	/**
	 * Load the Jetpack Custom CSS feature.
	 */
	public static function load_custom_css() {
		require_once __DIR__ . '/features/custom-css/custom-css/preprocessors.php';
		require_once __DIR__ . '/features/custom-css/custom-css.php';
	}
}
