<?php
/**
 * Plugin Name: WordPress.com Site Helper
 * Description: A helper for connecting WordPress.com sites to external host infrastructure.
 * Version: 2.4.126
 * Author: Automattic
 * Author URI: http://automattic.com/
 */

// Increase version number if you change something in wpcomsh.
define( 'WPCOMSH_VERSION', '2.4.126' );

// If true, Typekit fonts will be available in addition to Google fonts
add_filter( 'jetpack_fonts_enable_typekit', '__return_true' );

require_once( 'constants.php' );
require_once( 'functions.php' );
require_once( 'i18n.php' );

require_once( 'plugin-hotfixes.php' );

require_once( 'footer-credit/footer-credit.php' );
require_once( 'storefront/storefront.php' );
require_once( 'custom-colors/colors.php' );

// Interoperability with the core WordPress data privacy functionality (See also "GDPR")
require_once( 'privacy/participating-plugins.php' );

// Functionality to make sites private and only accessible to members with appropriate capabilities
require_once 'private-site/private-site.php';

// Updates customizer Save/Publish labels to avoid confusion on launching vs saving changes on a site.
require_once ( 'customizer-fixes/customizer-fixes.php' );

require_once( 'class.wpcomsh-log.php' );
require_once( 'safeguard/plugins.php' );
require_once( 'logo-tool/logo-tool.php' );
require_once( 'jetpack-token-error-header/jetpack-token-header-error.php');

/**
 * WP.com Widgets (in alphabetical order)
 */
require_once( 'widgets/aboutme.php' );
require_once( 'widgets/author-grid.php' );
require_once( 'widgets/freshly-pressed.php' );
require_once( 'widgets/gravatar.php' );
require_once( 'widgets/instagram/instagram.php' );
require_once( 'widgets/i-voted.php' );
require_once( 'widgets/music-player.php' );
require_once( 'widgets/posts-i-like.php' );
require_once( 'widgets/recent-comments-widget.php' );
require_once( 'widgets/reservations.php' );

// WP.com Category Cloud widget
require_once( 'widgets/category-cloud.php' );
// Override core tag cloud widget to add a settable `limit` parameter
require_once( 'widgets/tag-cloud-widget.php' );

require_once( 'widgets/tlkio/tlkio.php' );
require_once( 'widgets/top-clicks.php' );
require_once( 'widgets/top-rated.php' );
require_once( 'widgets/twitter.php' );

// autoload composer sourced plugins
require_once( 'vendor/autoload.php' );

// REST API
require_once( 'endpoints/rest-api.php' );

// Load feature plugin overrides
require_once( 'feature-plugins/full-site-editing.php' );
require_once( 'feature-plugins/gutenberg-mods.php' );
require_once( 'feature-plugins/autosave-revision.php' );
require_once( 'feature-plugins/seo.php' );

if ( defined( 'WP_CLI' ) && WP_CLI ) {
	require_once WPCOMSH__PLUGIN_DIR_PATH . '/class.cli-commands.php';
}

require_once( 'wpcom-migration-helpers/site-migration-helpers.php');


require_once WPCOMSH__PLUGIN_DIR_PATH . '/class.jetpack-plugin-compatibility.php';

const WPCOM_CORE_ATOMIC_PLUGINS = [
	'jetpack/jetpack.php',
	'akismet/akismet.php',
];
const WPCOM_FEATURE_PLUGINS = [
	'coblocks/class-coblocks.php',
	'full-site-editing/full-site-editing-plugin.php',
	'gutenberg/gutenberg.php',
	'layout-grid/index.php',
	'page-optimize/page-optimize.php',
];

if ( class_exists( 'Jetpack_Plugin_Compatibility' ) ) {
	$wpcomsh_incompatible_plugins = array(
		// "reset" - break/interfere with provided functionality
		'advanced-database-cleaner/advanced-db-cleaner.php' => '"advanced-database-cleaner" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'advanced-reset-wp/advanced-reset-wp.php' => '"advanced-reset-wp" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'advanced-wp-reset/advanced-wp-reset.php' => '"advanced-wp-reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'autoptimize/autoptimize.php' => '"autoptimize" has been deactivated, it interferes with site operation and is not supported on WordPress.com.',
		'backup/backup.php' => '"backup" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'better-wp-security/better-wp-security.php' => '"better-wp-security" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'cf7-pipedrive-integration/class-cf7-pipedrive.php' => '"cf7-pipedrive-integration" has been deactivated, it interferes with site operation and is not supported on WordPress.com.',
		'database-browser/database-browser.php' => '"database-browser" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'duplicator/duplicator.php' => '"duplicator" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'extended-wp-reset/extended-wp-reset.php' => '"extended-wp-reset" has been deactivated, it interferes with site operation and is not supported on WordPress.com.',
		'file-manager-advanced/file_manager_advanced.php' => '"file-manager-advanced" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'file-manager/file-manager.php' => '"file-manager" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'plugins-garbage-collector/plugins-garbage-collector.php' => '"plugins-garbage-collector" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'post-type-switcher/post-type-switcher.php' => '"post-type-switcher" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'reset-wp/reset-wp.php' => '"reset-wp" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'secure-file-manager/secure-file-manager.php' => '"secure-file-manager" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'ultimate-wp-reset/ultimate-wordpress-reset.php' => '"ultimate-wp-reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'username-changer/username-changer.php' => '"username-changer" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'username-updater/username-updater.php' => '"username-updater" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wd-youtube/wd-youtube.php' => '"wd-youtube" has been deactivated, it interferes with site operation and is not supported on WordPress.com.',
		'wordpress-database-reset/wp-reset.php' => '"wordpress-database-reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wordpress-reset/wordpress-reset.php' => '"wordpress-reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wp-automatic/wp-automatic.php' => '"wp-automatic" has been deactivated, it interferes with site operation and is not supported on WordPress.com.',
		'wp-clone-by-wp-academy/wpclone.php' => '"wp-clone-by-wp-academy" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wp-config-file-editor/wp-config-file-editor.php' => '"wp-config-file-editor" has been deactivated, it messes up data necessary to manage your site and is not supported on WordPress.com.',
		'wp-dbmanager/wp-dbmanager.php' => '"wp-dbmanager" has been deactivated, it messes up data necessary to manage your site and is not supported on WordPress.com.',
		'wp-file-manager/file_folder_manager.php' => '"wp-file-manager" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wp-prefix-changer/index.php' => '"wp-prefix-changer" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wp-reset/wp-reset.php' => '"wp-reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wpmu-database-reset/wpmu-database-reset.php' => '"wpmu-database-reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wps-hide-login/wps-hide-login.php' => '"wps-hide-login" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'z-inventory-manager/z-inventory-manager.php' => '"z-inventory-manager" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wp-uninstaller-by-azed/wp-uninstaller-by-azed.php' => '"wp-uninstaller-by-azed" is not supported on WordPress.com.',

		// backup
		'backup-wd/backup-wd.php' => '"backup-wd" has been deactivated, WordPress.com handles managing your site backups for you.',
		'backupwordpress/backupwordpress.php' => '"backupwordpress" has been deactivated, WordPress.com handles managing your site backups for you.',
		'backwpup/backwpup.php' => '"backwpup" has been deactivated, WordPress.com handles managing your site backups for you.',
		'wp-db-backup/wp-db-backup.php' => '"wp-db-backup" has been deactivated, WordPress.com handles managing your site backups for you.',

		// caching
		'cache-enabler/cache-enabler.php' => '"cache-enabler" has been deactivated, WordPress.com automatically handles caching for your site.',
		'comet-cache/comet-cache.php' => '"comet-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'hyper-cache/plugin.php' => '"hyper-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'powered-cache/powered-cache.php' => '"powered-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'jch-optimize/jch-optimize.php' => '"jch-optimize" has been deactivated, WordPress.com automatically handles caching for your site.',
		'quick-cache/quick-cache.php' => '"quick-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'w3-total-cache/w3-total-cache.php' => '"w3-total-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'wp-cache/wp-cache.php' => '"wp-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'wp-fastest-cache/wpFastestCache.php' => '"wp-fastest-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'wp-rocket/wp-rocket.php' => '"wp-rocket" has been deactivated, WordPress.com automatically handles caching for your site.',
		'wp-speed-of-light/wp-speed-of-light.php' => '"wp-speed-of-light" has been deactivated, WordPress.com automatically handles caching for your site.',
		'wp-super-cache/wp-cache.php' => '"wp-super-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'sg-cachepress/sg-cachepress.php' => '"sg-cachepress" has been deactivated, WordPress.com automatically handles caching for your site.',

		// sql heavy
		'another-wordpress-classifieds-plugin/awpcp.php' => '"another-wordpress-classifieds-plugin" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'broken-link-checker/broken-link-checker.php' => '"broken-link-checker" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'leads/leads.php' => '"leads" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'native-ads-adnow/adnow-widget.php' => '"native-ads-now" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'ol_scrapes/ol_scrapes.php' => '"ol_scrapes" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'page-visit-counter/page-visit-counter.php' => '"page-visit-counter" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',
		'post-views-counter/post-views-counter.php' => '"post-views-counter" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',
		'tokenad/token-ad.php' => '"tokenad" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'top-10/top-10.php' => '"top-10" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'userpro/index.php' => '"userpro" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wordpress-popular-posts/wordpress-popular-posts.php' => '"wordpress-popular-posts" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-cerber/wp-cerber.php' => '"wp-cerber" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-inject/wpinject.php' => '"wp-inject" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-postviews/wp-postviews.php' => '"wp-postviews" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',
		'wp-rss-aggregator/wp-rss-aggregator.php' => '"wp-rss-aggregator" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-rss-feed-to-post/wp-rss-feed-to-post.php' => '"wp-rss-feed-to-post" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-rss-wordai/wp-rss-wordai.php' => '"wp-rss-wordai" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-session-manager/wp-session-manager.php' => '"wp-session-manager" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-slimstat/wp-slimstat.php' => '"wp-slimstat" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',
		'wp-statistics/wp-statistics.php' => '"wp-statistics" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',
		'wp-ulike/wp-ulike.php' => '"wp-ulike" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',
		'WPRobot5/wprobot.php' => '"WPRobot5" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',

		// security
		'wordfence/wordfence.php' => '"wordfence" has been deactivated, "security" related plugins may break your site or cause performance issues for your site and are not supported on WordPress.com.',
		'wp-simple-firewall/wp-simple-firewall.php' => '"wp-simple-firewall" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',

		// spam
		'e-mail-broadcasting/e-mail-broadcasting.php' => '"e-mail-broadcasting" has been deactivated, plugins that support sending e-mails in bulk are not supported on WordPress.com.',
		'mailit/mailit.php' => '"mailit"has been deactivated, plugins that support sending e-mails in bulk are not supported on WordPress.com.',
		'send-email-from-admin/send-email-from-admin.php' => '"send-email-from-admin" has been deactivated, plugins that support sending e-mails in bulk are not supported on WordPress.com.',

		// cloning/staging
		'wp-staging/wp-staging.php' => 'wp-staging plugins delete data necessary to manage your site and are not supported on WordPress.com. wp-staging has been deactivated.',

		// misc
		'adult-mass-photos-downloader/adult-mass-photos-downloader.php' => '"adult-mass-photos-downloader" is not supported on WordPress.com.',
		'adult-mass-videos-embedder/adult-mass-videos-embedder.php' => '"adult-mass-videos-embedder" is not supported on WordPress.com.',
		'ari-adminer/ari-adminer.php' => '"ari-adminer" is not supported on WordPress.com.',
		'automatic-video-posts' => '"automatic-video-posts" is not supported on WordPress.com.',
		'bwp-minify/bwp-minify.php' => '"bwp-minify" is not supported on WordPress.com.',
		'clearfy/clearfy.php' => '"clearfy" is not supported on WordPress.com.',
		'cornerstone/main.php' => '"cornerstone" is not supported on WordPress.com.',
		'cryptocurrency-pricing-list/cryptocurrency-pricing-list-and-ticker.php' => '"cryptocurrency-pricing-list" is not supported on WordPress.com.',
		'event-espresso-decaf/espresso.php' => '"event-espresso-decaf" is not supported on WordPress.com.',
		'facetwp-manipulator/facetwp-manipulator.php' => '"facetwp-manipulator" is not supported on WordPress.com.',
		'fast-velocity-minify/fvm.php' => '"fast-velocity-minify" is not supported on WordPress.com.',
		'nginx-helper/nginx-helper.php' => '"nginx-helper" is not supported on WordPress.com.',
		'porn-embed/Porn-Embed.php' => '"porn-embed" is not supported on WordPress.com.',
		'really-simple-ssl/rlrsssl-really-simple-ssl.php' => '"really-simple-ssl" is not supported on WordPress.com.',
		'robo-gallery/robogallery.php' => '"robo-gallery" is not supported on WordPress.com.',
		'speed-contact-bar/speed-contact-bar.php' => '"speed-contact-bar" is not supported on WordPress.com.',
		'unplug-jetpack/unplug-jetpack.php' => '"unplug-jetpack" is not supported on WordPress.com.',
		'video-importer/video-importer.php' => '"video-importer" is not supported on WordPress.com.',
		'woozone/plugin.php' => '"woozone" is not supported on WordPress.com.',
		'wp-cleanfix/index.php' => '"wp-cleanfix" is not supported on WordPress.com.',
		'wp-file-upload/wordpress_file_upload.php' => '"wp-file-upload" is not supported on WordPress.com.',
		'wp-monero-miner-pro/monero-miner-pro.php' => '"wp-monero-miner-pro" is not supported on WordPress.com.',
		'wp-monero-miner-using-coin-hive/wp-coin-hive.php' => '"wp-monero-miner-using-coin-hive" is not supported on WordPress.com.',
		'wp-optimize-by-xtraffic/wp-optimize-by-xtraffic.php' => '"wp-optimize-by-xtraffic" is not supported on WordPress.com.',
		'wpematico/wpematico.php' => '"wpematico" is not supported on WordPress.com.',
		'zapp-proxy-server/zapp-proxy-server.php' => '"zapp-proxy-server" is not supported on WordPress.com.',
		'propellerads-official/propeller-ads.php' => '"propellerads-official" is not supported on WordPress.com.',
		'p3/p3.php' => '"p3" is not supported on WordPress.com.',
		'yuzo-related-post/yuzo_related_post.php' => '"yuzo-related-post" is not supported on WordPress.com.',
	);
	new Jetpack_Plugin_Compatibility( $wpcomsh_incompatible_plugins );
}

function wpcomsh_remove_amp_wpadmin_notices() {
	remove_action( 'admin_notices', '_amp_incorrect_plugin_slug_admin_notice' );
}
add_action(
	'admin_head',
	'wpcomsh_remove_amp_wpadmin_notices',
	9 // Priority 9 to run before default priority
);

function wpcomsh_remove_vaultpress_wpadmin_notices() {
	if ( ! class_exists( 'VaultPress' ) ) {
		return;
	}

	$vp_instance = VaultPress::init();

	remove_action( 'user_admin_notices', array( $vp_instance, 'activated_notice' ) );
	remove_action( 'admin_notices', array( $vp_instance, 'activated_notice' ) );

	remove_action( 'user_admin_notices', array( $vp_instance, 'connect_notice' ) );
	remove_action( 'admin_notices', array( $vp_instance, 'connect_notice' ) );

	remove_action( 'user_admin_notices', array( $vp_instance, 'error_notice' ) );
	remove_action( 'admin_notices', array( $vp_instance, 'error_notice' ) );
}
add_action(
	'admin_head',
	'wpcomsh_remove_vaultpress_wpadmin_notices',
	11 // Priority 11 so it runs after VaultPress `admin_head` hook
);

function wpcomsh_managed_plugins_action_links() {
	foreach ( WPCOM_CORE_ATOMIC_PLUGINS as $plugin ) {
		if ( wpcomsh_is_managed_plugin( $plugin ) ) {
			add_filter(
				"plugin_action_links_{$plugin}",
				'wpcomsh_hide_plugin_deactivate_edit_links'
			);

			add_action(
				"after_plugin_row_{$plugin}",
				'wpcomsh_show_plugin_auto_managed_notice',
				10,
				2
			);
		}
	}

	foreach ( WPCOM_FEATURE_PLUGINS as $plugin ) {
		if ( wpcomsh_is_managed_plugin( $plugin ) ) {
			add_action(
				"after_plugin_row_{$plugin}",
				'wpcomsh_show_plugin_auto_managed_notice',
				10,
				2
			);
		}
	}
}
add_action( 'admin_init', 'wpcomsh_managed_plugins_action_links' );

// Remove hooks that add the plugins autoupdate column. They are ineffective on Atomic sites.
function wpcomsh_remove_plugin_autoupdates() {
	if ( ! class_exists( 'Jetpack_Calypsoify' ) ) {
		return;
	}
	remove_action( 'manage_plugins_columns', [ Jetpack_Calypsoify::getInstance(), 'manage_plugins_columns_header' ] );
	remove_action( 'manage_plugins_custom_column', [ Jetpack_Calypsoify::getInstance(), 'manage_plugins_custom_column' ] );
	remove_action( 'bulk_actions-plugins', [ Jetpack_Calypsoify::getInstance(), 'bulk_actions_plugins' ] );
	remove_action( 'handle_bulk_actions-plugins', [ Jetpack_Calypsoify::getInstance(), 'handle_bulk_actions_plugins' ] );
}
add_action( 'admin_init', 'wpcomsh_remove_plugin_autoupdates' );

// Removed unused capability (it was only used for the autoupdates columns).
function wpcomsh_remove_autoupdates_meta_cap( $caps, $cap ) {
	return 'jetpack_manage_autoupdates' === $cap ? array( 'do_not_allow' ) : $caps;
}
add_filter( 'map_meta_cap', 'wpcomsh_remove_autoupdates_meta_cap', 10, 2 );

function wpcomsh_hide_update_notice_for_managed_plugins() {
	$plugin_files = array_keys( get_plugins() );
	foreach ( $plugin_files as $plugin ) {
		if ( wpcomsh_is_managed_plugin( $plugin ) ) {
			remove_action( "after_plugin_row_{$plugin}", 'wp_plugin_update_row', 10, 2 );
		}
	}
}
add_action( 'load-plugins.php', 'wpcomsh_hide_update_notice_for_managed_plugins', 25 );

function wpcomsh_is_managed_plugin( $plugin_file ) {
	if ( defined( 'IS_ATOMIC' ) && IS_ATOMIC ) {
		if ( class_exists( 'Atomic_Platform_Mu_Plugin' ) ) {
			return ( new Atomic_Platform_Mu_Plugin() )->is_managed_plugin( $plugin_file );
		}
	}

	return false;
}

function hide_vaultpress_from_plugin_list() {
	  global $wp_list_table;
	  unset( $wp_list_table->items['vaultpress/vaultpress.php'] );
}
add_action( 'pre_current_active_plugins', 'hide_vaultpress_from_plugin_list' );

function wpcomsh_hide_wpcomsh_plugin_links() {
	return array();
}

function wpcomsh_hide_plugin_deactivate_edit_links( $links ) {
	if ( ! is_array( $links ) ) {
		return array();
	}

	unset( $links['deactivate'] );
	unset( $links['edit'] );

	return $links;
}

function wpcomsh_show_plugin_auto_managed_notice( $file, $plugin_data ) {
	$plugin_name = 'The plugin';
	$active      = is_plugin_active( $file ) ? ' active' : '';

	if ( array_key_exists( 'Name', $plugin_data ) ) {
		$plugin_name = $plugin_data['Name'];
	}

	$message = sprintf( __( '%s is automatically managed for you.', 'wpcomsh' ), $plugin_name );

	if ( in_array( $file, WPCOM_FEATURE_PLUGINS, true ) ) {
		$message = esc_html__( 'This plugin was installed by WordPress.com and provides features offered in your plan subscription.', 'wpcomsh' );
	}

	echo '<tr class="plugin-update-tr' . $active . '">' .
			'<td colspan="4" class="plugin-update colspanchange">' .
				'<div class="notice inline notice-success notice-alt">' .
					"<p>{$message}</p>" .
				'</div>' .
			'</td>' .
		'</tr>';
}

function wpcomsh_register_theme_hooks() {
	add_filter(
		'jetpack_wpcom_theme_skip_download',
		'wpcomsh_jetpack_wpcom_theme_skip_download',
		10,
		2
	);

	add_filter(
		'jetpack_wpcom_theme_delete',
		'wpcomsh_jetpack_wpcom_theme_delete',
		10,
		2
	);
}
add_action( 'init', 'wpcomsh_register_theme_hooks' );

/**
 * Provides a favicon fallback in case it's undefined.
 *
 * @param string $url Site Icon URL.
 * @return string Site Icon URL.
 */
function wpcomsh_site_icon_url( $url ) {
	if ( empty( $url ) ) {
		$url = 'https://s0.wp.com/i/webclip.png';
	}

	return $url;
}
add_filter( 'get_site_icon_url', 'wpcomsh_site_icon_url' );

/**
 * Filters a user's capabilities depending on specific context and/or privilege.
 *
 * @param array  $required_caps Returns the user's actual capabilities.
 * @param string $cap           Capability name.
 * @return array Primitive caps.
 */
function wpcomsh_map_caps( $required_caps, $cap ) {
	if ( 'edit_themes' === $cap ) {
		$theme = wp_get_theme();
		if ( wpcomsh_is_wpcom_premium_theme( $theme->get_stylesheet() )
			&& 'Automattic' !== $theme->get( 'Author' ) ) {
			$required_caps[] = 'do_not_allow';
		}
	}
	return $required_caps;
}
add_action( 'map_meta_cap', 'wpcomsh_map_caps', 10, 2 );

/**
 * Don't allow site owners to be removed.
 *
 * @param array $allcaps An array of all the user's capabilities.
 * @param array $caps    Actual capabilities for meta capability.
 * @param array $args    Optional parameters passed to has_cap(), typically object ID.
 * @return array
 */
function wpcomsh_prevent_owner_removal( $allcaps, $caps, $args ) {
	// Trying to edit or delete a user other than yourself?
	if ( in_array( $args[0], [ 'edit_user', 'delete_user', 'remove_user', 'promote_user' ], true ) ) {
		$jetpack = get_option( 'jetpack_options' );

		if ( ! empty( $jetpack['master_user'] ) && $args[2] == $jetpack['master_user'] ) {
			return [];
		}
	}

	return $allcaps;
}
add_filter( 'user_has_cap', 'wpcomsh_prevent_owner_removal', 10, 3 );

function wpcomsh_remove_theme_delete_button( $prepared_themes ) {

	foreach ( $prepared_themes as $theme_slug => $theme_data ) {
		if ( wpcomsh_is_wpcom_theme( $theme_slug ) || wpcomsh_is_symlinked_storefront_theme( $theme_slug ) ) {
			$prepared_themes[ $theme_slug ]['actions']['delete'] = '';
		}
	}

	return $prepared_themes;
}
add_filter( 'wp_prepare_themes_for_js', 'wpcomsh_remove_theme_delete_button' );


function wpcomsh_jetpack_wpcom_theme_skip_download( $result, $theme_slug ) {

	$theme_type = wpcomsh_get_wpcom_theme_type( $theme_slug );

	// If we are dealing with a non WPCom theme, don't interfere.
	if ( ! $theme_type ) {
		return false;
	}

	if ( wpcomsh_is_theme_symlinked( $theme_slug ) ) {
		error_log( "WPComSH: WPCom theme with slug: {$theme_slug} is already installed/symlinked." );

		return new WP_Error(
			'wpcom_theme_already_installed',
			'The WPCom theme is already installed/symlinked.'
		);
	}

	$was_theme_symlinked = wpcomsh_symlink_theme( $theme_slug, $theme_type );

	if ( is_wp_error( $was_theme_symlinked ) ) {
		return $was_theme_symlinked;
	}

	wpcomsh_delete_theme_cache( $theme_slug );

	// Skip the theme installation as we've "installed" (symlinked) it manually above.
	add_filter(
		'jetpack_wpcom_theme_install',
		function() use ( $was_theme_symlinked ) {
			return $was_theme_symlinked;
		},
		10,
		2
	);

	// If the installed WPCom theme is a child theme, we need to symlink its parent theme
	// as well.
	if ( wpcomsh_is_wpcom_child_theme( $theme_slug ) ) {
		$was_parent_theme_symlinked = wpcomsh_symlink_parent_theme( $theme_slug );

		if ( ! $was_parent_theme_symlinked ) {
			return new WP_Error(
				'wpcom_theme_installation_falied',
				"Can't install specified WPCom theme. Check error log for more details."
			);
		}
	}

	return true;
}

function wpcomsh_jetpack_wpcom_theme_delete( $result, $theme_slug ) {

	if (
		! wpcomsh_is_wpcom_theme( $theme_slug ) ||
		! wpcomsh_is_theme_symlinked( $theme_slug )
	) {
		return false;
	}

	// If a theme is a child theme, we first need to unsymlink the parent theme.
	if ( wpcomsh_is_wpcom_child_theme( $theme_slug ) ) {
		$was_parent_theme_unsymlinked = wpcomsh_delete_symlinked_parent_theme( $theme_slug );

		if ( ! $was_parent_theme_unsymlinked ) {
			return new WP_Error(
				'wpcom_theme_deletion_falied',
				"Can't delete specified WPCom theme. Check error log for more details."
			);
		}
	}

	$was_theme_unsymlinked = wpcomsh_delete_symlinked_theme( $theme_slug );

	return $was_theme_unsymlinked;
}

/**
 * Filter attachment URLs if the 'wpcom_attachment_subdomain' option is present.
 * Local image files will be unaffected, as they will pass a file_exists check.
 * Files stored remotely will be filtered to have the correct URL.
 *
 * Once the files have been transferred, the 'wpcom_attachment_subdomain' will
 * be removed, preventing further stats.
 *
 * @param string $url The attachment URL
 * @param int    $post_id The post id
 * @return string The filtered attachment URL
 */
function wpcomsh_get_attachment_url( $url, $post_id ) {
	$attachment_subdomain = get_option( 'wpcom_attachment_subdomain' );
	if ( $attachment_subdomain ) {
		if ( $file = get_post_meta( $post_id, '_wp_attached_file', true ) ) {
			$local_file = WP_CONTENT_DIR . '/uploads/' . $file;
			if ( ! file_exists( $local_file ) ) {
				return esc_url( 'https://' . $attachment_subdomain . '/' . $file );
			}
		}
	}
	return $url;
}
add_filter( 'wp_get_attachment_url', 'wpcomsh_get_attachment_url', 11, 2 );
/**
 * When WordPress.com passes along an expiration for auth cookies and it is smaller
 * than the value set by Jetpack by default (YEAR_IN_SECONDS), use the smaller
 * value.
 *
 * @param int $seconds The cookie expiration in seconds
 * @return int The filtered cookie expiration in seconds
 */
function wpcomsh_jetpack_sso_auth_cookie_expiration( $seconds ) {
	if ( isset( $_GET['expires'] ) ) {
		$expires = absint( $_GET['expires'] );

		if ( ! empty( $expires ) && $expires < $seconds ) {
			$seconds = $expires;
		}
	}
	return intval( $seconds );
}
add_filter( 'jetpack_sso_auth_cookie_expiration', 'wpcomsh_jetpack_sso_auth_cookie_expiration' );

/**
 * If a user is logged in to WordPress.com, log him in automatically to wp-login
 */
add_filter( 'jetpack_sso_bypass_login_forward_wpcom', '__return_true' );

/**
 * When a request is made to Jetpack Themes API, we need to distinguish between a WP.com theme
 * and a WP.org theme in the response. This function adds/modifies the `theme_uri` field of a theme
 * changing it to `https://wordpress.com/theme/{$theme_slug}` if a theme is a WP.com one.
 *
 * @param array $formatted_theme Array containing the Jetpack Themes API data to be sent to wpcom
 *
 * @return array The original or modified theme info array
 */
function wpcomsh_add_wpcom_suffix_to_theme_endpoint_response( $formatted_theme ) {
	if ( ! array_key_exists( 'id', $formatted_theme ) ) {
		return $formatted_theme;
	}

	$theme_slug = $formatted_theme['id'];
	$is_storefront = 'storefront' === $theme_slug;

	if ( wpcomsh_is_theme_symlinked( $theme_slug ) && ! $is_storefront ) {
		$formatted_theme['theme_uri'] = "https://wordpress.com/theme/{$theme_slug}";
	}

	return $formatted_theme;
}
add_filter( 'jetpack_format_theme_details', 'wpcomsh_add_wpcom_suffix_to_theme_endpoint_response' );

/**
 * Returns the value for the `at_wpcom_premium_theme` option, which
 * makes sure a stylesheet is returned only if the current theme has been
 * symlinked and is a WPCOM premium theme.
 *
 * @return string The wpcom premium theme stylesheet
 */
function wpcomsh_handle_atomic_premium_theme_option() {
	$stylesheet = wp_get_theme()->get_stylesheet();
	if ( wpcomsh_is_theme_symlinked( $stylesheet )
		&& wpcomsh_is_wpcom_premium_theme( $stylesheet ) ) {
			return sprintf( 'premium/%s', $stylesheet );
	}

	return FALSE;
}
add_filter( 'pre_option_at_wpcom_premium_theme', 'wpcomsh_handle_atomic_premium_theme_option' );

function wpcomsh_disable_bulk_plugin_deactivation( $actions ) {
	if ( array_key_exists( 'deactivate-selected', $actions ) ) {
		unset( $actions['deactivate-selected'] );
	}

	return $actions;
}
add_filter( 'bulk_actions-plugins', 'wpcomsh_disable_bulk_plugin_deactivation' );

function wpcomsh_admin_enqueue_style() {
	wp_enqueue_style(
		'wpcomsh-admin-style',
		plugins_url( 'assets/admin-style.css', __FILE__ ),
		null,
		WPCOMSH_VERSION
	);
}
add_action( 'admin_enqueue_scripts', 'wpcomsh_admin_enqueue_style', 999 );

function wpcomsh_allow_custom_wp_options( $options ) {
	// For storing AT options.
	$options[] = 'at_options';
	$options[] = 'at_options_logging_on';
	$options[] = 'at_wpcom_premium_theme';
	$options[] = 'jetpack_fonts';
	$options[] = 'site_logo';
	$options[] = 'footercredit';

	return $options;
}
add_filter( 'jetpack_options_whitelist', 'wpcomsh_allow_custom_wp_options' );

add_filter( 'jetpack_site_automated_transfer', '__return_true' );

function check_site_has_pending_automated_transfer() {
	return get_option( 'has_pending_automated_transfer' );
}

add_filter( 'jetpack_site_pending_automated_transfer', 'check_site_has_pending_automated_transfer' );

/**
 * Load a WordPress.com theme compat file, if it exists.
 */
function wpcomsh_load_theme_compat_file() {
	if ( ( ! defined( 'WP_INSTALLING' ) || 'wp-activate.php' === $GLOBALS['pagenow'] ) ) {
		// Many wpcom.php files call $themecolors directly. Ease the pain.
		global $themecolors;

		$template_path   = get_template_directory();
		$stylesheet_path = get_stylesheet_directory();
		$file            = '/inc/wpcom.php';

		// Look also in /includes as alternate location, since premium theme partners may use that convention.
		if ( ! file_exists( $template_path . $file ) && ! file_exists( $stylesheet_path . $file ) ) {
			$file = '/includes/wpcom.php';
		}

		// Include 'em. Child themes first, just like core.
		if ( $template_path !== $stylesheet_path && file_exists( $stylesheet_path . $file ) ) {
			include_once( $stylesheet_path . $file );
		}

		if ( file_exists( $template_path . $file ) ) {
			include_once( $template_path . $file );
		}
	}
}

// Hook early so that after_setup_theme can still be used at default priority.
add_action( 'after_setup_theme', 'wpcomsh_load_theme_compat_file', 0 );

/**
 * Filter plugins_url for when __FILE__ is outside of WP_CONTENT_DIR
 *
 * @param string $url    The complete URL to the plugins directory including scheme and path.
 * @param string $path   Path relative to the URL to the plugins directory. Blank string
 *                       if no path is specified.
 * @param string $plugin The plugin file path to be relative to. Blank string if no plugin
 *                       is specified.
 * @return string Filtered URL.
 */
function wpcomsh_symlinked_plugins_url( $url, $path, $plugin ) {
	$url = preg_replace(
		'#((?<!/)/[^/]+)*/wp-content/plugins/wordpress/plugins/wpcomsh/([^/]+)/#',
		'/wp-content/mu-plugins/wpcomsh/',
		$url
	);

	if ( 'woocommerce-product-addons.php' === $plugin || 'woocommerce-gateway-stripe.php' === $plugin ) {
		$url = home_url( '/wp-content/plugins/' . basename( $plugin, '.php' ) );
	}

	return $url;
}
add_filter( 'plugins_url', 'wpcomsh_symlinked_plugins_url', 0, 3 );

function wpcomsh_activate_masterbar_module() {
	if ( ! defined( 'JETPACK__VERSION' ) ) {
		return;
	}

	// Masterbar was introduced in Jetpack 4.8
	if ( version_compare( JETPACK__VERSION, '4.8', '<' ) ) {
		return;
	}

	if ( ! Jetpack::is_module_active( 'masterbar' ) ) {
		Jetpack::activate_module( 'masterbar', false, false );
	}
}
add_action( 'init', 'wpcomsh_activate_masterbar_module', 0, 0 );

function require_lib( $slug ) {
	if ( ! preg_match( '|^[a-z0-9/_.-]+$|i', $slug ) ) {
		return;
	}

	// these are whitelisted libraries that Jetpack has
	$in_jetpack = array(
		'tonesque',
		'class.color',
	);

	// hand off to `jetpack_require_lib`, if possible.
	if ( in_array( $slug, $in_jetpack ) && function_exists( 'jetpack_require_lib' ) ) {
		return jetpack_require_lib( $slug );
	}

	$basename = basename( $slug );

	$lib_dir = __DIR__ . '/lib';

	/**
	 * Filter the location of the library directory.
	 *
	 * @since 2.5.0
	 *
	 * @param str $lib_dir Path to the library directory.
	 */
	$lib_dir = apply_filters( 'require_lib_dir', $lib_dir );

	$choices = array(
		"$lib_dir/$slug.php",
		"$lib_dir/$slug/0-load.php",
		"$lib_dir/$slug/$basename.php",
	);
	foreach ( $choices as $file_name ) {
		if ( is_readable( $file_name ) ) {
			require_once $file_name;
			return;
		}
	}
}

/**
 * Provides a fallback Google Maps API key when otherwise not configured by the
 * user. This is subject to a usage quota.
 *
 * @see p5j4vm-1gT-p2
 *
 * @param string $api_key Google Maps API key
 * @return string Google Maps API key
 */
function wpcomsh_google_maps_api_key( $api_key ) {
	// Fall back to the dotcom API key if the user has not set their own.
	return ( empty( $api_key ) ) ? 'AIzaSyCq4vWNv6eCGe2uvhPRGWQlv80IQp8dwTE' : $api_key;
}
add_filter( 'jetpack_google_maps_api_key', 'wpcomsh_google_maps_api_key' );

/**
 * Links were removed in 3.5 core, but we've kept them active on dotcom.
 * This will expose both the Links section, and the widget.
 */
add_filter( 'pre_option_link_manager_enabled', '__return_true' );

/*
 * We have some instances where `track_number` of an audio attachment is `??0` and shows up as type string.
 * However the problem is, that if post has nested property attachments with this track_number, `json_serialize` fails silently.
 * Of course, this should be fixed during audio upload, but we need this fix until we can clean this up properly.
 * More detail here: 235-gh-Automattic/automated-transfer
 */
function wpcomsh_jetpack_api_fix_unserializable_track_number( $exif_data ) {
	if ( isset( $exif_data['track_number'] ) ) {
		$exif_data['track_number'] = intval( $exif_data['track_number'] );
	}
	return $exif_data;
}
add_filter( 'wp_get_attachment_metadata', 'wpcomsh_jetpack_api_fix_unserializable_track_number' );

// Jetpack for Atomic sites are always production version
add_filter( 'jetpack_development_version', '__return_false' );

// Initialize REST API
add_action( 'rest_api_init', 'wpcomsh_rest_api_init' );

// Remove WordPress 5.2+ Site Health Tests that are not a good fit for Atomic
add_filter( 'site_status_tests', 'wpcomsh_site_status_tests_disable' );

function wpcomsh_site_status_tests_disable( $tests ) {
	unset( $tests['async']['background_updates'] );
	unset( $tests['direct']['plugin_version'] );
	unset( $tests['direct']['theme_version'] );
	unset( $tests['direct']['php_version'] );
	unset( $tests['direct']['php_extensions'] );
	return $tests;
}

/**
 * Make User Agent consistent with the rest of WordPress.com.
 */
function wpcomsh_filter_outgoing_user_agent( $agent ) {
	global $wp_version;

	return str_replace( "WordPress/$wp_version", 'WordPress.com', $agent );
}
add_filter( 'http_headers_useragent', 'wpcomsh_filter_outgoing_user_agent', 999 );

// Limit post revisions
function wpcomsh_limit_post_revisions( $revisions ) {
	return 100;
}
add_filter( 'wp_revisions_to_keep', 'wpcomsh_limit_post_revisions', 5 );

// log wp_die() calls
function wpcomsh_wp_die_handler( $message, $title, $args ) {
	$e = new Exception( 'wp_die was called' );
	error_log( $e );

	if ( function_exists( '_default_wp_die_handler' ) ) {
		_default_wp_die_handler( $message, $title, $args );
		return;
	}
	// if the default wp_die handler is not available just die.
	die();
}
function wpcomsh_get_wp_die_handler() {
	return 'wpcomsh_wp_die_handler';
}
// Disabling the die handler per p9F6qB-3TQ-p2
//add_filter( 'wp_die_handler', 'wpcomsh_get_wp_die_handler' );

function wpcomsh_get_at_site_info() {
	$at_site_info_file = sys_get_temp_dir() . '/.at-site-info';

	if ( ! is_file( $at_site_info_file ) ) {
		return [];
	}

	$site_info_json = file_get_contents( $at_site_info_file );

	if ( empty( $site_info_json ) ) {
		return [];
	}

	$site_info = json_decode( $site_info_json, true );
	if ( empty( $site_info ) ) {
		return [];
	}

	if ( ! empty( $site_info['space_quota'] ) ) {
		// Hardcode 200GB in bytes for now. Will update all space_quota soon.
		$site_info['space_quota'] = 200 * GB_IN_BYTES;
	}

	return $site_info;
}

function wpcomsh_display_disk_space_usage() {
	$site_info = wpcomsh_get_at_site_info();

	if ( empty( $site_info['space_used'] ) || empty( $site_info['space_quota'] ) ) {
		return;
	}

	$space_used = $site_info['space_used'];
	$space_quota = $site_info['space_quota'];

	$message = sprintf(
		__(
			'You are currently using <strong>%1$s</strong> out of <strong>%2$s</strong> upload limit (%3$s%%).',
			'wpcomsh'
		),
		size_format( $space_used, 1 ),
		size_format( $space_quota, 1 ),
		number_format_i18n( ( $space_used / $space_quota ) * 100.0 )
	);

	echo "<p>$message</p>";
}
add_action( 'pre-upload-ui', 'wpcomsh_display_disk_space_usage' );

function wpcomsh_debug_information_disk_usage( $args ) {
	if ( empty( $args['wp-paths-sizes']['fields'] ) ) {
		return $args;
	}

	$site_info = wpcomsh_get_at_site_info();

	if ( empty( $site_info['space_used'] ) || empty( $site_info['space_quota'] ) ) {
		return $args;
	}

	$space_used = $site_info['space_used'];
	$space_quota = $site_info['space_quota'];

	unset( $args['wp-paths-sizes']['fields']['total_size'] );
	$args['wp-paths-sizes']['fields']['wpcomsh-disk-space-used'] = array (
		'label' => __( 'Disk space used', 'wpcomsh' ),
		'value' => size_format( $space_used, 1 ),
	);
	$args['wp-paths-sizes']['fields']['wpcomsh-disk-space-quota'] = array (
		'label' => __( 'Disk space quota', 'wpcomsh' ),
		'value' => size_format( $space_quota, 1 ),
	);

	return $args;
}
add_filter( 'debug_information', 'wpcomsh_debug_information_disk_usage' );

/**
 * WordPress 5.3 adds "big image" processing, for images over 2560px (by default).
 * This is not needed on Atomic since we use Photon for dynamic image work.
 */
add_filter( 'big_image_size_threshold', '__return_false' );

/**
 * WordPress 5.3 adds periodic admin email verification, disable it for WordPress.com on Atomic
 */
add_filter( 'admin_email_check_interval', '__return_zero' );

/**
 * Allow redirects to WordPress.com from Customizer.
 */
function wpcomsh_allowed_redirect_hosts( $hosts ) {
	if ( is_array( $hosts ) ) {
		$hosts[] = 'wordpress.com';
		$hosts[] = 'calypso.localhost';
		$hosts = array_unique( $hosts );
	}
	return $hosts;
}
add_filter( 'allowed_redirect_hosts', 'wpcomsh_allowed_redirect_hosts', 11 );

/**
 * WP.com make clickable
 *
 * Converts all plain-text HTTP URLs in post_content to links on display
 *
 * @uses make_clickable()
 * @since 20121125
 */
function wpcomsh_make_content_clickable($content) {
	// make_clickable() is expensive, check if plain-text URLs exist before running it
	// don't look inside HTML tags
	// don't look in <a></a>, <pre></pre>, <script></script> and <style></style>
	// use <div class="skip-make-clickable"> in support docs where linkifying
	// breaks shortcodes, etc.
	$_split = preg_split( '/(<[^<>]+>)/i', $content, -1, PREG_SPLIT_DELIM_CAPTURE );
	$end = $out = $combine = '';
	$split = array();

	// filter the array and combine <a></a>, <pre></pre>, <script></script> and <style></style> into one
	// (none of these tags can be nested so when we see the opening tag, we grab everything untill we reach the closing tag)
	foreach( $_split as $chunk ) {
		if ( $chunk === '' )
			continue;

		if ( $end ) {
			$combine .= $chunk;

			if ( $end == strtolower( str_replace( array( "\t", ' ', "\r", "\n" ), '', $chunk ) ) ) {
				$split[] = $combine;
				$end = $combine = '';
			}
			continue;
		}

		if ( strpos( strtolower( $chunk ), '<a ' ) === 0 ) {
			$combine .= $chunk;
			$end = '</a>';
		} elseif ( strpos( strtolower( $chunk ), '<pre' ) === 0 ) {
			$combine .= $chunk;
			$end = '</pre>';
		} elseif ( strpos( strtolower( $chunk ), '<style' ) === 0 ) {
			$combine .= $chunk;
			$end = '</style>';
		} elseif ( strpos( strtolower( $chunk ), '<script' ) === 0 ) {
			$combine .= $chunk;
			$end = '</script>';
		} elseif ( strpos( strtolower( $chunk ), '<div class="skip-make-clickable' ) === 0 ) {
			$combine .= $chunk;
			$end = '</div>';
		} elseif ( strpos( strtolower( $chunk ), '<textarea' ) === 0 ) {
			$combine .= $chunk;
			$end = '</textarea>';
		} else {
			$split[] = $chunk;
		}
	}

	foreach ( $split as $chunk ) {
		// if $chunk is white space or a tag (or a combined tag), add it and continue
		if ( preg_match( '/^\s+$/', $chunk ) || ( $chunk[0] == '<' && $chunk[ strlen( $chunk ) - 1 ] == '>' ) ) {
			$out .= $chunk;
			continue;
		}

		// three strpos() are faster than one preg_match() here. If we need to check for more protocols, preg_match() would probably be better
		if ( strpos( $chunk, 'http://' ) !== false || strpos( $chunk, 'https://' ) !== false || strpos( $chunk, 'www.' ) !== false ) {
			// looks like there is a plain-text url
			$out .= make_clickable( $chunk );
		} else {
			$out .= $chunk;
		}
	}

	return $out;
}

add_filter( 'the_content', 'wpcomsh_make_content_clickable', 120 );
add_filter( 'the_excerpt', 'wpcomsh_make_content_clickable', 120 );

function wpcomsh_hide_scan_threats_from_transients( $response ) {
	if ( ! empty( $response->threats ) ) {
		$response->threats = [];
	}
	return $response;
}
add_filter( 'transient_jetpack_scan_state', 'wpcomsh_hide_scan_threats_from_transients' );

function wpcom_hide_scan_threats_from_api( $response ) {
	if (
		! ( $response instanceof WP_REST_Response )
		|| $response->get_matched_route() !== '/jetpack/v4/scan'
	) {
		return $response;
	}
	$response_data = $response->get_data();
	if ( empty( $response_data['data'] ) ) {
		return $response;
	}

	$json_body = json_decode( $response_data['data'], true );
	if ( null === $json_body || empty( $json_body['threats'] ) ) {
		return $response;
	}

	$json_body['threats'] = [];
	$response_data['data'] = json_encode( $json_body );
	$response->set_data( $response_data );

	return $response;
}
add_filter( 'rest_post_dispatch', 'wpcom_hide_scan_threats_from_api' );
