<?php
/*
 * Plugin Name: WP Super Cache
 * Plugin URI: https://wordpress.org/plugins/wp-super-cache/
 * Description: Very fast caching plugin for WordPress.
 * Version: 1.9.3
 * Author: Automattic
 * Author URI: https://automattic.com/
 * License: GPL2+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: wp-super-cache
 */

/*
    Copyright Automattic and many other contributors.

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/

define( 'WPSC_VERSION', '1.9.1-alpha' );

require_once( __DIR__. '/inc/delete-cache-button.php');
require_once( __DIR__. '/inc/preload-notification.php');

if ( ! function_exists( 'wp_cache_phase2' ) ) {
	require_once( __DIR__. '/wp-cache-phase2.php');
}

if ( ! defined( 'PHP_VERSION_ID' ) ) {
	// For versions of PHP below 5.2.7, this constant doesn't exist.
	$wpsc_php_version = explode( '.', PHP_VERSION );
	define( 'PHP_VERSION_ID', intval( $wpsc_php_version[0] * 10000 + $wpsc_php_version[1] * 100 + $wpsc_php_version[2] ) );
	unset( $wpsc_php_version );
}

function wpsc_init() {
	global $wp_cache_config_file, $wp_cache_config_file_sample, $wpsc_advanced_cache_dist_filename, $wp_cache_check_wp_config, $wpsc_advanced_cache_filename, $wpsc_promo_links;

	if ( ! defined( 'WPCACHECONFIGPATH' ) ) {
		define( 'WPCACHECONFIGPATH', WP_CONTENT_DIR );
	}

	$wp_cache_config_file = WPCACHECONFIGPATH . '/wp-cache-config.php';

	// Centralise the promotional links to other products
	$wpsc_promo_links = array(
		'boost'       => 'https://jetpack.com/boost/?utm_source=wporg&utm_medium=plugin&utm_campaign=wp-super-cache&utm_id=wp-super-cache',
		'photon'      => 'https://jetpack.com/features/design/content-delivery-network/?utm_source=wporg&utm_medium=plugin&utm_campaign=wp-super-cache&utm_id=wp-super-cache',
		'videopress'  => 'https://jetpack.com/videopress/?utm_source=wporg&utm_medium=plugin&utm_campaign=wp-super-cache&utm_id=wp-super-cache',
		'crowdsignal' => 'https://crowdsignal.com/?utm_source=wporg&utm_medium=plugin&utm_campaign=wp-super-cache&utm_id=wp-super-cache',
		'jetpack'     => 'https://jetpack.com/?utm_source=wporg&utm_medium=plugin&utm_campaign=wp-super-cache&utm_id=wp-super-cache',
	);

	if ( !defined( 'WPCACHEHOME' ) ) {
		define( 'WPCACHEHOME', __DIR__ . '/' );
		$wp_cache_config_file_sample = WPCACHEHOME . 'wp-cache-config-sample.php';
		$wpsc_advanced_cache_dist_filename = WPCACHEHOME . 'advanced-cache.php';
	} elseif ( realpath( WPCACHEHOME ) != realpath( __DIR__ ) ) {
		$wp_cache_config_file_sample = __DIR__. '/wp-cache-config-sample.php';
		$wpsc_advanced_cache_dist_filename = __DIR__. '/advanced-cache.php';
		if ( ! defined( 'ADVANCEDCACHEPROBLEM' ) ) {
			define( 'ADVANCEDCACHEPROBLEM', 1 ); // force an update of WPCACHEHOME
		}
	} else {
		$wp_cache_config_file_sample = WPCACHEHOME . 'wp-cache-config-sample.php';
		$wpsc_advanced_cache_dist_filename = WPCACHEHOME . 'advanced-cache.php';
	}
	$wpsc_advanced_cache_filename = WP_CONTENT_DIR . '/advanced-cache.php';

	if ( !defined( 'WP_CACHE' ) || ( defined( 'WP_CACHE' ) && constant( 'WP_CACHE' ) == false ) ) {
		$wp_cache_check_wp_config = true;
	}
}

wpsc_init();

/**
 * WP-CLI requires explicit declaration of global variables.
 * It's minimal list of global variables.
 */
global $super_cache_enabled, $cache_enabled, $wp_cache_mod_rewrite, $wp_cache_home_path, $cache_path, $file_prefix;
global $wp_cache_mutex_disabled, $mutex_filename, $sem_id, $wp_super_cache_late_init;
global $cache_compression, $cache_max_time, $wp_cache_shutdown_gc, $cache_rebuild_files;
global $wp_super_cache_debug, $wp_super_cache_advanced_debug, $wp_cache_debug_level, $wp_cache_debug_to_file;
global $wp_cache_debug_log, $wp_cache_debug_ip, $wp_cache_debug_username, $wp_cache_debug_email;
global $cache_time_interval, $cache_scheduled_time, $cache_schedule_interval, $cache_schedule_type, $cache_gc_email_me;
global $wp_cache_preload_on, $wp_cache_preload_interval, $wp_cache_preload_posts, $wp_cache_preload_taxonomies;
global $wp_cache_preload_email_me, $wp_cache_preload_email_volume;
global $wp_cache_mobile, $wp_cache_mobile_enabled, $wp_cache_mobile_browsers, $wp_cache_mobile_prefixes;
global $wp_cache_config_file, $wp_cache_config_file_sample;

// Check is cache config already loaded.
if ( ! isset( $cache_enabled, $super_cache_enabled, $wp_cache_mod_rewrite, $cache_path ) &&
	empty( $wp_cache_phase1_loaded ) &&
	// phpcs:ignore Generic.PHP.NoSilencedErrors.Discouraged
	! @include( $wp_cache_config_file )
) {
	@include $wp_cache_config_file_sample; // phpcs:ignore Generic.PHP.NoSilencedErrors.Discouraged
}

include(WPCACHEHOME . 'wp-cache-base.php');
if ( class_exists( 'WP_REST_Controller' ) ) {
	include( __DIR__. '/rest/load.php' );
}

function wp_super_cache_init_action() {

	load_plugin_textdomain( 'wp-super-cache', false, basename( __DIR__ ) . '/languages' );

	wpsc_register_post_hooks();
}
add_action( 'init', 'wp_super_cache_init_action' );

function wp_cache_set_home() {
	global $wp_cache_is_home;
	$wp_cache_is_home = ( is_front_page() || is_home() );
	if ( $wp_cache_is_home && is_paged() )
		$wp_cache_is_home = false;
}
add_action( 'template_redirect', 'wp_cache_set_home' );


// OSSDL CDN plugin (https://wordpress.org/plugins/ossdl-cdn-off-linker/)
include_once( WPCACHEHOME . 'ossdl-cdn.php' );

function get_wpcachehome() {
	if ( function_exists( '_deprecated_function' ) ) {
		_deprecated_function( __FUNCTION__, 'WP Super Cache 1.6.5' );
	}

	if ( ! defined( 'WPCACHEHOME' ) ) {
		if ( is_file( __DIR__ . '/wp-cache-config-sample.php' ) ) {
			define( 'WPCACHEHOME', trailingslashit( __DIR__ ) );
		} elseif ( is_file( __DIR__ . '/wp-super-cache/wp-cache-config-sample.php' ) ) {
			define( 'WPCACHEHOME', __DIR__ . '/wp-super-cache/' );
		} else {
			die( sprintf( esc_html__( 'Please create %s/wp-cache-config.php from wp-super-cache/wp-cache-config-sample.php', 'wp-super-cache' ), esc_attr( WPCACHECONFIGPATH ) ) );
		}
	}
}

function wpsc_remove_advanced_cache() {
	global $wpsc_advanced_cache_filename;
	if ( file_exists( $wpsc_advanced_cache_filename ) ) {
		$file = file_get_contents( $wpsc_advanced_cache_filename );
		if (
			strpos( $file, "WP SUPER CACHE 0.8.9.1" ) ||
			strpos( $file, "WP SUPER CACHE 1.2" )
		) {
			unlink( $wpsc_advanced_cache_filename );
		}
	}
}

function wpsupercache_uninstall() {
	global $wp_cache_config_file, $cache_path;

	wpsc_remove_advanced_cache();

	if ( file_exists( $wp_cache_config_file ) ) {
		unlink( $wp_cache_config_file );
	}

	wp_cache_remove_index();

	if ( ! empty( $cache_path ) ) {
		@unlink( $cache_path . '.htaccess' );
		@unlink( $cache_path . 'meta' );
		@unlink( $cache_path . 'supercache' );
	}

	wp_clear_scheduled_hook( 'wp_cache_check_site_hook' );
	wp_clear_scheduled_hook( 'wp_cache_gc' );
	wp_clear_scheduled_hook( 'wp_cache_gc_watcher' );
	wp_cache_disable_plugin();
	delete_site_option( 'wp_super_cache_index_detected' );
}
if ( is_admin() ) {
	register_uninstall_hook( __FILE__, 'wpsupercache_uninstall' );
}

function wpsupercache_deactivate() {
	global $wp_cache_config_file, $wpsc_advanced_cache_filename, $cache_path;

	wpsc_remove_advanced_cache();

	if ( ! empty( $cache_path ) ) {
		prune_super_cache( $cache_path, true );
		wp_cache_remove_index();
		@unlink( $cache_path . '.htaccess' );
		@unlink( $cache_path . 'meta' );
		@unlink( $cache_path . 'supercache' );
	}

	wp_clear_scheduled_hook( 'wp_cache_check_site_hook' );
	wp_clear_scheduled_hook( 'wp_cache_gc' );
	wp_clear_scheduled_hook( 'wp_cache_gc_watcher' );
	wp_cache_replace_line('^ *\$cache_enabled', '$cache_enabled = false;', $wp_cache_config_file);
	wp_cache_disable_plugin( false ); // don't delete configuration file
	delete_user_option( get_current_user_id(), 'wpsc_dismissed_boost_banner' );
}
register_deactivation_hook( __FILE__, 'wpsupercache_deactivate' );

function wpsupercache_activate() {
	global $cache_path;
	if ( ! isset( $cache_path ) || $cache_path == '' )
		$cache_path = WP_CONTENT_DIR . '/cache/'; // from sample config file

	ob_start();
	wpsc_init();

	if (
		! wpsc_check_advanced_cache() ||
		! wp_cache_verify_config_file() ||
		! wp_cache_verify_cache_dir()
	) {
		$text = ob_get_contents();
		ob_end_clean();
		return false;
	}
	$text = ob_get_contents();
	wp_cache_check_global_config();
	ob_end_clean();
	wp_schedule_single_event( time() + 10, 'wp_cache_add_site_cache_index' );
}
register_activation_hook( __FILE__, 'wpsupercache_activate' );

function wpsupercache_site_admin() {
	global $wp_version;

	if ( version_compare( $wp_version, '4.8', '>=' ) ) {
		return current_user_can( 'setup_network' );
	}

	return is_super_admin();
}

function wp_cache_add_pages() {
	if ( wpsupercache_site_admin() ) {
		// In single or MS mode add this menu item too, but only for superadmins in MS mode.
		add_options_page( 'WP Super Cache', 'WP Super Cache', 'manage_options', 'wpsupercache', 'wp_cache_manager' );
	}
}
add_action( 'admin_menu', 'wp_cache_add_pages' );


function wp_cache_network_pages() {
	add_submenu_page( 'settings.php', 'WP Super Cache', 'WP Super Cache', 'manage_options', 'wpsupercache', 'wp_cache_manager' );
}
add_action( 'network_admin_menu', 'wp_cache_network_pages' );

/**
 * Load JavaScript on admin pages.
 */
function wp_super_cache_admin_enqueue_scripts( $hook ) {
	if ( 'settings_page_wpsupercache' !== $hook ) {
		return;
	}

	wp_enqueue_script(
		'wp-super-cache-admin',
		trailingslashit( plugin_dir_url( __FILE__ ) ) . 'js/admin.js',
		array( 'jquery' ),
		WPSC_VERSION,
		false
	);

	wp_localize_script(
		'wp-super-cache-admin',
		'wpscAdmin',
		array(
			'boostDismissNonce'  => wp_create_nonce( 'wpsc_dismiss_boost_banner' ),
			'boostInstallNonce'  => wp_create_nonce( 'updates' ),
			'boostActivateNonce' => wp_create_nonce( 'activate-boost' ),
		)
	);
}
add_action( 'admin_enqueue_scripts', 'wp_super_cache_admin_enqueue_scripts' );

/**
 * Use the standard WordPress plugin installation ajax handler.
 */
add_action( 'wp_ajax_wpsc_install_plugin', 'wp_ajax_install_plugin' );

/**
 * Check if Jetpack Boost has been installed.
 */
function wpsc_is_boost_installed() {
	$plugins = array_keys( get_plugins() );

	foreach ( $plugins as $plugin ) {
		if ( false !== strpos( $plugin, 'jetpack-boost.php' ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Check if Jetpack Boost is active.
 */
function wpsc_is_boost_active() {
	return class_exists( '\Automattic\Jetpack_Boost\Jetpack_Boost' );
}

/**
 * Admin ajax action: hide the Boost Banner.
 */
function wpsc_hide_boost_banner() {
	check_ajax_referer( 'wpsc_dismiss_boost_banner', 'nonce' );
	update_user_option( get_current_user_id(), 'wpsc_dismissed_boost_banner', '1' );

	wp_die();
}
add_action( 'wp_ajax_wpsc-hide-boost-banner', 'wpsc_hide_boost_banner' );

/**
 * Admin ajax action: activate Jetpack Boost.
 */
function wpsc_ajax_activate_boost() {
	check_ajax_referer( 'activate-boost' );

	$result = activate_plugin( 'jetpack-boost/jetpack-boost.php' );
	if ( is_wp_error( $result ) ) {
		wp_send_json_error( $result->get_error_message() );
	}

	wp_send_json_success();
}
add_action( 'wp_ajax_wpsc_activate_boost', 'wpsc_ajax_activate_boost' );

/**
 * Show a Jetpack Boost installation banner (unless dismissed or installed)
 */
function wpsc_jetpack_boost_install_banner() {
	// Don't show the banner if Boost is installed, or the banner has been dismissed.
	$is_dismissed = '1' === get_user_option( 'wpsc_dismissed_boost_banner' );
	if ( wpsc_is_boost_active() || $is_dismissed ) {
		return;
	}

	$install_url  = wp_nonce_url( admin_url( 'update.php?action=install-plugin&plugin=jetpack-boost' ), 'install-plugin_jetpack-boost' );
	$activate_url = admin_url( 'plugins.php' );
	$is_installed = wpsc_is_boost_installed();
	$button_url   = $is_installed ? $activate_url : $install_url;
	$button_label = $is_installed ? __( 'Activate Jetpack Boost', 'wp-super-cache' ) : __( 'Install Jetpack Boost', 'wp-super-cache' );
	$button_id    = $is_installed ? 'wpsc-activate-boost-button' : 'wpsc-install-boost-button';

	?>
		<div class="wpsc-boost-banner">
			<div class="wpsc-boost-banner-inner">
				<div class="wpsc-boost-banner-content">
					<img style="width:176px" src="<?php echo esc_url( plugin_dir_url( __FILE__ ) . '/assets/jetpack-logo.svg' ); ?>" height="32" />

					<h3>
						<?php esc_html_e( 'Find out how much Super Cache speeds up your site', 'wp-super-cache' ); ?>
					</h3>

					<p id="wpsc-install-invitation">
						<?php
							esc_html_e(
								'Caching is a great start, but there is more to maximize your site speed. Find out how much your cache speeds up your site and make it blazing fast with Jetpack Boost, the easiest WordPress speed optimization plugin developed by Super Cache engineers.',
								'wp-super-cache'
							);
						?>
					</p>

					<div id="wpsc-boost-banner-error" style="display:none; color:red; margin-bottom: 20px;"></div>

					<a href="<?php echo esc_url( $button_url ); ?>" class="button button-primary wpsc-install-action-button" id="<?php echo esc_attr( $button_id ); ?>">
						<div class="spinner" style="display:none; margin-top: 8px"></div>
						<label><?php echo esc_html( $button_label ); ?></label>
					</a>
				</div>

				<div class="wpsc-boost-banner-image-container">
					<img
						src="<?php echo esc_url( plugin_dir_url( __FILE__ ) . '/assets/boost-performance.png' ); ?>"
						title="<?php esc_attr_e( 'Check how your web site performance scores for desktop and mobile.', 'wp-super-cache' ); ?>"
						alt="<?php esc_attr_e( 'An image showing a web site with a photo of a time-lapsed watch face. In the foreground is a graph showing a speed score for mobile and desktop in yellow and green with an overall score of B', 'wp-super-cache' ); ?>"
						srcset="<?php echo esc_url( plugin_dir_url( __FILE__ ) . '/assets/boost-performance.png' ); ?> 650w <?php echo esc_url( plugin_dir_url( __FILE__ ) . '/assets/boost-performance-2x.png' ); ?> 1306w"
						sizes="(max-width: 782px) 654px, 1306px"
					>
				</div>
			</div>

			<span class="wpsc-boost-dismiss dashicons dashicons-dismiss"></span>
		</div>
	<?php
}

function wp_cache_manager_error_checks() {
	global $wp_cache_debug, $wp_cache_cron_check, $cache_enabled, $super_cache_enabled, $wp_cache_config_file, $wp_cache_mobile_browsers, $wp_cache_mobile_prefixes, $wp_cache_mobile_browsers, $wp_cache_mobile_enabled, $wp_cache_mod_rewrite;
	global $dismiss_htaccess_warning, $dismiss_readable_warning, $dismiss_gc_warning, $wp_cache_shutdown_gc, $is_nginx;
	global $htaccess_path;

	if ( ! wpsupercache_site_admin() ) {
		return false;
	}

	if ( PHP_VERSION_ID < 50300 && ( ini_get( 'safe_mode' ) === '1' || strtolower( ini_get( 'safe_mode' ) ) === 'on' ) ) { // @codingStandardsIgnoreLine
		echo '<div class="notice notice-error"><h4>' . esc_html__( 'Warning! PHP Safe Mode Enabled!', 'wp-super-cache' ) . '</h4>';
		echo '<p>' . esc_html__( 'You may experience problems running this plugin because SAFE MODE is enabled.', 'wp-super-cache' ) . '<br />';

		if ( ! ini_get( 'safe_mode_gid' ) ) { // @codingStandardsIgnoreLine
			esc_html_e( 'Your server is set up to check the owner of PHP scripts before allowing them to read and write files.', 'wp-super-cache' );
			echo '<br />';
			printf( __( 'You or an administrator may be able to make it work by changing the group owner of the plugin scripts to match that of the web server user. The group owner of the %s/cache/ directory must also be changed. See the  <a href="http://php.net/features.safe-mode">safe mode manual page</a> for further details.', 'wp-super-cache' ), esc_attr( WP_CONTENT_DIR ) );
		} else {
			_e( 'You or an administrator must disable this. See the <a href="http://php.net/features.safe-mode">safe mode manual page</a> for further details. This cannot be disabled in a .htaccess file unfortunately. It must be done in the php.ini config file.', 'wp-super-cache' );
		}
		echo '</p></div>';
	}

	if ( '' == get_option( 'permalink_structure' ) ) {
		echo '<div class="notice notice-error"><h4>' . __( 'Permlink Structure Error', 'wp-super-cache' ) . '</h4>';
		echo "<p>" . __( 'A custom url or permalink structure is required for this plugin to work correctly. Please go to the <a href="options-permalink.php">Permalinks Options Page</a> to configure your permalinks.', 'wp-super-cache' ) . "</p>";
		echo '</div>';
		return false;
	}

	if ( $wp_cache_debug || ! $wp_cache_cron_check ) {
		if ( defined( 'DISABLE_WP_CRON' ) && constant( 'DISABLE_WP_CRON' ) ) {
			?>
			<div class="notice notice-error"><h4><?php _e( 'CRON System Disabled', 'wp-super-cache' ); ?></h4>
			<p><?php _e( 'The WordPress CRON jobs system is disabled. This means the garbage collection system will not work unless you run the CRON system manually.', 'wp-super-cache' ); ?></p>
			</div>
			<?php
		} elseif ( function_exists( "wp_remote_get" ) == false ) {
			$hostname = str_replace( 'http://', '', str_replace( 'https://', '', get_option( 'siteurl' ) ) );
			if( strpos( $hostname, '/' ) )
				$hostname = substr( $hostname, 0, strpos( $hostname, '/' ) );
			$ip = gethostbyname( $hostname );
			if( substr( $ip, 0, 3 ) == '127' || substr( $ip, 0, 7 ) == '192.168' ) {
				?><div class="notice notice-warning"><h4><?php printf( __( 'Warning! Your hostname "%s" resolves to %s', 'wp-super-cache' ), $hostname, $ip ); ?></h4>
					<p><?php printf( __( 'Your server thinks your hostname resolves to %s. Some services such as garbage collection by this plugin, and WordPress scheduled posts may not operate correctly.', 'wp-super-cache' ), $ip ); ?></p>
					<p><?php printf( __( 'Please see entry 16 in the <a href="%s">Troubleshooting section</a> of the readme.txt', 'wp-super-cache' ), 'https://wordpress.org/plugins/wp-super-cache/faq/' ); ?></p>
					</div>
					<?php
					return false;
			} else {
				wp_cache_replace_line('^ *\$wp_cache_cron_check', "\$wp_cache_cron_check = 1;", $wp_cache_config_file);
			}
		} else {
			$cron_url = get_option( 'siteurl' ) . '/wp-cron.php?check=' . wp_hash('187425');
			$cron = wp_remote_get($cron_url, array('timeout' => 0.01, 'blocking' => true));
			if( is_array( $cron ) ) {
				if( $cron[ 'response' ][ 'code' ] == '404' ) {
					?><div class="notice notice-error"><h4>Warning! wp-cron.php not found!</h4>
					<p><?php _e( 'Unfortunately, WordPress cannot find the file wp-cron.php. This script is required for the correct operation of garbage collection by this plugin, WordPress scheduled posts as well as other critical activities.', 'wp-super-cache' ); ?></p>
					<p><?php printf( __( 'Please see entry 16 in the <a href="%s">Troubleshooting section</a> of the readme.txt', 'wp-super-cache' ), 'https://wordpress.org/plugins/wp-super-cache/faq/' ); ?></p>
					</div>
					<?php
				} else {
					wp_cache_replace_line('^ *\$wp_cache_cron_check', "\$wp_cache_cron_check = 1;", $wp_cache_config_file);
				}
			}
		}
	}

	if (
		! wpsc_check_advanced_cache() ||
		! wp_cache_verify_config_file() ||
		! wp_cache_verify_cache_dir()
	) {
		echo '<p>' . __( "Cannot continue... fix previous problems and retry.", 'wp-super-cache' ) . '</p>';
		return false;
	}

	if ( false == function_exists( 'wpsc_deep_replace' ) ) {
		$msg = __( 'Warning! You must set WP_CACHE and WPCACHEHOME in your wp-config.php for this plugin to work correctly:' ) . '<br />';
		$msg .= "<code>define( 'WP_CACHE', true );</code><br />";
		$msg .= "<code>define( 'WPCACHEHOME', '" . __DIR__ . "/' );</code><br />";
		wp_die( $msg );
	}

	if (!wp_cache_check_global_config()) {
		return false;
	}

	if ( 1 == ini_get( 'zlib.output_compression' ) || "on" == strtolower( ini_get( 'zlib.output_compression' ) ) ) {
		?><div class="notice notice-warning"><h4><?php _e( 'Zlib Output Compression Enabled!', 'wp-super-cache' ); ?></h4>
		<p><?php _e( 'PHP is compressing the data sent to the visitors of your site. Disabling this is recommended as the plugin caches the compressed output once instead of compressing the same page over and over again. Also see #21 in the Troubleshooting section. See <a href="http://php.net/manual/en/zlib.configuration.php">this page</a> for instructions on modifying your php.ini.', 'wp-super-cache' ); ?></p></div><?php
	}

	if (
		$cache_enabled == true &&
		$super_cache_enabled == true &&
		$wp_cache_mod_rewrite &&
		! got_mod_rewrite() &&
		! $is_nginx
	) {
		?><div class="notice notice-warning"><h4><?php _e( 'Mod rewrite may not be installed!', 'wp-super-cache' ); ?></h4>
		<p><?php _e( 'It appears that mod_rewrite is not installed. Sometimes this check isn&#8217;t 100% reliable, especially if you are not using Apache. Please verify that the mod_rewrite module is loaded. It is required for serving Super Cache static files in expert mode. You will still be able to simple mode.', 'wp-super-cache' ); ?></p></div><?php
	}

	if( !is_writeable_ACLSafe( $wp_cache_config_file ) ) {
		if ( !defined( 'SUBMITDISABLED' ) )
			define( "SUBMITDISABLED", 'disabled style="color: #aaa" ' );
		?><div class="notice notice-error"><h4><?php _e( 'Read Only Mode. Configuration cannot be changed.', 'wp-super-cache' ); ?></h4>
		<p><?php printf( __( 'The WP Super Cache configuration file is <code>%s/wp-cache-config.php</code> and cannot be modified. That file must be writeable by the web server to make any changes.', 'wp-super-cache' ), WPCACHECONFIGPATH ); ?>
		<?php _e( 'A simple way of doing that is by changing the permissions temporarily using the CHMOD command or through your ftp client. Make sure it&#8217;s globally writeable and it should be fine.', 'wp-super-cache' ); ?></p>
		<p><?php _e( '<a href="https://codex.wordpress.org/Changing_File_Permissions">This page</a> explains how to change file permissions.', 'wp-super-cache' ); ?></p>
		<?php _e( 'Writeable:', 'wp-super-cache' ); ?> <code>chmod 666 <?php echo WPCACHECONFIGPATH; ?>/wp-cache-config.php</code><br />
		<?php _e( 'Read-only:', 'wp-super-cache' ); ?> <code>chmod 644 <?php echo WPCACHECONFIGPATH; ?>/wp-cache-config.php</code></p>
		</div><?php
	} elseif ( !defined( 'SUBMITDISABLED' ) ) {
		define( "SUBMITDISABLED", ' ' );
	}

	$valid_nonce = isset($_REQUEST['_wpnonce']) ? wp_verify_nonce($_REQUEST['_wpnonce'], 'wp-cache') : false;
	// Check that garbage collection is running
	if ( $valid_nonce && isset( $_POST[ 'action' ] ) && $_POST[ 'action' ] == 'dismiss_gc_warning' ) {
		wp_cache_replace_line('^ *\$dismiss_gc_warning', "\$dismiss_gc_warning = 1;", $wp_cache_config_file);
		$dismiss_gc_warning = 1;
	} elseif ( !isset( $dismiss_gc_warning ) ) {
		$dismiss_gc_warning = 0;
	}
	if ( $cache_enabled && ( !isset( $wp_cache_shutdown_gc ) || $wp_cache_shutdown_gc == 0 ) && function_exists( 'get_gc_flag' ) ) {
		$gc_flag = get_gc_flag();
		if ( $dismiss_gc_warning == 0 ) {
			if ( false == maybe_stop_gc( $gc_flag ) && false == wp_next_scheduled( 'wp_cache_gc' ) ) {
				?><div class="notice notice-warning"><h4><?php _e( 'Warning! Garbage collection is not scheduled!', 'wp-super-cache' ); ?></h4>
				<p><?php _e( 'Garbage collection by this plugin clears out expired and old cached pages on a regular basis. Use <a href="#expirytime">this form</a> to enable it.', 'wp-super-cache' ); ?> </p>
				<form action="" method="POST">
				<input type="hidden" name="action" value="dismiss_gc_warning" />
				<input type="hidden" name="page" value="wpsupercache" />
				<?php wp_nonce_field( 'wp-cache' ); ?>
				<input class='button-secondary' type='submit' value='<?php _e( 'Dismiss', 'wp-super-cache' ); ?>' />
				</form>
				<br />
				</div>
				<?php
			}
		}
	}

	// Server could be running as the owner of the wp-content directory.  Therefore, if it's
	// writable, issue a warning only if the permissions aren't 755.
	if ( $valid_nonce && isset( $_POST[ 'action' ] ) && $_POST[ 'action' ] == 'dismiss_readable_warning' ) {
		wp_cache_replace_line('^ *\$dismiss_readable_warning', "\$dismiss_readable_warning = 1;", $wp_cache_config_file);
		$dismiss_readable_warning = 1;
	} elseif ( !isset( $dismiss_readable_warning ) ) {
		$dismiss_readable_warning = 0;
	}
	if( $dismiss_readable_warning == 0 && is_writeable_ACLSafe( WP_CONTENT_DIR . '/' ) ) {
		$wp_content_stat = stat(WP_CONTENT_DIR . '/');
		$wp_content_mode = decoct( $wp_content_stat[ 'mode' ] & 0777 );
		if( substr( $wp_content_mode, -2 ) == '77' ) {
			?><div class="notice notice-warning"><h4><?php printf( __( 'Warning! %s is writeable!', 'wp-super-cache' ), WP_CONTENT_DIR ); ?></h4>
			<p><?php printf( __( 'You should change the permissions on %s and make it more restrictive. Use your ftp client, or the following command to fix things:', 'wp-super-cache' ), WP_CONTENT_DIR ); ?> <code>chmod 755 <?php echo WP_CONTENT_DIR; ?>/</code></p>
			<p><?php _e( '<a href="https://codex.wordpress.org/Changing_File_Permissions">This page</a> explains how to change file permissions.', 'wp-super-cache' ); ?></p>
			<form action="" method="POST">
			<input type="hidden" name="action" value="dismiss_readable_warning" />
			<input type="hidden" name="page" value="wpsupercache" />
			<?php wp_nonce_field( 'wp-cache' ); ?>
			<input class='button-secondary' type='submit' value='<?php _e( 'Dismiss', 'wp-super-cache' ); ?>' />
			</form>
			<br />
			</div>
			<?php
		}
	}

	if ( ! $is_nginx && function_exists( "is_main_site" ) && true == is_main_site() ) {
	if ( ! isset( $htaccess_path ) ) {
		$home_path = trailingslashit( get_home_path() );
	} else {
		$home_path = $htaccess_path;
	}
	$scrules = implode( "\n", extract_from_markers( $home_path.'.htaccess', 'WPSuperCache' ) );
	if ( $cache_enabled && $wp_cache_mod_rewrite && !$wp_cache_mobile_enabled && strpos( $scrules, addcslashes( str_replace( ', ', '|', $wp_cache_mobile_browsers ), ' ' ) ) ) {
		echo '<div class="notice notice-warning"><h4>' . __( 'Mobile rewrite rules detected', 'wp-super-cache' ) . "</h4>";
		echo "<p>" . __( 'For best performance you should enable "Mobile device support" or delete the mobile rewrite rules in your .htaccess. Look for the 2 lines with the text "2.0\ MMP|240x320" and delete those.', 'wp-super-cache' ) . "</p><p>" . __( 'This will have no affect on ordinary users but mobile users will see uncached pages.', 'wp-super-cache' ) . "</p></div>";
	} elseif ( $wp_cache_mod_rewrite && $cache_enabled && $wp_cache_mobile_enabled && $scrules != '' && (
		( '' != $wp_cache_mobile_prefixes && false === strpos( $scrules, addcslashes( str_replace( ', ', '|', $wp_cache_mobile_prefixes ), ' ' ) ) ) ||
		( '' != $wp_cache_mobile_browsers && false === strpos( $scrules, addcslashes( str_replace( ', ', '|', $wp_cache_mobile_browsers ), ' ' ) ) ) )
		) {
		?>
			<div class="notice notice-warning"><h4><?php _e( 'Rewrite rules must be updated', 'wp-super-cache' ); ?></h4>
			<p><?php _e( 'The rewrite rules required by this plugin have changed or are missing. ', 'wp-super-cache' ); ?>
			<?php _e( 'Mobile support requires extra rules in your .htaccess file, or you can set the plugin to simple mode. Here are your options (in order of difficulty):', 'wp-super-cache' ); ?>
			<ol><li> <?php _e( 'Set the plugin to simple mode and enable mobile support.', 'wp-super-cache' ); ?></li>
			<li> <?php _e( 'Scroll down the Advanced Settings page and click the <strong>Update Mod_Rewrite Rules</strong> button.', 'wp-super-cache' ); ?></li>
			<li> <?php printf( __( 'Delete the plugin mod_rewrite rules in %s.htaccess enclosed by <code># BEGIN WPSuperCache</code> and <code># END WPSuperCache</code> and let the plugin regenerate them by reloading this page.', 'wp-super-cache' ), $home_path ); ?></li>
			<li> <?php printf( __( 'Add the rules yourself. Edit %s.htaccess and find the block of code enclosed by the lines <code># BEGIN WPSuperCache</code> and <code># END WPSuperCache</code>. There are two sections that look very similar. Just below the line <code>%%{HTTP:Cookie} !^.*(comment_author_|%s|wp-postpass_).*$</code> add these lines: (do it twice, once for each section)', 'wp-super-cache' ), $home_path, wpsc_get_logged_in_cookie() ); ?></p>
			<div style='padding: 2px; margin: 2px; border: 1px solid #333; width:400px; overflow: scroll'><pre><?php echo "RewriteCond %{HTTP_user_agent} !^.*(" . addcslashes( str_replace( ', ', '|', $wp_cache_mobile_browsers ), ' ' ) . ").*\nRewriteCond %{HTTP_user_agent} !^(" . addcslashes( str_replace( ', ', '|', $wp_cache_mobile_prefixes ), ' ' ) . ").*"; ?></pre></div></li></ol></div><?php
	}

	if ( $cache_enabled && $super_cache_enabled && $wp_cache_mod_rewrite && $scrules == '' ) {
		?><div class='notice notice-warning'><h4><?php _e( 'Rewrite rules must be updated', 'wp-super-cache' ); ?></h4>
		<p><?php _e( 'The rewrite rules required by this plugin have changed or are missing. ', 'wp-super-cache' ); ?>
		<?php _e( 'Scroll down the Advanced Settings page and click the <strong>Update Mod_Rewrite Rules</strong> button.', 'wp-super-cache' ); ?></p></div><?php
	}
	}

	if ( ! $is_nginx && $wp_cache_mod_rewrite && $super_cache_enabled && function_exists( 'apache_get_modules' ) ) {
		$mods = apache_get_modules();
		$required_modules = array( 'mod_mime' => __( 'Required to serve compressed supercache files properly.', 'wp-super-cache' ), 'mod_headers' => __( 'Required to set caching information on supercache pages. IE7 users will see old pages without this module.', 'wp-super-cache' ), 'mod_expires' => __( 'Set the expiry date on supercached pages. Visitors may not see new pages when they refresh or leave comments without this module.', 'wp-super-cache' ) );
		foreach( $required_modules as $req => $desc ) {
			if( !in_array( $req, $mods ) ) {
				$missing_mods[ $req ] = $desc;
			}
		}
		if( isset( $missing_mods) && is_array( $missing_mods ) ) {
			?><div class='notice notice-warning'><h4><?php _e( 'Missing Apache Modules', 'wp-super-cache' ); ?></h4>
			<p><?php __( 'The following Apache modules are missing. The plugin will work in simple mode without them but in expert mode, your visitors may see corrupted pages or out of date content however.', 'wp-super-cache' ); ?></p><?php
			echo "<ul>";
			foreach( $missing_mods as $req => $desc ) {
				echo "<li> $req - $desc</li>";
			}
			echo "</ul>";
			echo "</div>";
		}
	}

	if ( $valid_nonce && isset( $_POST[ 'action' ] ) && $_POST[ 'action' ] == 'dismiss_htaccess_warning' ) {
		wp_cache_replace_line('^ *\$dismiss_htaccess_warning', "\$dismiss_htaccess_warning = 1;", $wp_cache_config_file);
		$dismiss_htaccess_warning = 1;
	} elseif ( !isset( $dismiss_htaccess_warning ) ) {
		$dismiss_htaccess_warning = 0;
	}
	if ( isset( $disable_supercache_htaccess_warning ) == false )
		$disable_supercache_htaccess_warning = false;
	if ( ! $is_nginx && $dismiss_htaccess_warning == 0 && $wp_cache_mod_rewrite && $super_cache_enabled && $disable_supercache_htaccess_warning == false && get_option( 'siteurl' ) != get_option( 'home' ) ) {
		?><div class="notice notice-info"><h4><?php _e( '.htaccess file may need to be moved', 'wp-super-cache' ); ?></h4>
		<p><?php _e( 'It appears you have WordPress installed in a sub directory as described <a href="https://codex.wordpress.org/Giving_WordPress_Its_Own_Directory">here</a>. Unfortunately, WordPress writes to the .htaccess in the install directory, not where your site is served from.<br />When you update the rewrite rules in this plugin you will have to copy the file to where your site is hosted. This will be fixed in the future.', 'wp-super-cache' ); ?></p>
		<form action="" method="POST">
		<input type="hidden" name="action" value="dismiss_htaccess_warning" />
		<input type="hidden" name="page" value="wpsupercache" />
		<?php wp_nonce_field( 'wp-cache' ); ?>
		<input class='button-secondary' type='submit' value='<?php _e( 'Dismiss', 'wp-super-cache' ); ?>' />
		</form>
		<br />
		</div><?php
	}

	return true;
}
add_filter( 'wp_super_cache_error_checking', 'wp_cache_manager_error_checks' );

function wp_cache_manager_updates() {
	global $wp_cache_mobile_enabled, $wp_cache_mfunc_enabled, $wp_supercache_cache_list, $wp_cache_config_file, $wp_cache_clear_on_post_edit, $cache_rebuild_files, $wp_cache_mutex_disabled, $wp_cache_not_logged_in, $wp_cache_make_known_anon, $cache_path, $wp_cache_refresh_single_only, $cache_compression, $wp_cache_mod_rewrite, $wp_supercache_304, $wp_super_cache_late_init, $wp_cache_front_page_checks, $cache_page_secret, $wp_cache_disable_utf8, $wp_cache_no_cache_for_get;
	global $cache_schedule_type, $cache_max_time, $cache_time_interval, $wp_cache_shutdown_gc, $wpsc_save_headers;

	if ( !wpsupercache_site_admin() )
		return false;

	if ( false == isset( $cache_page_secret ) ) {
		$cache_page_secret = md5( date( 'H:i:s' ) . mt_rand() );
		wp_cache_replace_line('^ *\$cache_page_secret', "\$cache_page_secret = '" . $cache_page_secret . "';", $wp_cache_config_file);
	}

	$valid_nonce = isset($_REQUEST['_wpnonce']) ? wp_verify_nonce($_REQUEST['_wpnonce'], 'wp-cache') : false;
	if ( $valid_nonce == false )
		return false;

	if ( isset( $_POST[ 'action' ] ) && $_POST[ 'action' ] == 'easysetup' ) {
		$_POST[ 'action' ] = 'scupdates';
		if( isset( $_POST[ 'wp_cache_easy_on' ] ) && $_POST[ 'wp_cache_easy_on' ] == 1 ) {
			$_POST[ 'wp_cache_enabled' ] = 1;
			$_POST[ 'super_cache_enabled' ] = 1;
			$_POST[ 'cache_rebuild_files' ] = 1;
			unset( $_POST[ 'cache_compression' ] );
			if ( $cache_path != WP_CONTENT_DIR . '/cache/' )
				$_POST[ 'wp_cache_location' ] = $cache_path;
			//
			// set up garbage collection with some default settings
			if ( ( !isset( $wp_cache_shutdown_gc ) || $wp_cache_shutdown_gc == 0 ) && false == wp_next_scheduled( 'wp_cache_gc' ) ) {
				if ( false == isset( $cache_schedule_type ) ) {
					$cache_schedule_type = 'interval';
					$cache_time_interval = 600;
					$cache_max_time = 1800;
					wp_cache_replace_line('^ *\$cache_schedule_type', "\$cache_schedule_type = '$cache_schedule_type';", $wp_cache_config_file);
					wp_cache_replace_line('^ *\$cache_time_interval', "\$cache_time_interval = '$cache_time_interval';", $wp_cache_config_file);
					wp_cache_replace_line('^ *\$cache_max_time', "\$cache_max_time = '$cache_max_time';", $wp_cache_config_file);
				}
				wp_schedule_single_event( time() + 600, 'wp_cache_gc' );
			}

		} else {
			unset( $_POST[ 'wp_cache_enabled' ] );
			wp_clear_scheduled_hook( 'wp_cache_check_site_hook' );
			wp_clear_scheduled_hook( 'wp_cache_gc' );
			wp_clear_scheduled_hook( 'wp_cache_gc_watcher' );
		}
		$advanced_settings = array( 'wp_super_cache_late_init', 'wp_cache_disable_utf8', 'wp_cache_no_cache_for_get', 'wp_supercache_304', 'wp_cache_mfunc_enabled', 'wp_cache_front_page_checks', 'wp_supercache_cache_list', 'wp_cache_clear_on_post_edit', 'wp_cache_make_known_anon', 'wp_cache_refresh_single_only', 'cache_compression' );
		foreach( $advanced_settings as $setting ) {
			if ( isset( $GLOBALS[ $setting ] ) && $GLOBALS[ $setting ] == 1 ) {
				$_POST[ $setting ] = 1;
			}
		}
		$_POST['wp_cache_not_logged_in'] = 2;
	}

	if( isset( $_POST[ 'action' ] ) && $_POST[ 'action' ] == 'scupdates' ) {
		if( isset( $_POST[ 'wp_cache_location' ] ) && $_POST[ 'wp_cache_location' ] != '' ) {
			$dir = realpath( trailingslashit( dirname( $_POST[ 'wp_cache_location' ] ) ) );
			if ( $dir === realpath( '.' ) || false === $dir ) {
				$dir = WP_CONTENT_DIR . '/cache/';
			} else {
				$dir = trailingslashit( $dir ) . trailingslashit(wpsc_deep_replace( array( '..', '\\' ), basename( $_POST[ 'wp_cache_location' ] ) ) );
			}
			$new_cache_path = $dir;
		} else {
			$new_cache_path = WP_CONTENT_DIR . '/cache/';
		}
		if ( $new_cache_path != $cache_path ) {
			if ( file_exists( $new_cache_path ) == false )
				rename( $cache_path, $new_cache_path );
			$cache_path = preg_replace('/[ <>\'\"\r\n\t\(\)\$\[\];#]/', '', $new_cache_path );
			wp_cache_replace_line('^ *\$cache_path', "\$cache_path = " . var_export( $cache_path, true ) . ";", $wp_cache_config_file);
		}

		if( isset( $_POST[ 'wp_super_cache_late_init' ] ) ) {
			$wp_super_cache_late_init = 1;
		} else {
			$wp_super_cache_late_init = 0;
		}
		wp_cache_replace_line('^ *\$wp_super_cache_late_init', "\$wp_super_cache_late_init = " . $wp_super_cache_late_init . ";", $wp_cache_config_file);

		if( isset( $_POST[ 'wp_cache_disable_utf8' ] ) ) {
			$wp_cache_disable_utf8 = 1;
		} else {
			$wp_cache_disable_utf8 = 0;
		}
		wp_cache_replace_line('^ *\$wp_cache_disable_utf8', "\$wp_cache_disable_utf8 = " . $wp_cache_disable_utf8 . ";", $wp_cache_config_file);

		if( isset( $_POST[ 'wp_cache_no_cache_for_get' ] ) ) {
			$wp_cache_no_cache_for_get = 1;
		} else {
			$wp_cache_no_cache_for_get = 0;
		}
		wp_cache_replace_line('^ *\$wp_cache_no_cache_for_get', "\$wp_cache_no_cache_for_get = " . $wp_cache_no_cache_for_get . ";", $wp_cache_config_file);

		if( isset( $_POST[ 'wp_supercache_304' ] ) ) {
			$wp_supercache_304 = 1;
		} else {
			$wp_supercache_304 = 0;
		}
		wp_cache_replace_line('^ *\$wp_supercache_304', "\$wp_supercache_304 = " . $wp_supercache_304 . ";", $wp_cache_config_file);

		if( isset( $_POST[ 'wp_cache_mfunc_enabled' ] ) ) {
			$wp_cache_mfunc_enabled = 1;
		} else {
			$wp_cache_mfunc_enabled = 0;
		}
		wp_cache_replace_line('^ *\$wp_cache_mfunc_enabled', "\$wp_cache_mfunc_enabled = " . $wp_cache_mfunc_enabled . ";", $wp_cache_config_file);

		if( isset( $_POST[ 'wp_cache_mobile_enabled' ] ) ) {
			$wp_cache_mobile_enabled = 1;
		} else {
			$wp_cache_mobile_enabled = 0;
		}
		wp_cache_replace_line('^ *\$wp_cache_mobile_enabled', "\$wp_cache_mobile_enabled = " . $wp_cache_mobile_enabled . ";", $wp_cache_config_file);

		if( isset( $_POST[ 'wp_cache_front_page_checks' ] ) ) {
			$wp_cache_front_page_checks = 1;
		} else {
			$wp_cache_front_page_checks = 0;
		}
		wp_cache_replace_line('^ *\$wp_cache_front_page_checks', "\$wp_cache_front_page_checks = " . $wp_cache_front_page_checks . ";", $wp_cache_config_file);

		if( isset( $_POST[ 'wp_supercache_cache_list' ] ) ) {
			$wp_supercache_cache_list = 1;
		} else {
			$wp_supercache_cache_list = 0;
		}
		wp_cache_replace_line('^ *\$wp_supercache_cache_list', "\$wp_supercache_cache_list = " . $wp_supercache_cache_list . ";", $wp_cache_config_file);

		if ( isset( $_POST[ 'wp_cache_enabled' ] ) ) {
			wp_cache_enable();
			if ( ! defined( 'DISABLE_SUPERCACHE' ) ) {
				wp_cache_debug( 'DISABLE_SUPERCACHE is not set, super_cache enabled.' );
				wp_super_cache_enable();
				$super_cache_enabled = true;
			}
		} else {
			wp_cache_disable();
			wp_super_cache_disable();
			$super_cache_enabled = false;
		}

		if ( isset( $_POST[ 'wp_cache_mod_rewrite' ] ) && $_POST[ 'wp_cache_mod_rewrite' ] == 1 ) {
			$wp_cache_mod_rewrite = 1;
			add_mod_rewrite_rules();
		} else {
			$wp_cache_mod_rewrite = 0; // cache files served by PHP
			remove_mod_rewrite_rules();
		}
		wp_cache_setting( 'wp_cache_mod_rewrite', $wp_cache_mod_rewrite );

		if( isset( $_POST[ 'wp_cache_clear_on_post_edit' ] ) ) {
			$wp_cache_clear_on_post_edit = 1;
		} else {
			$wp_cache_clear_on_post_edit = 0;
		}
		wp_cache_replace_line('^ *\$wp_cache_clear_on_post_edit', "\$wp_cache_clear_on_post_edit = " . $wp_cache_clear_on_post_edit . ";", $wp_cache_config_file);

		if( isset( $_POST[ 'cache_rebuild_files' ] ) ) {
			$cache_rebuild_files = 1;
		} else {
			$cache_rebuild_files = 0;
		}
		wp_cache_replace_line('^ *\$cache_rebuild_files', "\$cache_rebuild_files = " . $cache_rebuild_files . ";", $wp_cache_config_file);

		if ( isset( $_POST[ 'wpsc_save_headers' ] ) ) {
			$wpsc_save_headers = 1;
		} else {
			$wpsc_save_headers = 0;
		}
		wp_cache_replace_line('^ *\$wpsc_save_headers', "\$wpsc_save_headers = " . $wpsc_save_headers . ";", $wp_cache_config_file);

		if( isset( $_POST[ 'wp_cache_mutex_disabled' ] ) ) {
			$wp_cache_mutex_disabled = 0;
		} else {
			$wp_cache_mutex_disabled = 1;
		}
		if( defined( 'WPSC_DISABLE_LOCKING' ) ) {
			$wp_cache_mutex_disabled = 1;
		}
		wp_cache_replace_line('^ *\$wp_cache_mutex_disabled', "\$wp_cache_mutex_disabled = " . $wp_cache_mutex_disabled . ";", $wp_cache_config_file);

		if ( isset( $_POST['wp_cache_not_logged_in'] ) && $_POST['wp_cache_not_logged_in'] != 0 ) {
			if ( $wp_cache_not_logged_in == 0 && function_exists( 'prune_super_cache' ) ) {
				prune_super_cache( $cache_path, true );
			}
			$wp_cache_not_logged_in = (int)$_POST['wp_cache_not_logged_in'];
		} else {
			$wp_cache_not_logged_in = 0;
		}
		wp_cache_replace_line('^ *\$wp_cache_not_logged_in', "\$wp_cache_not_logged_in = " . $wp_cache_not_logged_in . ";", $wp_cache_config_file);

		if( isset( $_POST[ 'wp_cache_make_known_anon' ] ) ) {
			if( $wp_cache_make_known_anon == 0 && function_exists( 'prune_super_cache' ) )
				prune_super_cache ($cache_path, true);
			$wp_cache_make_known_anon = 1;
		} else {
			$wp_cache_make_known_anon = 0;
		}
		wp_cache_replace_line('^ *\$wp_cache_make_known_anon', "\$wp_cache_make_known_anon = " . $wp_cache_make_known_anon . ";", $wp_cache_config_file);

		if( isset( $_POST[ 'wp_cache_refresh_single_only' ] ) ) {
			$wp_cache_refresh_single_only = 1;
		} else {
			$wp_cache_refresh_single_only = 0;
		}
		wp_cache_setting( 'wp_cache_refresh_single_only', $wp_cache_refresh_single_only );

		if ( defined( 'WPSC_DISABLE_COMPRESSION' ) ) {
			$cache_compression = 0;
			wp_cache_replace_line('^ *\$cache_compression', "\$cache_compression = " . $cache_compression . ";", $wp_cache_config_file);
		} else {
			if ( isset( $_POST[ 'cache_compression' ] ) ) {
				$new_cache_compression = 1;
			} else {
				$new_cache_compression = 0;
			}
			if ( 1 == ini_get( 'zlib.output_compression' ) || "on" == strtolower( ini_get( 'zlib.output_compression' ) ) ) {
				echo '<div class="notice notice-error">' . __( "<strong>Warning!</strong> You attempted to enable compression but <code>zlib.output_compression</code> is enabled. See #21 in the Troubleshooting section of the readme file.", 'wp-super-cache' ) . '</div>';
			} elseif ( $new_cache_compression !== (int) $cache_compression ) {
				$cache_compression = $new_cache_compression;
				wp_cache_replace_line( '^ *\$cache_compression', "\$cache_compression = $cache_compression;", $wp_cache_config_file );
				if ( function_exists( 'prune_super_cache' ) ) {
					prune_super_cache( $cache_path, true );
				}
				delete_option( 'super_cache_meta' );
			}
		}
	}
}
if ( isset( $_GET[ 'page' ] ) && $_GET[ 'page' ] == 'wpsupercache' )
	add_action( 'admin_init', 'wp_cache_manager_updates' );

function wp_cache_manager() {
	global $wp_cache_config_file, $valid_nonce, $supercachedir, $cache_path, $cache_enabled, $cache_compression, $super_cache_enabled;
	global $wp_cache_clear_on_post_edit, $cache_rebuild_files, $wp_cache_mutex_disabled, $wp_cache_mobile_enabled, $wp_cache_mobile_browsers, $wp_cache_no_cache_for_get;
	global $wp_cache_not_logged_in, $wp_cache_make_known_anon, $wp_supercache_cache_list, $cache_page_secret;
	global $wp_super_cache_front_page_check, $wp_cache_refresh_single_only, $wp_cache_mobile_prefixes;
	global $wp_cache_mod_rewrite, $wp_supercache_304, $wp_super_cache_late_init, $wp_cache_front_page_checks, $wp_cache_disable_utf8, $wp_cache_mfunc_enabled;
	global $wp_super_cache_comments, $wp_cache_home_path, $wpsc_save_headers, $is_nginx;
	global $wpsc_promo_links;

	if ( !wpsupercache_site_admin() )
		return false;

	// used by mod_rewrite rules and config file
	if ( function_exists( "cfmobi_default_browsers" ) ) {
		$wp_cache_mobile_browsers = cfmobi_default_browsers( "mobile" );
		$wp_cache_mobile_browsers = array_merge( $wp_cache_mobile_browsers, cfmobi_default_browsers( "touch" ) );
	} elseif ( function_exists( 'lite_detection_ua_contains' ) ) {
		$wp_cache_mobile_browsers = explode( '|', lite_detection_ua_contains() );
	} else {
		$wp_cache_mobile_browsers = array( '2.0 MMP', '240x320', '400X240', 'AvantGo', 'BlackBerry', 'Blazer', 'Cellphone', 'Danger', 'DoCoMo', 'Elaine/3.0', 'EudoraWeb', 'Googlebot-Mobile', 'hiptop', 'IEMobile', 'KYOCERA/WX310K', 'LG/U990', 'MIDP-2.', 'MMEF20', 'MOT-V', 'NetFront', 'Newt', 'Nintendo Wii', 'Nitro', 'Nokia', 'Opera Mini', 'Palm', 'PlayStation Portable', 'portalmmm', 'Proxinet', 'ProxiNet', 'SHARP-TQ-GX10', 'SHG-i900', 'Small', 'SonyEricsson', 'Symbian OS', 'SymbianOS', 'TS21i-10', 'UP.Browser', 'UP.Link', 'webOS', 'Windows CE', 'WinWAP', 'YahooSeeker/M1A1-R2D2', 'iPhone', 'iPod', 'iPad', 'Android', 'BlackBerry9530', 'LG-TU915 Obigo', 'LGE VX', 'webOS', 'Nokia5800' );
	}
	if ( function_exists( "lite_detection_ua_prefixes" ) ) {
		$wp_cache_mobile_prefixes = lite_detection_ua_prefixes();
	} else {
		$wp_cache_mobile_prefixes = array( 'w3c ', 'w3c-', 'acs-', 'alav', 'alca', 'amoi', 'audi', 'avan', 'benq', 'bird', 'blac', 'blaz', 'brew', 'cell', 'cldc', 'cmd-', 'dang', 'doco', 'eric', 'hipt', 'htc_', 'inno', 'ipaq', 'ipod', 'jigs', 'kddi', 'keji', 'leno', 'lg-c', 'lg-d', 'lg-g', 'lge-', 'lg/u', 'maui', 'maxo', 'midp', 'mits', 'mmef', 'mobi', 'mot-', 'moto', 'mwbp', 'nec-', 'newt', 'noki', 'palm', 'pana', 'pant', 'phil', 'play', 'port', 'prox', 'qwap', 'sage', 'sams', 'sany', 'sch-', 'sec-', 'send', 'seri', 'sgh-', 'shar', 'sie-', 'siem', 'smal', 'smar', 'sony', 'sph-', 'symb', 't-mo', 'teli', 'tim-', 'tosh', 'tsm-', 'upg1', 'upsi', 'vk-v', 'voda', 'wap-', 'wapa', 'wapi', 'wapp', 'wapr', 'webc', 'winw', 'winw', 'xda ', 'xda-' ); // from http://svn.wp-plugins.org/wordpress-mobile-pack/trunk/plugins/wpmp_switcher/lite_detection.php
	}
	$wp_cache_mobile_browsers = apply_filters( 'cached_mobile_browsers', $wp_cache_mobile_browsers ); // Allow mobile plugins access to modify the mobile UA list
	$wp_cache_mobile_prefixes = apply_filters( 'cached_mobile_prefixes', $wp_cache_mobile_prefixes ); // Allow mobile plugins access to modify the mobile UA prefix list
	if ( function_exists( 'do_cacheaction' ) ) {
		$wp_cache_mobile_browsers = do_cacheaction( 'wp_super_cache_mobile_browsers', $wp_cache_mobile_browsers );
		$wp_cache_mobile_prefixes = do_cacheaction( 'wp_super_cache_mobile_prefixes', $wp_cache_mobile_prefixes );
	}
	$mobile_groups = apply_filters( 'cached_mobile_groups', array() ); // Group mobile user agents by capabilities. Lump them all together by default
	// mobile_groups = array( 'apple' => array( 'ipod', 'iphone' ), 'nokia' => array( 'nokia5800', 'symbianos' ) );

	$wp_cache_mobile_browsers = implode( ', ', $wp_cache_mobile_browsers );
	$wp_cache_mobile_prefixes = implode( ', ', $wp_cache_mobile_prefixes );

	if ( false == apply_filters( 'wp_super_cache_error_checking', true ) )
		return false;

	if ( function_exists( 'get_supercache_dir' ) )
		$supercachedir = get_supercache_dir();
	if( get_option( 'gzipcompression' ) == 1 )
		update_option( 'gzipcompression', 0 );
	if( !isset( $cache_rebuild_files ) )
		$cache_rebuild_files = 0;

	$valid_nonce = isset($_REQUEST['_wpnonce']) ? wp_verify_nonce($_REQUEST['_wpnonce'], 'wp-cache') : false;
	/* http://www.netlobo.com/div_hiding.html */
	?>
<script type='text/javascript'>
<!--
function toggleLayer( whichLayer ) {
	var elem, vis;
	if( document.getElementById ) // this is the way the standards work
		elem = document.getElementById( whichLayer );
	else if( document.all ) // this is the way old msie versions work
		elem = document.all[whichLayer];
	else if( document.layers ) // this is the way nn4 works
		elem = document.layers[whichLayer];
	vis = elem.style;
	// if the style.display value is blank we try to figure it out here
	if(vis.display==''&&elem.offsetWidth!=undefined&&elem.offsetHeight!=undefined)
		vis.display = (elem.offsetWidth!=0&&elem.offsetHeight!=0)?'block':'none';
	vis.display = (vis.display==''||vis.display=='block')?'none':'block';
}
// -->
//Clicking header opens fieldset options
jQuery(document).ready(function(){
	jQuery("fieldset h4").css("cursor","pointer").on("click",function(){
		jQuery(this).parent("fieldset").find("p,form,ul,blockquote").toggle("slow");
	});
});
</script>

<style type='text/css'>
#nav h3 {
	border-bottom: 1px solid #ccc;
	padding-bottom: 0;
	height: 1.5em;
}
table.wpsc-settings-table {
	clear: both;
}
</style>
<?php
	echo '<a name="top"></a>';
	echo '<div class="wrap">';
	echo '<h3>' . __( 'WP Super Cache Settings', 'wp-super-cache' ) . '</h3>';

	// Set a default.
	if ( false === $cache_enabled && ! isset( $wp_cache_mod_rewrite ) ) {
		$wp_cache_mod_rewrite = 0;
	} elseif ( ! isset( $wp_cache_mod_rewrite ) && $cache_enabled && $super_cache_enabled ) {
		$wp_cache_mod_rewrite = 1;
	}

	$admin_url = admin_url( 'options-general.php?page=wpsupercache' );
	$curr_tab  = ! empty( $_GET['tab'] ) ? sanitize_text_field( stripslashes( $_GET['tab'] ) ) : ''; // WPCS: sanitization ok.
	if ( empty( $curr_tab ) ) {
		$curr_tab = 'easy';
		if ( $wp_cache_mod_rewrite ) {
			$curr_tab = 'settings';
			echo '<div class="notice notice-info is-dismissible"><p>' .  __( 'Notice: <em>Expert mode caching enabled</em>. Showing Advanced Settings Page by default.', 'wp-super-cache' ) . '</p></div>';
		}
	}

	if ( 'preload' === $curr_tab ) {
		if ( true == $super_cache_enabled && ! defined( 'DISABLESUPERCACHEPRELOADING' ) ) {
			global $wp_cache_preload_interval, $wp_cache_preload_on, $wp_cache_preload_taxonomies, $wp_cache_preload_email_me, $wp_cache_preload_email_volume, $wp_cache_preload_posts, $wpdb;
			$count = wpsc_post_count();
			if ( $count > 1000 ) {
				$min_refresh_interval = 720;
			} else {
				$min_refresh_interval = 30;
			}
			$return = wpsc_preload_settings( $min_refresh_interval );
			$msg    = '';
			if ( empty( $return ) == false ) {
				foreach ( $return as $message ) {
					$msg .= $message;
				}
			}
			$currently_preloading = false;

			$preload_counter = get_option( 'preload_cache_counter' );
			if ( isset( $preload_counter['first'] ) ) { // converted from int to array
				update_option( 'preload_cache_counter', array( 'c' => $preload_counter['c'], 't' => time() ) );
			}

			if ( is_array( $preload_counter ) && $preload_counter['c'] > 0 ) {
				$msg .= '<p>' . sprintf( esc_html__( 'Currently caching from post %d to %d.', 'wp-super-cache' ), ( $preload_counter['c'] - 100 ), $preload_counter['c'] ) . '</p>';
				$currently_preloading = true;
				if ( @file_exists( $cache_path . 'preload_permalink.txt' ) ) {
					$url  = file_get_contents( $cache_path . 'preload_permalink.txt' );
					$msg .= '<p>' . sprintf( __( '<strong>Page last cached:</strong> %s', 'wp-super-cache' ), '<span id="preload_status">' . $url . '</span>' ) . '</p>';
				}
				if ( $msg != '' ) {
					echo '<div class="notice notice-warning"><h4>' . esc_html__( 'Preload Active', 'wp-super-cache' ) . '</h4>' . $msg;
					echo '<form name="do_preload" action="' . esc_url_raw( add_query_arg( 'tab', 'preload', $admin_url ) ) . '" method="POST">';
					echo '<input type="hidden" name="action" value="preload" />';
					echo '<input type="hidden" name="page" value="wpsupercache" />';
					echo '<p><input class="button-primary" type="submit" name="preload_off" value="' . esc_html__( 'Cancel Cache Preload', 'wp-super-cache' ) . '" /></p>';
					wp_nonce_field( 'wp-cache' );
					echo '</form>';
					echo '</div>';
				}
			}
			next_preload_message( 'wp_cache_preload_hook', __( 'Refresh of cache in %d hours %d minutes and %d seconds.', 'wp-super-cache' ), 60 );
			next_preload_message( 'wp_cache_full_preload_hook', __( 'Full refresh of cache in %d hours %d minutes and %d seconds.', 'wp-super-cache' ) );

		}
	}

	wpsc_admin_tabs( $curr_tab );

	if ( isset( $wp_super_cache_front_page_check ) && $wp_super_cache_front_page_check == 1 && ! wp_next_scheduled( 'wp_cache_check_site_hook' ) ) {
		wp_schedule_single_event( time() + 360, 'wp_cache_check_site_hook' );
		wp_cache_debug( 'scheduled wp_cache_check_site_hook for 360 seconds time.', 2 );
	}

	if ( isset( $_REQUEST['wp_restore_config'] ) && $valid_nonce ) {
		unlink( $wp_cache_config_file );
		echo '<strong>' . esc_html__( 'Configuration file changed, some values might be wrong. Load the page again from the "Settings" menu to reset them.', 'wp-super-cache' ) . '</strong>';
	}

	if ( substr( get_option( 'permalink_structure' ), -1 ) == '/' ) {
		wp_cache_replace_line( '^ *\$wp_cache_slash_check', "\$wp_cache_slash_check = 1;", $wp_cache_config_file );
	} else {
		wp_cache_replace_line( '^ *\$wp_cache_slash_check', "\$wp_cache_slash_check = 0;", $wp_cache_config_file );
	}
	$home_path = parse_url( site_url() );
	$home_path = trailingslashit( array_key_exists( 'path', $home_path ) ? $home_path['path'] : '' );
	if ( ! isset( $wp_cache_home_path ) ) {
		$wp_cache_home_path = '/';
		wp_cache_setting( 'wp_cache_home_path', '/' );
	}
	if ( "$home_path" != "$wp_cache_home_path" ) {
		wp_cache_setting( 'wp_cache_home_path', $home_path );
	}

	if ( $wp_cache_mobile_enabled == 1 ) {
		update_cached_mobile_ua_list( $wp_cache_mobile_browsers, $wp_cache_mobile_prefixes, $mobile_groups );
	}

	?>
	<style>
		.wpsc-boost-banner {
			margin: 2px 1.25rem 1.25rem 0;
			box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.03), 0px 1px 2px rgba(0, 0, 0, 0.03);
			border: 1px solid #d5d5d5;
			position: relative;
		}

		.wpsc-boost-banner-inner {
			display: flex;
			grid-template-columns: minmax(auto, 750px) 500px;
			justify-content: space-between;
			min-height: 300px;
			background: #fff;
			overflow: hidden;
		}

		.wpsc-boost-banner-content {
			display: inline-flex;
			flex-direction: column;
			padding: 2rem 3rem 2rem 2rem;
			text-align: left;
		}

		.wpsc-boost-banner-image-container {
			position: relative;
			background-image: url( <?php echo esc_url( plugin_dir_url( __FILE__ ) . '/assets/jetpack-colors.svg' ); ?> );
			background-size: cover;
			max-width: 40%;
			overflow: hidden;
		}

		.wpsc-boost-banner-image-container img {
			position: relative;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			width: 100%;
		}

		.wpsc-boost-banner p {
			font-size: 16px;
			line-height: 1.5;
			margin: 1rem 0 2rem;
		}

		.wpsc-boost-banner .wpsc-boost-dismiss {
			position: absolute;
			top: 10px;
			right: 10px;
			color: black;
			cursor:pointer;
		}

		.wpsc-boost-banner .button-primary {
			background: black;
			border-color: black;
			color: #fff;
			width: fit-content;
			padding: 0.4rem 1rem;
			font-size: 16px;
		}

		.wpsc-boost-banner .button-primary:hover {
			background-color: #333;
		}

		.wpsc-boost-banner .button-primary:visited {
			background-color: black;
			border-color: black;
		}
	</style>

	<table class="wpsc-settings-table"><td valign="top">

	<?php
	wpsc_jetpack_boost_install_banner();

	switch ( $curr_tab ) {
		case 'cdn':
			scossdl_off_options();
			break;
		case 'tester':
		case 'contents':
			echo '<a name="test"></a>';
			wp_cache_files();
			break;
		case 'preload':
			wpsc_render_partial(
				'preload',
				compact(
					'cache_enabled',
					'super_cache_enabled',
					'admin_url',
					'wp_cache_preload_interval',
					'wp_cache_preload_on',
					'wp_cache_preload_taxonomies',
					'wp_cache_preload_email_me',
					'wp_cache_preload_email_volume',
					'currently_preloading',
					'wp_cache_preload_posts'
				)
			);

			break;
		case 'plugins':
			wpsc_plugins_tab();
			break;
		case 'debug':
			global $wp_super_cache_debug, $wp_cache_debug_log, $wp_cache_debug_ip, $wp_cache_debug_ip;
			global $wp_super_cache_front_page_text, $wp_super_cache_front_page_notification;
			global $wp_super_cache_advanced_debug, $wp_cache_debug_username, $wp_super_cache_front_page_clear;
			wpsc_render_partial(
				'debug',
				compact( 'wp_super_cache_debug', 'wp_cache_debug_log', 'wp_cache_debug_ip', 'cache_path', 'valid_nonce', 'wp_cache_config_file', 'wp_super_cache_comments', 'wp_super_cache_front_page_check', 'wp_super_cache_front_page_clear', 'wp_super_cache_front_page_text', 'wp_super_cache_front_page_notification', 'wp_super_cache_advanced_debug', 'wp_cache_debug_username' )
			);
			break;
		case 'settings':
			global $cache_acceptable_files, $wpsc_rejected_cookies, $cache_rejected_uri, $wp_cache_pages;
			global $cache_max_time, $wp_cache_config_file, $valid_nonce, $super_cache_enabled, $cache_schedule_type, $cache_scheduled_time, $cache_schedule_interval, $cache_time_interval, $cache_gc_email_me, $wp_cache_preload_on;

			wp_cache_update_rejected_pages();
			wp_cache_update_rejected_cookies();
			wp_cache_update_rejected_strings();
			wp_cache_update_accepted_strings();
			wp_cache_time_update();

			wpsc_render_partial(
				'advanced',
				compact(
					'wp_cache_front_page_checks',
					'admin_url',
					'cache_enabled',
					'super_cache_enabled',
					'wp_cache_mod_rewrite',
					'is_nginx',
					'wp_cache_not_logged_in',
					'wp_cache_no_cache_for_get',
					'cache_compression',
					'cache_rebuild_files',
					'wpsc_save_headers',
					'wp_supercache_304',
					'wp_cache_make_known_anon',
					'wp_cache_mfunc_enabled',
					'wp_cache_mobile_enabled',
					'wp_cache_mobile_browsers',
					'wp_cache_disable_utf8',
					'wp_cache_clear_on_post_edit',
					'wp_cache_front_page_checks',
					'wp_cache_refresh_single_only',
					'wp_supercache_cache_list',
					'wp_cache_mutex_disabled',
					'wp_super_cache_late_init',
					'cache_page_secret',
					'cache_path',
					'cache_acceptable_files',
					'wpsc_rejected_cookies',
					'cache_rejected_uri',
					'wp_cache_pages',
					'cache_max_time',
					'valid_nonce',
					'super_cache_enabled',
					'cache_schedule_type',
					'cache_scheduled_time',
					'cache_schedule_interval',
					'cache_time_interval',
					'cache_gc_email_me',
					'wp_cache_mobile_prefixes',
					'wp_cache_preload_on'
				)
			);

			wpsc_edit_tracking_parameters();
			wpsc_edit_rejected_ua();
			wpsc_lockdown();
			wpsc_restore_settings();

			break;
		case 'easy':
		default:
			wpsc_render_partial(
				'easy',
				array(
					'admin_url'     => $admin_url,
					'cache_enabled' => $cache_enabled,
					'is_nginx'      => $is_nginx,
					'wp_cache_mod_rewrite' => $wp_cache_mod_rewrite,
					'valid_nonce' => $valid_nonce,
					'cache_path'              => $cache_path,
					'wp_super_cache_comments' => $wp_super_cache_comments,
				)
			);
			break;
	}
	?>

	</fieldset>
	</td><td valign='top' style='width: 300px'>
	<div id="wpsc-callout" style='background: #ffc; border: 1px solid #333; margin: 2px; padding: 3px 15px'>
	<h4><?php _e( 'Other Site Tools', 'wp-super-cache' ); ?></h4>
	<ul style="list-style: square; margin-left: 2em;">

	<li><a href="<?php echo esc_url( $wpsc_promo_links['boost'] ); ?>"><?php esc_html_e( 'Boost your page speed scores', 'wp-super-cache' ); ?></a></li>
	<li><a href="<?php echo esc_url( $wpsc_promo_links['photon'] ); ?>"><?php esc_html_e( 'Speed up images and photos (free)', 'wp-super-cache' ); ?></a></li>
	<li><a href="<?php echo esc_url( $wpsc_promo_links['videopress'] ); ?>"><?php esc_html_e( 'Fast video hosting (paid)', 'wp-super-cache' ); ?></a></li>
	<li><a href="<?php echo esc_url( $wpsc_promo_links['crowdsignal'] ); ?>"><?php esc_html_e( 'Add Surveys and Polls to your site', 'wp-super-cache' ); ?></a></li>
	</ul>
	<h4><?php _e( 'Need Help?', 'wp-super-cache' ); ?></h4>
	<ol>
	<li><?php printf( __( 'Use the <a href="%1$s">Debug tab</a> for diagnostics.', 'wp-super-cache' ), admin_url( 'options-general.php?page=wpsupercache&tab=debug' ) ); ?></li>
	<li><?php printf( __( 'Check out the <a href="%1$s">support forum</a> and <a href="%2$s">FAQ</a>.', 'wp-super-cache' ), 'https://wordpress.org/support/plugin/wp-super-cache', 'https://wordpress.org/plugins/wp-super-cache/#faq' ); ?></li>
	<li><?php printf( __( 'Visit the <a href="%1$s">plugin homepage</a>.', 'wp-super-cache' ), 'https://wordpress.org/plugins/wp-super-cache/' ); ?></li>
	<li><?php printf( __( 'Try out the <a href="%1$s">development version</a> for the latest fixes (<a href="%2$s">changelog</a>).', 'wp-super-cache' ), 'https://odd.blog/y/2o', 'https://plugins.trac.wordpress.org/log/wp-super-cache/' ); ?></li>
	</ol>
	<h4><?php esc_html_e( 'Rate This Plugin', 'wp-super-cache' ); ?></h4>
	<p><?php printf( __( 'Please <a href="%s">rate us</a> and give feedback.', 'wp-super-cache' ), 'https://wordpress.org/support/plugin/wp-super-cache/reviews?rate=5#new-post' ); ?></p>

	<?php
	if ( isset( $wp_supercache_cache_list ) && $wp_supercache_cache_list ) {
		$start_date = get_option( 'wpsupercache_start' );
		if ( ! $start_date ) {
			$start_date = time();
		}
		?>
		<p><?php printf( __( 'Cached pages since %1$s : <strong>%2$s</strong>', 'wp-super-cache' ), date( 'M j, Y', $start_date ), number_format( get_option( 'wpsupercache_count' ) ) ); ?></p>
		<p><?php _e( 'Newest Cached Pages:', 'wp-super-cache' ); ?><ol>
			<?php
			foreach ( array_reverse( (array) get_option( 'supercache_last_cached' ) ) as $url ) {
				$since = time() - strtotime( $url['date'] );
				echo "<li><a title='" . sprintf( esc_html__( 'Cached %s seconds ago', 'wp-super-cache' ), (int) $since ) . "' href='" . site_url( $url['url'] ) . "'>" . substr( $url['url'], 0, 20 ) . "</a></li>\n";
			}
			?>
			</ol>
			<small><?php esc_html_e( '(may not always be accurate on busy sites)', 'wp-super-cache' ); ?></small>
		</p><?php
	} elseif ( false == get_option( 'wpsupercache_start' ) ) {
			update_option( 'wpsupercache_start', time() );
			update_option( 'wpsupercache_count', 0 );
	}
	?>
	</div>
	</td></table>

	<?php

	echo "</div>\n";
}

function wpsc_plugins_tab() {
	echo '<p>' . esc_html__( 'Cache plugins are PHP scripts you\'ll find in a dedicated folder inside the WP Super Cache folder (wp-super-cache/plugins/). They load at the same time as WP Super Cache, and before regular WordPress plugins.', 'wp-super-cache' ) . '</p>';
	echo '<p>' . esc_html__( 'Keep in mind that cache plugins are for advanced users only. To create and manage them, you\'ll need extensive knowledge of both PHP and WordPress actions.', 'wp-super-cache' ) . '</p>';
	echo '<p>' . sprintf( __( '<strong>Warning</strong>! Due to the way WordPress upgrades plugins, the ones you upload to the WP Super Cache folder (wp-super-cache/plugins/) will be deleted when you upgrade WP Super Cache. To avoid this loss, load your cache plugins from a different location. When you set <strong>$wp_cache_plugins_dir</strong> to the new location in wp-config.php, WP Super Cache will look there instead. <br />You can find additional details in the <a href="%s">developer documentation</a>.', 'wp-super-cache' ), 'https://odd.blog/wp-super-cache-developers/' ) . '</p>';
	ob_start();
	if ( defined( 'WP_CACHE' ) ) {
		if ( function_exists( 'do_cacheaction' ) ) {
			do_cacheaction( 'cache_admin_page' );
		}
	}
	$out = ob_get_contents();
	ob_end_clean();

	if ( SUBMITDISABLED == ' ' && $out != '' ) {
		echo '<h4>' . esc_html__( 'Available Plugins', 'wp-super-cache' ) . '</h4>';
		echo '<ol>';
		echo $out;
		echo '</ol>';
	}
}

function wpsc_admin_tabs( $current = '' ) {
	global $cache_enabled, $super_cache_enabled, $wp_cache_mod_rewrite;

	if ( '' === $current ) {
		$current = ! empty( $_GET['tab'] ) ? stripslashes( $_GET['tab'] ) : ''; // WPCS: CSRF ok, sanitization ok.
	}

	$admin_url  = admin_url( 'options-general.php?page=wpsupercache' );
	$admin_tabs = array(
		'easy'     => __( 'Easy', 'wp-super-cache' ),
		'settings' => __( 'Advanced', 'wp-super-cache' ),
		'cdn'      => __( 'CDN', 'wp-super-cache' ),
		'contents' => __( 'Contents', 'wp-super-cache' ),
		'preload'  => __( 'Preload', 'wp-super-cache' ),
		'plugins'  => __( 'Plugins', 'wp-super-cache' ),
		'debug'    => __( 'Debug', 'wp-super-cache' ),
	);

	echo '<div id="nav"><h3 class="themes-php">';

	foreach ( $admin_tabs as $tab => $name ) {
		printf( '<a class="%s" href="%s">%s</a>',
			esc_attr( $tab === $current ? 'nav-tab nav-tab-active' : 'nav-tab' ),
			esc_url_raw( add_query_arg( 'tab', $tab, $admin_url ) ),
			esc_html( $name )
		);
	}

	echo '</div></h3>';
}

function wpsc_restore_settings() {
	$admin_url = admin_url( 'options-general.php?page=wpsupercache' );
	wpsc_render_partial(
		'restore',
		compact( 'admin_url' )
	);
}

function comment_form_lockdown_message() {
	?><p><?php _e( "Comment moderation is enabled. Your comment may take some time to appear.", 'wp-super-cache' ); ?></p><?php
}
if( defined( 'WPLOCKDOWN' ) && constant( 'WPLOCKDOWN' ) )
	add_action( 'comment_form', 'comment_form_lockdown_message' );

function wp_update_lock_down() {
	global $cache_path, $wp_cache_config_file, $valid_nonce;

	if ( isset( $_POST[ 'wp_lock_down' ] ) && $valid_nonce ) {
		$wp_lock_down = $_POST[ 'wp_lock_down' ] == '1' ? '1' : '0';
		wp_cache_replace_line( '^.*WPLOCKDOWN', "if ( ! defined( 'WPLOCKDOWN' ) ) define( 'WPLOCKDOWN', '$wp_lock_down' );", $wp_cache_config_file );
		if ( false == defined( 'WPLOCKDOWN' ) )
			define( 'WPLOCKDOWN', $wp_lock_down );
		if ( $wp_lock_down == '0' && function_exists( 'prune_super_cache' ) )
			prune_super_cache( $cache_path, true ); // clear the cache after lockdown
		return $wp_lock_down;
	}
	if ( defined( 'WPLOCKDOWN' ) )
		return constant( 'WPLOCKDOWN' );
	else
		return 0;
}

function wpsc_update_direct_pages() {
	global $cached_direct_pages, $valid_nonce, $cache_path, $wp_cache_config_file;

	if ( false == isset( $cached_direct_pages ) )
		$cached_direct_pages = array();
	$out = '';
	if ( $valid_nonce && array_key_exists('direct_pages', $_POST) && is_array( $_POST[ 'direct_pages' ] ) && !empty( $_POST[ 'direct_pages' ] ) ) {
		$expiredfiles = array_diff( $cached_direct_pages, $_POST[ 'direct_pages' ] );
		unset( $cached_direct_pages );
		foreach( $_POST[ 'direct_pages' ] as $page ) {
			$page = str_replace( '..', '', preg_replace( '/[ <>\'\"\r\n\t\(\)\$\[\];#]/', '', $page ) );
			if ( $page != '' ) {
				$cached_direct_pages[] = $page;
				$out .= "'$page', ";
			}
		}
		if ( false == isset( $cached_direct_pages ) )
			$cached_direct_pages = array();
	}
	if ( $valid_nonce && array_key_exists('new_direct_page', $_POST) && $_POST[ 'new_direct_page' ] && '' != $_POST[ 'new_direct_page' ] ) {
		$page = str_replace( get_option( 'siteurl' ), '', $_POST[ 'new_direct_page' ] );
		$page = str_replace( '..', '', preg_replace( '/[ <>\'\"\r\n\t\(\)\$\[\];#]/', '', $page ) );
		if ( substr( $page, 0, 1 ) != '/' )
			$page = '/' . $page;
		if ( $page != '/' || false == is_array( $cached_direct_pages ) || in_array( $page, $cached_direct_pages ) == false ) {
			$cached_direct_pages[] = $page;
			$out .= "'$page', ";

			@unlink( trailingslashit( ABSPATH . $page ) . "index.html" );
			wpsc_delete_files( get_supercache_dir() . $page );
		}
	}

	if ( $out != '' ) {
		$out = substr( $out, 0, -2 );
	}
	if ( $out == "''" ) {
		$out = '';
	}
	$out = '$cached_direct_pages = array( ' . $out . ' );';
	wp_cache_replace_line('^ *\$cached_direct_pages', "$out", $wp_cache_config_file);

	if ( !empty( $expiredfiles ) ) {
		foreach( $expiredfiles as $file ) {
			if( $file != '' ) {
				$firstfolder = explode( '/', $file );
				$firstfolder = ABSPATH . $firstfolder[1];
				$file = ABSPATH . $file;
				$file = realpath( str_replace( '..', '', preg_replace('/[ <>\'\"\r\n\t\(\)]/', '', $file ) ) );
				if ( $file ) {
					@unlink( trailingslashit( $file ) . "index.html" );
					@unlink( trailingslashit( $file ) . "index.html.gz" );
					RecursiveFolderDelete( trailingslashit( $firstfolder ) );
				}
			}
		}
	}

	if ( $valid_nonce && array_key_exists('deletepage', $_POST) && $_POST[ 'deletepage' ] ) {
		$page = str_replace( '..', '', preg_replace('/[ <>\'\"\r\n\t\(\)]/', '', $_POST['deletepage'] ) ) . '/';
		$pagefile = realpath( ABSPATH . $page . 'index.html' );
		if ( substr( $pagefile, 0, strlen( ABSPATH ) ) != ABSPATH || false == wp_cache_confirm_delete( ABSPATH . $page ) ) {
			die( __( 'Cannot delete directory', 'wp-super-cache' ) );
		}
		$firstfolder = explode( '/', $page );
		$firstfolder = ABSPATH . $firstfolder[1];
		$page = ABSPATH . $page;
		if( is_file( $pagefile ) && is_writeable_ACLSafe( $pagefile ) && is_writeable_ACLSafe( $firstfolder ) ) {
			@unlink( $pagefile );
			@unlink( $pagefile . '.gz' );
			RecursiveFolderDelete( $firstfolder );
		}
	}

	return $cached_direct_pages;
}

function wpsc_lockdown() {
	global $cached_direct_pages, $cache_enabled, $super_cache_enabled;

	$admin_url = admin_url( 'options-general.php?page=wpsupercache' );
	$wp_lock_down = wp_update_lock_down();

	wpsc_render_partial(
		'lockdown',
		compact( 'cached_direct_pages', 'cache_enabled', 'super_cache_enabled', 'admin_url', 'wp_lock_down' )
	);
}

function RecursiveFolderDelete ( $folderPath ) { // from http://www.php.net/manual/en/function.rmdir.php
	if( trailingslashit( constant( 'ABSPATH' ) ) == trailingslashit( $folderPath ) )
		return false;
	if ( @is_dir ( $folderPath ) ) {
		$dh  = @opendir($folderPath);
		while (false !== ($value = @readdir($dh))) {
			if ( $value != "." && $value != ".." ) {
				$value = $folderPath . "/" . $value;
				if ( @is_dir ( $value ) ) {
					RecursiveFolderDelete ( $value );
				}
			}
		}
		return @rmdir ( $folderPath );
	} else {
		return FALSE;
	}
}

function wp_cache_time_update() {
	global $cache_max_time, $wp_cache_config_file, $valid_nonce, $cache_schedule_type, $cache_scheduled_time, $cache_schedule_interval, $cache_time_interval, $cache_gc_email_me;
	if ( isset( $_POST[ 'action' ] ) && $_POST[ 'action' ] == 'expirytime' ) {

		if ( false == $valid_nonce )
			return false;

		if( !isset( $cache_schedule_type ) ) {
			$cache_schedule_type = 'interval';
			wp_cache_replace_line('^ *\$cache_schedule_type', "\$cache_schedule_type = '$cache_schedule_type';", $wp_cache_config_file);
		}

		if( !isset( $cache_scheduled_time ) ) {
			$cache_scheduled_time = '00:00';
			wp_cache_replace_line('^ *\$cache_scheduled_time', "\$cache_scheduled_time = '$cache_scheduled_time';", $wp_cache_config_file);
		}

		if( !isset( $cache_max_time ) ) {
			$cache_max_time = 3600;
			wp_cache_replace_line('^ *\$cache_max_time', "\$cache_max_time = $cache_max_time;", $wp_cache_config_file);
		}

		if ( !isset( $cache_time_interval ) ) {
			$cache_time_interval = $cache_max_time;
			wp_cache_replace_line('^ *\$cache_time_interval', "\$cache_time_interval = '$cache_time_interval';", $wp_cache_config_file);
		}

		if ( isset( $_POST['wp_max_time'] ) ) {
			$cache_max_time = (int)$_POST['wp_max_time'];
			wp_cache_replace_line('^ *\$cache_max_time', "\$cache_max_time = $cache_max_time;", $wp_cache_config_file);
			// schedule gc watcher
			if ( false == wp_next_scheduled( 'wp_cache_gc_watcher' ) )
				wp_schedule_event( time()+600, 'hourly', 'wp_cache_gc_watcher' );
		}

		if ( isset( $_POST[ 'cache_gc_email_me' ] ) ) {
			$cache_gc_email_me = 1;
			wp_cache_replace_line('^ *\$cache_gc_email_me', "\$cache_gc_email_me = $cache_gc_email_me;", $wp_cache_config_file);
		} else {
			$cache_gc_email_me = 0;
			wp_cache_replace_line('^ *\$cache_gc_email_me', "\$cache_gc_email_me = $cache_gc_email_me;", $wp_cache_config_file);
		}
		if ( isset( $_POST[ 'cache_schedule_type' ] ) && $_POST[ 'cache_schedule_type' ] == 'interval' && isset( $_POST['cache_time_interval'] ) ) {
			wp_clear_scheduled_hook( 'wp_cache_gc' );
			$cache_schedule_type = 'interval';
			if ( (int)$_POST[ 'cache_time_interval' ] == 0 )
				$_POST[ 'cache_time_interval' ] = 600;
			$cache_time_interval = (int)$_POST[ 'cache_time_interval' ];
			wp_schedule_single_event( time() + $cache_time_interval, 'wp_cache_gc' );
			wp_cache_replace_line('^ *\$cache_schedule_type', "\$cache_schedule_type = '$cache_schedule_type';", $wp_cache_config_file);
			wp_cache_replace_line('^ *\$cache_time_interval', "\$cache_time_interval = '$cache_time_interval';", $wp_cache_config_file);
		} else { // clock
			wp_clear_scheduled_hook( 'wp_cache_gc' );
			$cache_schedule_type = 'time';
			if ( !isset( $_POST[ 'cache_scheduled_time' ] ) ||
				$_POST[ 'cache_scheduled_time' ] == '' ||
				5 != strlen( $_POST[ 'cache_scheduled_time' ] ) ||
				":" != substr( $_POST[ 'cache_scheduled_time' ], 2, 1 )
			)
				$_POST[ 'cache_scheduled_time' ] = '00:00';

			$cache_scheduled_time = $_POST[ 'cache_scheduled_time' ];

			if ( ! preg_match( '/[0-9][0-9]:[0-9][0-9]/', $cache_scheduled_time ) ) {
				$cache_scheduled_time = '00:00';
			}
			$schedules = wp_get_schedules();
			if ( !isset( $cache_schedule_interval ) )
				$cache_schedule_interval = 'daily';
			if ( isset( $_POST[ 'cache_schedule_interval' ] ) && isset( $schedules[ $_POST[ 'cache_schedule_interval' ] ] ) )
				$cache_schedule_interval = $_POST[ 'cache_schedule_interval' ];
			wp_cache_replace_line('^ *\$cache_schedule_type', "\$cache_schedule_type = '$cache_schedule_type';", $wp_cache_config_file);
			wp_cache_replace_line('^ *\$cache_schedule_interval', "\$cache_schedule_interval = '{$cache_schedule_interval}';", $wp_cache_config_file);
			wp_cache_replace_line('^ *\$cache_scheduled_time', "\$cache_scheduled_time = '$cache_scheduled_time';", $wp_cache_config_file);
			wp_schedule_event( strtotime( $cache_scheduled_time ), $cache_schedule_interval, 'wp_cache_gc' );
		}
	}
}

function wp_cache_sanitize_value($text, & $array) {
	$text = esc_html(strip_tags($text));
	$array = preg_split("/[\s,]+/", chop($text));
	$text = var_export($array, true);
	$text = preg_replace('/[\s]+/', ' ', $text);
	return $text;
}

function wp_cache_update_rejected_ua() {
	global $cache_rejected_user_agent, $wp_cache_config_file, $valid_nonce;

	if ( !function_exists( 'apache_request_headers' ) ) return;

	if ( isset( $_POST[ 'wp_rejected_user_agent' ] ) && $valid_nonce ) {
		$_POST[ 'wp_rejected_user_agent' ] = str_replace( ' ', '___', $_POST[ 'wp_rejected_user_agent' ] );
		$text = str_replace( '___', ' ', wp_cache_sanitize_value( $_POST[ 'wp_rejected_user_agent' ], $cache_rejected_user_agent ) );
		wp_cache_replace_line( '^ *\$cache_rejected_user_agent', "\$cache_rejected_user_agent = $text;", $wp_cache_config_file );
		foreach( $cache_rejected_user_agent as $k => $ua ) {
			$cache_rejected_user_agent[ $k ] = str_replace( '___', ' ', $ua );
		}
		reset( $cache_rejected_user_agent );
	}
}

function wpsc_edit_rejected_ua() {
	global $cache_rejected_user_agent;

	if ( ! function_exists( 'apache_request_headers' ) ) {
		return;
	}

	$admin_url = admin_url( 'options-general.php?page=wpsupercache' );
	wp_cache_update_rejected_ua();
	wpsc_render_partial(
		'rejected_user_agents',
		compact( 'cache_rejected_user_agent', 'admin_url' )
	);
}

function wp_cache_update_rejected_pages() {
	global $wp_cache_config_file, $valid_nonce, $wp_cache_pages;

	if ( isset( $_POST[ 'wp_edit_rejected_pages' ] ) && $valid_nonce ) {
		$pages = array( 'single', 'pages', 'archives', 'tag', 'frontpage', 'home', 'category', 'feed', 'author', 'search' );
		foreach( $pages as $page ) {
			if ( isset( $_POST[ 'wp_cache_pages' ][ $page ] ) ) {
				$value = 1;
			} else {
				$value = 0;
			}
			wp_cache_replace_line('^ *\$wp_cache_pages\[ "' . $page . '" \]', "\$wp_cache_pages[ \"{$page}\" ] = $value;", $wp_cache_config_file);
			$wp_cache_pages[ $page ] = $value;
		}
	}
}

function wpsc_update_tracking_parameters() {
	global $wpsc_tracking_parameters, $valid_nonce, $wp_cache_config_file;

	if ( isset( $_POST['tracking_parameters'] ) && $valid_nonce ) {
		$text = wp_cache_sanitize_value( str_replace( '\\\\', '\\', $_POST['tracking_parameters'] ), $wpsc_tracking_parameters );
		wp_cache_replace_line( '^ *\$wpsc_tracking_parameters', "\$wpsc_tracking_parameters = $text;", $wp_cache_config_file );
		wp_cache_setting( 'wpsc_ignore_tracking_parameters', isset( $_POST['wpsc_ignore_tracking_parameters'] ) ? 1 : 0 );
	}
}

function wpsc_edit_tracking_parameters() {
	global $wpsc_tracking_parameters, $wpsc_ignore_tracking_parameters;

	$admin_url = admin_url( 'options-general.php?page=wpsupercache' );
	wpsc_update_tracking_parameters();

	if ( ! isset( $wpsc_tracking_parameters ) ) {
		$wpsc_tracking_parameters = array( 'fbclid', 'ref', 'gclid', 'fb_source', 'mc_cid', 'mc_eid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_expid', 'mtm_source', 'mtm_medium', 'mtm_campaign', 'mtm_keyword', 'mtm_content', 'mtm_cid', 'mtm_group', 'mtm_placement' );
	}

	if ( ! isset( $wpsc_ignore_tracking_parameters ) ) {
		$wpsc_ignore_tracking_parameters = 0;
	}
	wpsc_render_partial(
		'tracking_parameters',
		compact( 'wpsc_ignore_tracking_parameters', 'wpsc_tracking_parameters', 'admin_url' )
	);
}

function wp_cache_update_rejected_cookies() {
	global $wpsc_rejected_cookies, $wp_cache_config_file, $valid_nonce;

	if ( isset( $_POST['wp_rejected_cookies'] ) && $valid_nonce ) {
		$text = wp_cache_sanitize_value( str_replace( '\\\\', '\\', $_POST['wp_rejected_cookies'] ), $wpsc_rejected_cookies );
		wp_cache_replace_line( '^ *\$wpsc_rejected_cookies', "\$wpsc_rejected_cookies = $text;", $wp_cache_config_file );
	}
}

function wp_cache_update_rejected_strings() {
	global $cache_rejected_uri, $wp_cache_config_file, $valid_nonce;

	if ( isset($_REQUEST['wp_rejected_uri']) && $valid_nonce ) {
		$text = wp_cache_sanitize_value( str_replace( '\\\\', '\\', $_REQUEST['wp_rejected_uri'] ), $cache_rejected_uri );
		wp_cache_replace_line('^ *\$cache_rejected_uri', "\$cache_rejected_uri = $text;", $wp_cache_config_file);
	}
}

function wp_cache_update_accepted_strings() {
	global $cache_acceptable_files, $wp_cache_config_file, $valid_nonce;

	if ( isset( $_REQUEST[ 'wp_accepted_files' ] ) && $valid_nonce ) {
		$text = wp_cache_sanitize_value( $_REQUEST[ 'wp_accepted_files' ], $cache_acceptable_files );
		wp_cache_replace_line( '^ *\$cache_acceptable_files', "\$cache_acceptable_files = $text;", $wp_cache_config_file );
	}
}

function wpsc_update_debug_settings() {
	global $wp_super_cache_debug, $wp_cache_debug_log, $wp_cache_debug_ip, $cache_path, $valid_nonce, $wp_cache_config_file, $wp_super_cache_comments;
	global $wp_super_cache_front_page_check, $wp_super_cache_front_page_clear, $wp_super_cache_front_page_text, $wp_super_cache_front_page_notification, $wp_super_cache_advanced_debug;
	global $wp_cache_debug_username;

	if ( ! isset( $wp_super_cache_comments ) ) {
		$wp_super_cache_comments = 1; // defaults to "enabled".
		wp_cache_setting( 'wp_super_cache_comments', $wp_super_cache_comments );
	}

	if ( false == $valid_nonce ) {
		return array (
			'wp_super_cache_debug' => $wp_super_cache_debug,
			'wp_cache_debug_log' => $wp_cache_debug_log,
			'wp_cache_debug_ip' => $wp_cache_debug_ip,
			'wp_super_cache_comments' => $wp_super_cache_comments,
			'wp_super_cache_front_page_check' => $wp_super_cache_front_page_check,
			'wp_super_cache_front_page_clear' => $wp_super_cache_front_page_clear,
			'wp_super_cache_front_page_text' => $wp_super_cache_front_page_text,
			'wp_super_cache_front_page_notification' => $wp_super_cache_front_page_notification,
			'wp_super_cache_advanced_debug' => $wp_super_cache_advanced_debug,
			'wp_cache_debug_username' => $wp_cache_debug_username,
		);
	}

	if ( isset( $_POST[ 'wpsc_delete_log' ] ) && $_POST[ 'wpsc_delete_log' ] == 1 && $wp_cache_debug_log != '' ) {
		@unlink( $cache_path . $wp_cache_debug_log );
		extract( wpsc_create_debug_log( $wp_cache_debug_log, $wp_cache_debug_username ) ); // $wp_cache_debug_log, $wp_cache_debug_username
	}

	if ( ! isset( $wp_cache_debug_log ) || $wp_cache_debug_log == '' ) {
		extract( wpsc_create_debug_log() ); // $wp_cache_debug_log, $wp_cache_debug_username
	} elseif ( ! file_exists( $cache_path . $wp_cache_debug_log ) ) { // make sure debug log exists before toggling debugging
		extract( wpsc_create_debug_log( $wp_cache_debug_log, $wp_cache_debug_username ) ); // $wp_cache_debug_log, $wp_cache_debug_username
	}
	$wp_super_cache_debug = ( isset( $_POST[ 'wp_super_cache_debug' ] ) && $_POST[ 'wp_super_cache_debug' ] == 1 ) ? 1 : 0;
	wp_cache_setting( 'wp_super_cache_debug', $wp_super_cache_debug );

	if ( isset( $_POST[ 'wp_cache_debug' ] ) ) {
		wp_cache_setting( 'wp_cache_debug_username', $wp_cache_debug_username );
		wp_cache_setting( 'wp_cache_debug_log', $wp_cache_debug_log );
		$wp_super_cache_comments = isset( $_POST[ 'wp_super_cache_comments' ] ) ? 1 : 0;
		wp_cache_setting( 'wp_super_cache_comments', $wp_super_cache_comments );
		if ( isset( $_POST[ 'wp_cache_debug_ip' ] ) && filter_var( $_POST[ 'wp_cache_debug_ip' ], FILTER_VALIDATE_IP ) ) {
			$wp_cache_debug_ip = esc_html( preg_replace( '/[ <>\'\"\r\n\t\(\)\$\[\];#]/', '', $_POST[ 'wp_cache_debug_ip' ] ) );
		} else {
			$wp_cache_debug_ip = '';
		}
		wp_cache_setting( 'wp_cache_debug_ip', $wp_cache_debug_ip );
		$wp_super_cache_front_page_check = isset( $_POST[ 'wp_super_cache_front_page_check' ] ) ? 1 : 0;
		wp_cache_setting( 'wp_super_cache_front_page_check', $wp_super_cache_front_page_check );
		$wp_super_cache_front_page_clear = isset( $_POST[ 'wp_super_cache_front_page_clear' ] ) ? 1 : 0;
		wp_cache_setting( 'wp_super_cache_front_page_clear', $wp_super_cache_front_page_clear );
		if ( isset( $_POST[ 'wp_super_cache_front_page_text' ] ) ) {
			$wp_super_cache_front_page_text = esc_html( preg_replace( '/[ <>\'\"\r\n\t\(\)\$\[\];#]/', '', $_POST[ 'wp_super_cache_front_page_text' ] ) );
		} else {
			$wp_super_cache_front_page_text = '';
		}
		wp_cache_setting( 'wp_super_cache_front_page_text', $wp_super_cache_front_page_text );
		$wp_super_cache_front_page_notification = isset( $_POST[ 'wp_super_cache_front_page_notification' ] ) ? 1 : 0;
		wp_cache_setting( 'wp_super_cache_front_page_notification', $wp_super_cache_front_page_notification );
		if ( $wp_super_cache_front_page_check == 1 && !wp_next_scheduled( 'wp_cache_check_site_hook' ) ) {
			wp_schedule_single_event( time() + 360 , 'wp_cache_check_site_hook' );
			wp_cache_debug( 'scheduled wp_cache_check_site_hook for 360 seconds time.' );
		}
	}

	return array (
		'wp_super_cache_debug' => $wp_super_cache_debug,
		'wp_cache_debug_log' => $wp_cache_debug_log,
		'wp_cache_debug_ip' => $wp_cache_debug_ip,
		'wp_super_cache_comments' => $wp_super_cache_comments,
		'wp_super_cache_front_page_check' => $wp_super_cache_front_page_check,
		'wp_super_cache_front_page_clear' => $wp_super_cache_front_page_clear,
		'wp_super_cache_front_page_text' => $wp_super_cache_front_page_text,
		'wp_super_cache_front_page_notification' => $wp_super_cache_front_page_notification,
		'wp_super_cache_advanced_debug' => $wp_super_cache_advanced_debug,
		'wp_cache_debug_username' => $wp_cache_debug_username,
	);
}

function wp_cache_enable() {
	global $wp_cache_config_file, $cache_enabled;

	if ( $cache_enabled ) {
		wp_cache_debug( 'wp_cache_enable: already enabled' );
		return true;
	}

	wp_cache_setting( 'cache_enabled', true );
	wp_cache_debug( 'wp_cache_enable: enable cache' );

	$cache_enabled = true;

	if ( wpsc_set_default_gc() ) {
		// gc might not be scheduled, check and schedule
		$timestamp = wp_next_scheduled( 'wp_cache_gc' );
		if ( false == $timestamp ) {
			wp_schedule_single_event( time() + 600, 'wp_cache_gc' );
		}
	}
}

function wp_cache_disable() {
	global $wp_cache_config_file, $cache_enabled;

	if ( ! $cache_enabled ) {
		wp_cache_debug( 'wp_cache_disable: already disabled' );
		return true;
	}

	wp_cache_setting( 'cache_enabled', false );
	wp_cache_debug( 'wp_cache_disable: disable cache' );

	$cache_enabled = false;

	wp_clear_scheduled_hook( 'wp_cache_check_site_hook' );
	wp_clear_scheduled_hook( 'wp_cache_gc' );
	wp_clear_scheduled_hook( 'wp_cache_gc_watcher' );
}

function wp_super_cache_enable() {
	global $supercachedir, $wp_cache_config_file, $super_cache_enabled;

	if ( $super_cache_enabled ) {
		wp_cache_debug( 'wp_super_cache_enable: already enabled' );
		return true;
	}

	wp_cache_setting( 'super_cache_enabled', true );
	wp_cache_debug( 'wp_super_cache_enable: enable cache' );

	$super_cache_enabled = true;

	if ( is_dir( $supercachedir . '.disabled' ) ) {
		if ( is_dir( $supercachedir ) ) {
			prune_super_cache( $supercachedir . '.disabled', true );
			@unlink( $supercachedir . '.disabled' );
		} else {
			@rename( $supercachedir . '.disabled', $supercachedir );
		}
	}
}

function wp_super_cache_disable() {
	global $cache_path, $supercachedir, $wp_cache_config_file, $super_cache_enabled;

	if ( ! $super_cache_enabled ) {
		wp_cache_debug( 'wp_super_cache_disable: already disabled' );
		return true;
	}

	wp_cache_setting( 'super_cache_enabled', false );
	wp_cache_debug( 'wp_super_cache_disable: disable cache' );

	$super_cache_enabled = false;

	if ( is_dir( $supercachedir ) ) {
		@rename( $supercachedir, $supercachedir . '.disabled' );
	}
	sleep( 1 ); // allow existing processes to write to the supercachedir and then delete it
	if ( function_exists( 'prune_super_cache' ) && is_dir( $supercachedir ) ) {
		prune_super_cache( $cache_path, true );
	}

	if ( $GLOBALS['wp_cache_mod_rewrite'] === 1 ) {
		remove_mod_rewrite_rules();
	}
}

function wp_cache_is_enabled() {
	global $wp_cache_config_file;

	if ( get_option( 'gzipcompression' ) ) {
		echo '<strong>' . __( 'Warning', 'wp-super-cache' ) . '</strong>: ' . __( 'GZIP compression is enabled in WordPress, wp-cache will be bypassed until you disable gzip compression.', 'wp-super-cache' );
		return false;
	}

	$lines = file( $wp_cache_config_file );
	foreach ( $lines as $line ) {
		if ( preg_match( '/^\s*\$cache_enabled\s*=\s*true\s*;/', $line ) ) {
			return true;
		}
	}

	return false;
}

function wp_cache_remove_index() {
	global $cache_path;

	if ( empty( $cache_path ) ) {
		return;
	}

	@unlink( $cache_path . "index.html" );
	@unlink( $cache_path . "supercache/index.html" );
	@unlink( $cache_path . "blogs/index.html" );
	if ( is_dir( $cache_path . "blogs" ) ) {
		$dir = new DirectoryIterator( $cache_path . "blogs" );
		foreach( $dir as $fileinfo ) {
			if ( $fileinfo->isDot() ) {
				continue;
			}
			if ( $fileinfo->isDir() ) {
				$directory = $cache_path . "blogs/" . $fileinfo->getFilename();
				if ( is_file( $directory . "/index.html" ) ) {
					unlink( $directory . "/index.html" );
				}
				if ( is_dir( $directory . "/meta" ) ) {
					if ( is_file( $directory . "/meta/index.html" ) ) {
						unlink( $directory . "/meta/index.html" );
					}
				}
			}
		}
	}
}

function wp_cache_index_notice() {
	global $wp_version, $cache_path;

	if ( false == wpsupercache_site_admin() )
		return false;
	if ( false == get_site_option( 'wp_super_cache_index_detected' ) )
		return false;

	if ( strlen( $cache_path ) < strlen( ABSPATH )
		|| ABSPATH != substr( $cache_path, 0, strlen( ABSPATH ) ) )
		return false; // cache stored outside web root

	if ( get_site_option( 'wp_super_cache_index_detected' ) == 2 ) {
		update_site_option( 'wp_super_cache_index_detected', 3 );
		echo "<div class='error' style='padding: 10px 10px 50px 10px'>";
		echo "<h2>" . __( 'WP Super Cache Warning!', 'wp-super-cache' ) . '</h2>';
		echo '<p>' . __( 'All users of this site have been logged out to refresh their login cookies.', 'wp-super-cache' ) . '</p>';
		echo '</div>';
		return false;
	} elseif ( get_site_option( 'wp_super_cache_index_detected' ) != 3 ) {
		echo "<div id='wpsc-index-warning' class='error notice' style='padding: 10px 10px 50px 10px'>";
		echo "<h2>" . __( 'WP Super Cache Warning!', 'wp-super-cache' ) . '</h2>';
		echo '<p>' . __( 'Your server is configured to show files and directories, which may expose sensitive data such as login cookies to attackers in the cache directories. That has been fixed by adding a file named index.html to each directory. If you use simple caching, consider moving the location of the cache directory on the Advanced Settings page.', 'wp-super-cache' ) . '</p>';
		echo "<p><strong>";
		_e( 'If you just installed WP Super Cache for the first time, you can dismiss this message. Otherwise, you should probably refresh the login cookies of all logged in WordPress users here by clicking the logout link below.', 'wp-super-cache' );
		echo "</strong></p>";
		if ( -1 == version_compare( $wp_version, '4.0' ) ) {
			echo '<p>' . __( 'Your site is using a very old version of WordPress. When you update to the latest version everyone will be logged out and cookie information updated.', 'wp-super-cache' ) . '</p>';
		} else {
			echo '<p>' . __( 'The logout link will log out all WordPress users on this site except you. Your authentication cookie will be updated, but you will not be logged out.', 'wp-super-cache' ) . '</p>';
		}
		echo "<a id='wpsc-dismiss' href='#'>" . __( 'Dismiss', 'wp-super-cache' ) . "</a>";
		if ( 1 == version_compare( $wp_version, '4.0' ) ) {
			echo "	| <a href='" . wp_nonce_url( admin_url( '?action=wpsclogout' ), 'wpsc_logout' ) . "'>" . __( 'Logout', 'wp-super-cache' ) . "</a>";
		}
		echo "</div>";
?>
		<script  type='text/javascript'>
		<!--
			jQuery(document).ready(function(){
				jQuery('#wpsc-dismiss').on("click",function() {
						jQuery.ajax({
							type: "post",url: "admin-ajax.php",data: { action: 'wpsc-index-dismiss', _ajax_nonce: '<?php echo wp_create_nonce( 'wpsc-index-dismiss' ); ?>' },
							beforeSend: function() {jQuery("#wpsc-index-warning").fadeOut('slow');},
						});
				})
			})
		//-->
		</script>
<?php
	}
}
add_action( 'admin_notices', 'wp_cache_index_notice' );

function wpsc_config_file_notices() {
	global $wp_cache_config_file;
	if ( ! isset( $_GET['page'] ) || $_GET['page'] != 'wpsupercache' ) {
		return false;
	}
	$notice = get_transient( 'wpsc_config_error' );
	if ( ! $notice ) {
		return false;
	}
	switch( $notice ) {
		case 'error_move_tmp_config_file':
			$msg = sprintf( __( 'Error: Could not rename temporary file to configuration file. Please make sure %s is writeable by the webserver.' ), $wp_cache_config_file );
			break;
		case 'config_file_ro':
			$msg = sprintf( __( 'Error: Configuration file is read only. Please make sure %s is writeable by the webserver.' ), $wp_cache_config_file );
			break;
		case 'tmp_file_ro':
			$msg = sprintf( __( 'Error: The directory containing the configuration file %s is read only. Please make sure it is writeable by the webserver.' ), $wp_cache_config_file );
			break;
		case 'config_file_not_loaded':
			$msg = sprintf( __( 'Error: Configuration file %s could not be loaded. Please reload the page.' ), $wp_cache_config_file );
			break;
		case 'config_file_missing':
			$msg = sprintf( __( 'Error: Configuration file %s is missing. Please reload the page.' ), $wp_cache_config_file );
			break;

	}
	echo '<div class="error"><p><strong>' . $msg . '</strong></p></div>';
}
add_action( 'admin_notices', 'wpsc_config_file_notices' );

function wpsc_dismiss_indexhtml_warning() {
		check_ajax_referer( "wpsc-index-dismiss" );
		update_site_option( 'wp_super_cache_index_detected', 3 );
		die();
}
add_action( 'wp_ajax_wpsc-index-dismiss', 'wpsc_dismiss_indexhtml_warning' );

function wp_cache_logout_all() {
	global $current_user;
	if ( isset( $_GET[ 'action' ] ) && $_GET[ 'action' ] == 'wpsclogout' && wp_verify_nonce( $_GET[ '_wpnonce' ], 'wpsc_logout' ) ) {
		$user_id = $current_user->ID;
		WP_Session_Tokens::destroy_all_for_all_users();
		wp_set_auth_cookie( $user_id, false, is_ssl() );
		update_site_option( 'wp_super_cache_index_detected', 2 );
		wp_redirect( admin_url() );
	}
}
if ( isset( $_GET[ 'action' ] ) && $_GET[ 'action' ] == 'wpsclogout' )
	add_action( 'admin_init', 'wp_cache_logout_all' );

function wp_cache_add_index_protection() {
	global $cache_path, $blog_cache_dir;

	if ( is_dir( $cache_path ) && false == is_file( "$cache_path/index.html" ) ) {
		$page = wp_remote_get( home_url( "/wp-content/cache/" ) );
		if ( false == is_wp_error( $page ) ) {
			if ( false == get_site_option( 'wp_super_cache_index_detected' )
				&& $page[ 'response' ][ 'code' ] == 200
				&& stripos( $page[ 'body' ], 'index of' ) ) {
				add_site_option( 'wp_super_cache_index_detected', 1 ); // only show this once
			}
		}
		if ( ! function_exists( 'insert_with_markers' ) ) {
                        include_once( ABSPATH . 'wp-admin/includes/misc.php' );
		}
		insert_with_markers( $cache_path . '.htaccess', "INDEX", array( 'Options -Indexes' ) );
	}

	$directories = array( $cache_path, $cache_path . '/supercache/', $cache_path . '/blogs/', $blog_cache_dir, $blog_cache_dir . "/meta" );
	foreach( $directories as $dir ) {
		if ( false == is_dir( $dir ) )
			@mkdir( $dir );
		if ( is_dir( $dir ) && false == is_file( "$dir/index.html" ) ) {
			$fp = @fopen( "$dir/index.html", 'w' );
			if ( $fp )
				fclose( $fp );
		}
	}
}

function wp_cache_add_site_cache_index() {
	global $cache_path;

	wp_cache_add_index_protection(); // root and supercache

	if ( is_dir( $cache_path . "blogs" ) ) {
		$dir = new DirectoryIterator( $cache_path . "blogs" );
		foreach( $dir as $fileinfo ) {
			if ( $fileinfo->isDot() ) {
				continue;
			}
			if ( $fileinfo->isDir() ) {
				$directory = $cache_path . "blogs/" . $fileinfo->getFilename();
				if ( false == is_file( $directory . "/index.html" ) ) {
					$fp = @fopen( $directory . "/index.html", 'w' );
					if ( $fp )
						fclose( $fp );
				}
				if ( is_dir( $directory . "/meta" ) ) {
					if ( false == is_file( $directory . "/meta/index.html" ) ) {
						$fp = @fopen( $directory . "/meta/index.html", 'w' );
						if ( $fp )
							fclose( $fp );
					}
				}
			}
		}
	}
}

function wp_cache_verify_cache_dir() {
	global $cache_path, $blog_cache_dir;

	$dir = dirname($cache_path);
	if ( !file_exists($cache_path) ) {
		if ( !is_writeable_ACLSafe( $dir ) || !($dir = mkdir( $cache_path ) ) ) {
				echo "<strong>" . __( 'Error', 'wp-super-cache' ) . ":</strong> " . sprintf( __( 'Your cache directory (<strong>%1$s</strong>) did not exist and couldn&#8217;t be created by the web server. Check %1$s permissions.', 'wp-super-cache' ), $dir );
				return false;
		}
	}
	if ( !is_writeable_ACLSafe($cache_path)) {
		echo "<strong>" . __( 'Error', 'wp-super-cache' ) . ":</strong> " . sprintf( __( 'Your cache directory (<strong>%1$s</strong>) or <strong>%2$s</strong> need to be writable for this plugin to work. Double-check it.', 'wp-super-cache' ), $cache_path, $dir );
		return false;
	}

	if ( '/' != substr($cache_path, -1)) {
		$cache_path .= '/';
	}

	if( false == is_dir( $blog_cache_dir ) ) {
		@mkdir( $cache_path . "blogs" );
		if( $blog_cache_dir != $cache_path . "blogs/" )
			@mkdir( $blog_cache_dir );
	}

	if( false == is_dir( $blog_cache_dir . 'meta' ) )
		@mkdir( $blog_cache_dir . 'meta' );

	wp_cache_add_index_protection();
	return true;
}

function wp_cache_verify_config_file() {
	global $wp_cache_config_file, $wp_cache_config_file_sample, $sem_id, $cache_path;
	global $WPSC_HTTP_HOST;

	$new = false;
	$dir = dirname($wp_cache_config_file);

	if ( file_exists($wp_cache_config_file) ) {
		$lines = join( ' ', file( $wp_cache_config_file ) );
		if( strpos( $lines, 'WPCACHEHOME' ) === false ) {
			if( is_writeable_ACLSafe( $wp_cache_config_file ) ) {
				@unlink( $wp_cache_config_file );
			} else {
				echo "<strong>" . __( 'Error', 'wp-super-cache' ) . ":</strong> " . sprintf( __( 'Your WP-Cache config file (<strong>%s</strong>) is out of date and not writable by the Web server. Please delete it and refresh this page.', 'wp-super-cache' ), $wp_cache_config_file );
				return false;
			}
		}
	} elseif( !is_writeable_ACLSafe($dir)) {
		echo "<strong>" . __( 'Error', 'wp-super-cache' ) . ":</strong> " . sprintf( __( 'Configuration file missing and %1$s  directory (<strong>%2$s</strong>) is not writable by the web server. Check its permissions.', 'wp-super-cache' ), WP_CONTENT_DIR, $dir );
		return false;
	}

	if ( !file_exists($wp_cache_config_file) ) {
		if ( !file_exists($wp_cache_config_file_sample) ) {
			echo "<strong>" . __( 'Error', 'wp-super-cache' ) . ":</strong> " . sprintf( __( 'Sample WP-Cache config file (<strong>%s</strong>) does not exist. Verify your installation.', 'wp-super-cache' ), $wp_cache_config_file_sample );
			return false;
		}
		copy($wp_cache_config_file_sample, $wp_cache_config_file);
		$dir = str_replace( str_replace( '\\', '/', WP_CONTENT_DIR ), '', str_replace( '\\', '/', __DIR__ ) );
		if ( is_file( __DIR__ . '/wp-cache-config-sample.php' ) ) {
			wp_cache_replace_line('define\(\ \'WPCACHEHOME', "\tdefine( 'WPCACHEHOME', WP_CONTENT_DIR . \"{$dir}/\" );", $wp_cache_config_file);
		} elseif ( is_file( __DIR__ . '/wp-super-cache/wp-cache-config-sample.php' ) ) {
			wp_cache_replace_line('define\(\ \'WPCACHEHOME', "\tdefine( 'WPCACHEHOME', WP_CONTENT_DIR . \"{$dir}/wp-super-cache/\" );", $wp_cache_config_file);
		}
		$new = true;
	}
	if ( $sem_id == 5419 && $cache_path != '' && $WPSC_HTTP_HOST != '' ) {
		$sem_id = crc32( $WPSC_HTTP_HOST . $cache_path ) & 0x7fffffff;
		wp_cache_replace_line('sem_id', '$sem_id = ' . $sem_id . ';', $wp_cache_config_file);
	}
	if ( $new ) {
		require($wp_cache_config_file);
		wpsc_set_default_gc( true );
	}
	return true;
}

function wp_cache_create_advanced_cache() {
	global $wpsc_advanced_cache_filename, $wpsc_advanced_cache_dist_filename;
	if ( file_exists( ABSPATH . 'wp-config.php') ) {
		$global_config_file = ABSPATH . 'wp-config.php';
	} elseif ( file_exists( dirname( ABSPATH ) . '/wp-config.php' ) ) {
		$global_config_file = dirname( ABSPATH ) . '/wp-config.php';
	} elseif ( defined( 'DEBIAN_FILE' ) && file_exists( DEBIAN_FILE ) ) {
		$global_config_file = DEBIAN_FILE;
	} else {
		die('Cannot locate wp-config.php');
	}

	$line = 'define( \'WPCACHEHOME\', \'' . __DIR__ . '/\' );';

	if ( ! apply_filters( 'wpsc_enable_wp_config_edit', true ) ) {
		echo '<div class="notice notice-error"><h4>' . __( 'Warning', 'wp-super-cache' ) . "! " . sprintf( __( 'Not allowed to edit %s per configuration.', 'wp-super-cache' ), $global_config_file ) . "</h4></div>";
		return false;
	}

	if (
		! strpos( file_get_contents( $global_config_file ), "WPCACHEHOME" ) ||
		(
			defined( 'WPCACHEHOME' ) &&
			(
				constant( 'WPCACHEHOME' ) == '' ||
				(
					constant( 'WPCACHEHOME' ) != '' &&
					! file_exists( constant( 'WPCACHEHOME' ) . '/wp-cache.php' )
				)
			)
		)
	) {
		if (
			! is_writeable_ACLSafe( $global_config_file ) ||
			! wp_cache_replace_line( 'define *\( *\'WPCACHEHOME\'', $line, $global_config_file )
		) {
			echo '<div class="notice notice-error"><h4>' . __( 'Warning', 'wp-super-cache' ) . "! <em>" . sprintf( __( 'Could not update %s!</em> WPCACHEHOME must be set in config file.', 'wp-super-cache' ), $global_config_file ) . "</h4></div>";
			return false;
		}
	}
	$ret = true;

	if ( file_exists( $wpsc_advanced_cache_filename ) ) {
		$file = file_get_contents( $wpsc_advanced_cache_filename );
		if (
			! strpos( $file, "WP SUPER CACHE 0.8.9.1" ) &&
			! strpos( $file, "WP SUPER CACHE 1.2" )
		) {
			return false;
		}
	}

	$file = file_get_contents( $wpsc_advanced_cache_dist_filename );
	$fp = @fopen( $wpsc_advanced_cache_filename, 'w' );
	if( $fp ) {
		fputs( $fp, $file );
		fclose( $fp );
	} else {
		$ret = false;
	}
	return $ret;
}

function wpsc_check_advanced_cache() {
	global $wpsc_advanced_cache_filename;

	$ret = true;
	$other_advanced_cache = false;
	if ( file_exists( $wpsc_advanced_cache_filename ) ) {
		$file = file_get_contents( $wpsc_advanced_cache_filename );
		if ( strpos( $file, "WP SUPER CACHE 0.8.9.1" ) || strpos( $file, "WP SUPER CACHE 1.2" ) ) {
			return true;
		} else {
			$other_advanced_cache = true;
			$ret = wp_cache_create_advanced_cache();
		}
	} else {
		$ret = wp_cache_create_advanced_cache();
	}

	if ( false == $ret ) {
		if ( $other_advanced_cache ) {
			echo '<div style="width: 50%" class="notice notice-error"><h2>' . __( 'Warning! You may not be allowed to use this plugin on your site.', 'wp-super-cache' ) . "</h2>";
			echo '<p>' .
				sprintf(
					__( 'The file %s was created by another plugin or by your system administrator. Please examine the file carefully by FTP or SSH and consult your hosting documentation. ', 'wp-super-cache' ),
					$wpsc_advanced_cache_filename
				) .
				'</p>';
			echo '<p>' .
				__( 'If it was created by another caching plugin please uninstall that plugin first before activating WP Super Cache. If the file is not removed by that action you should delete the file manually.', 'wp-super-cache' ),
				'</p>';
			echo '<p><strong>' .
				__( 'If you need support for this problem contact your hosting provider.', 'wp-super-cache' ),
				'</strong></p>';
		} elseif ( ! is_writeable_ACLSafe( $wpsc_advanced_cache_filename ) ) {
			echo '<div class="notice notice-error"><h2>' . __( 'Warning', 'wp-super-cache' ) . "! <em>" . sprintf( __( '%s/advanced-cache.php</em> cannot be updated.', 'wp-super-cache' ), WP_CONTENT_DIR ) . "</h2>";
			echo '<ol>';
			echo "<li>" .
				sprintf(
					__( 'Make %1$s writable using the chmod command through your ftp or server software. (<em>chmod 777 %1$s</em>) and refresh this page. This is only a temporary measure and you&#8217;ll have to make it read only afterwards again. (Change 777 to 755 in the previous command)', 'wp-super-cache' ),
					WP_CONTENT_DIR
				) .
				"</li>";
			echo "<li>" . sprintf( __( 'Refresh this page to update <em>%s/advanced-cache.php</em>', 'wp-super-cache' ), WP_CONTENT_DIR ) . "</li></ol>";
			echo sprintf( __( 'If that doesn&#8217;t work, make sure the file <em>%s/advanced-cache.php</em> doesn&#8217;t exist:', 'wp-super-cache' ), WP_CONTENT_DIR ) . "<ol>";
			echo "</ol>";
		}
		echo "</div>";
		return false;
	}
	return true;
}

function wp_cache_check_global_config() {
	global $wp_cache_check_wp_config;

	if ( !isset( $wp_cache_check_wp_config ) )
		return true;


	if ( file_exists( ABSPATH . 'wp-config.php') ) {
		$global_config_file = ABSPATH . 'wp-config.php';
	} else {
		$global_config_file = dirname( ABSPATH ) . '/wp-config.php';
	}

	$line = 'define(\'WP_CACHE\', true);';
	if (
		! is_writeable_ACLSafe( $global_config_file ) ||
		! wp_cache_replace_line( 'define *\( *\'WP_CACHE\'', $line, $global_config_file )
	) {
		if ( defined( 'WP_CACHE' ) && constant( 'WP_CACHE' ) == false ) {
			echo '<div class="notice notice-error">' . __( "<h4>WP_CACHE constant set to false</h4><p>The WP_CACHE constant is used by WordPress to load the code that serves cached pages. Unfortunately, it is set to false. Please edit your wp-config.php and add or edit the following line above the final require_once command:<br /><br /><code>define('WP_CACHE', true);</code></p>", 'wp-super-cache' ) . "</div>";
		} else {
			echo '<div class="notice notice-error"><p>' . __( "<strong>Error: WP_CACHE is not enabled</strong> in your <code>wp-config.php</code> file and I couldn&#8217;t modify it.", 'wp-super-cache' ) . "</p>";
			echo "<p>" . sprintf( __( "Edit <code>%s</code> and add the following line:<br /> <code>define('WP_CACHE', true);</code><br />Otherwise, <strong>WP-Cache will not be executed</strong> by WordPress core. ", 'wp-super-cache' ), $global_config_file ) . "</p></div>";
		}
		return false;
	}  else {
		echo "<div class='notice notice-warning'>" . __( '<h4>WP_CACHE constant added to wp-config.php</h4><p>If you continue to see this warning message please see point 5 of the <a href="https://wordpress.org/plugins/wp-super-cache/faq/">Troubleshooting Guide</a>. The WP_CACHE line must be moved up.', 'wp-super-cache' ) . "</p></div>";
	}
	return true;
}

function wpsc_generate_sizes_array() {
	$sizes = array();
	$cache_types  = apply_filters( 'wpsc_cache_types', array( 'supercache', 'wpcache' ) );
	$cache_states = apply_filters( 'wpsc_cache_state', array( 'expired', 'cached' ) );
	foreach( $cache_types as $type ) {
		reset( $cache_states );
		foreach( $cache_states as $state ) {
			$sizes[ $type ][ $state ] = 0;
		}
		$sizes[ $type ][ 'fsize' ] = 0;
		$sizes[ $type ][ 'cached_list' ] = array();
		$sizes[ $type ][ 'expired_list' ] = array();
	}
	return $sizes;
}

function wp_cache_format_fsize( $fsize ) {
	if ( $fsize > 1024 ) {
		$fsize = number_format( $fsize / 1024, 2 ) . "MB";
	} elseif ( $fsize != 0 ) {
		$fsize = number_format( $fsize, 2 ) . "KB";
	} else {
		$fsize = "0KB";
	}
	return $fsize;
}

function wp_cache_regenerate_cache_file_stats() {
	global $cache_compression, $supercachedir, $file_prefix, $wp_cache_preload_on, $cache_max_time;

	if ( $supercachedir == '' )
		$supercachedir = get_supercache_dir();

	$sizes = wpsc_generate_sizes_array();
	$now = time();
	if (is_dir( $supercachedir ) ) {
		if ( $dh = opendir( $supercachedir ) ) {
			while ( ( $entry = readdir( $dh ) ) !== false ) {
				if ( $entry != '.' && $entry != '..' ) {
					$sizes = wpsc_dirsize( trailingslashit( $supercachedir ) . $entry, $sizes );
				}
			}
			closedir( $dh );
		}
	}
	foreach( $sizes as $cache_type => $list ) {
		foreach( array( 'cached_list', 'expired_list' ) as $status ) {
			$cached_list = array();
			foreach( $list[ $status ] as $dir => $details ) {
				if ( $details[ 'files' ] == 2 && !isset( $details[ 'upper_age' ] ) ) {
					$details[ 'files' ] = 1;
				}
				$cached_list[ $dir ] = $details;
			}
			$sizes[ $cache_type ][ $status ] = $cached_list;
		}
	}
	if ( $cache_compression ) {
		$sizes[ 'supercache' ][ 'cached' ]  = intval( $sizes[ 'supercache' ][ 'cached' ] / 2 );
		$sizes[ 'supercache' ][ 'expired' ] = intval( $sizes[ 'supercache' ][ 'expired' ] / 2 );
	}
	$cache_stats = array( 'generated' => time(), 'supercache' => $sizes[ 'supercache' ], 'wpcache' => $sizes[ 'wpcache' ] );
	update_option( 'supercache_stats', $cache_stats );
	return $cache_stats;
}

function wp_cache_files() {
	global $cache_path, $file_prefix, $cache_max_time, $valid_nonce, $supercachedir, $super_cache_enabled, $blog_cache_dir, $cache_compression;
	global $wp_cache_preload_on;

	if ( '/' != substr($cache_path, -1)) {
		$cache_path .= '/';
	}

	if ( $valid_nonce ) {
		if(isset($_REQUEST['wp_delete_cache'])) {
			wp_cache_clean_cache($file_prefix);
			$_GET[ 'action' ] = 'regenerate_cache_stats';
		}
		if ( isset( $_REQUEST[ 'wp_delete_all_cache' ] ) ) {
			wp_cache_clean_cache( $file_prefix, true );
			$_GET[ 'action' ] = 'regenerate_cache_stats';
		}
		if(isset($_REQUEST['wp_delete_expired'])) {
			wp_cache_clean_expired($file_prefix);
			$_GET[ 'action' ] = 'regenerate_cache_stats';
		}
	}
	echo "<a name='listfiles'></a>";
	echo '<fieldset class="options" id="show-this-fieldset"><h4>' . __( 'Cache Contents', 'wp-super-cache' ) . '</h4>';

	$cache_stats = get_option( 'supercache_stats' );
	if ( !is_array( $cache_stats ) || ( isset( $_GET[ 'listfiles' ] ) ) || ( $valid_nonce && array_key_exists('action', $_GET) && $_GET[ 'action' ] == 'regenerate_cache_stats' ) ) {
	$count = 0;
	$expired = 0;
	$now = time();
	$wp_cache_fsize = 0;
	if ( ( $handle = @opendir( $blog_cache_dir ) ) ) {
		if ( $valid_nonce && isset( $_GET[ 'action' ] ) && $_GET[ 'action' ] == 'deletewpcache' ) {
			$deleteuri = wpsc_deep_replace( array( '..', '\\', 'index.php' ), preg_replace( '/[ <>\'\"\r\n\t\(\)]/', '', base64_decode( $_GET[ 'uri' ] ) ) );
		} else {
			$deleteuri = '';
		}

		if ( $valid_nonce && isset( $_GET[ 'action' ] ) && $_GET[ 'action' ] == 'deletesupercache' ) {
			$supercacheuri = wpsc_deep_replace( array( '..', '\\', 'index.php' ), preg_replace( '/[ <>\'\"\r\n\t\(\)]/', '', preg_replace("/(\?.*)?$/", '', base64_decode( $_GET[ 'uri' ] ) ) ) );
			$supercacheuri = trailingslashit( realpath( $cache_path . 'supercache/' . $supercacheuri ) );
			if ( wp_cache_confirm_delete( $supercacheuri ) ) {
				printf( __( "Deleting supercache file: <strong>%s</strong><br />", 'wp-super-cache' ), $supercacheuri );
				wpsc_delete_files( $supercacheuri );
				prune_super_cache( $supercacheuri . 'page', true );
				@rmdir( $supercacheuri );
			} else {
				wp_die( __( 'Warning! You are not allowed to delete that file', 'wp-super-cache' ) );
			}
		}
		while( false !== ( $file = readdir( $handle ) ) ) {
			if ( strpos( $file, $file_prefix ) !== false && substr( $file, -4 ) == '.php' ) {
				if ( false == file_exists( $blog_cache_dir . 'meta/' . $file ) ) {
					@unlink( $blog_cache_dir . $file );
					continue; // meta does not exist
				}
				$mtime = filemtime( $blog_cache_dir . 'meta/' . $file );
				$fsize = @filesize( $blog_cache_dir . $file );
				if ( $fsize > 0 )
					$fsize = $fsize - 15; // die() command takes 15 bytes at the start of the file

				$age = $now - $mtime;
				if ( $valid_nonce && isset( $_GET[ 'listfiles' ] ) ) {
					$meta = json_decode( wp_cache_get_legacy_cache( $blog_cache_dir . 'meta/' . $file ), true );
					if ( $deleteuri != '' && $meta[ 'uri' ] == $deleteuri ) {
						printf( __( "Deleting wp-cache file: <strong>%s</strong><br />", 'wp-super-cache' ), esc_html( $deleteuri ) );
						@unlink( $blog_cache_dir . 'meta/' . $file );
						@unlink( $blog_cache_dir . $file );
						continue;
					}
					$meta[ 'age' ] = $age;
					foreach( $meta as $key => $val )
						$meta[ $key ] = esc_html( $val );
					if ( $cache_max_time > 0 && $age > $cache_max_time ) {
						$expired_list[ $age ][] = $meta;
					} else {
						$cached_list[ $age ][] = $meta;
					}
				}

				if ( $cache_max_time > 0 && $age > $cache_max_time ) {
						++$expired;
				} else {
						++$count;
				}
				$wp_cache_fsize += $fsize;
			}
		}
		closedir($handle);
	}
	if( $wp_cache_fsize != 0 ) {
		$wp_cache_fsize = $wp_cache_fsize/1024;
	} else {
		$wp_cache_fsize = 0;
	}
	if( $wp_cache_fsize > 1024 ) {
		$wp_cache_fsize = number_format( $wp_cache_fsize / 1024, 2 ) . "MB";
	} elseif( $wp_cache_fsize != 0 ) {
		$wp_cache_fsize = number_format( $wp_cache_fsize, 2 ) . "KB";
	} else {
		$wp_cache_fsize = '0KB';
	}
	$cache_stats = wp_cache_regenerate_cache_file_stats();
	} else {
		echo "<p>" . __( 'Cache stats are not automatically generated. You must click the link below to regenerate the stats on this page.', 'wp-super-cache' ) . "</p>";
		echo "<a href='" . wp_nonce_url( add_query_arg( array( 'page' => 'wpsupercache', 'tab' => 'contents', 'action' => 'regenerate_cache_stats' ) ), 'wp-cache' ) . "'>" . __( 'Regenerate cache stats', 'wp-super-cache' ) . "</a>";
		if ( is_array( $cache_stats ) ) {
			echo "<p>" . sprintf( __( 'Cache stats last generated: %s minutes ago.', 'wp-super-cache' ), number_format( ( time() - $cache_stats[ 'generated' ] ) / 60 ) ) . "</p>";
		}
		$cache_stats = get_option( 'supercache_stats' );
	}// regerate stats cache

	if ( is_array( $cache_stats ) ) {
		$fsize = wp_cache_format_fsize( $cache_stats[ 'wpcache' ][ 'fsize' ] / 1024 );
		echo "<p><strong>" . __( 'WP-Cache', 'wp-super-cache' ) . " ({$fsize})</strong></p>";
		echo "<ul><li>" . sprintf( __( '%s Cached Pages', 'wp-super-cache' ), $cache_stats[ 'wpcache' ][ 'cached' ] ) . "</li>";
		echo "<li>" . sprintf( __( '%s Expired Pages', 'wp-super-cache' ),    $cache_stats[ 'wpcache' ][ 'expired' ] ) . "</li></ul>";
		if ( array_key_exists('fsize', (array)$cache_stats[ 'supercache' ]) )
			$fsize = $cache_stats[ 'supercache' ][ 'fsize' ] / 1024;
		else
			$fsize = 0;
		$fsize = wp_cache_format_fsize( $fsize );
		echo "<p><strong>" . __( 'WP-Super-Cache', 'wp-super-cache' ) . " ({$fsize})</strong></p>";
		echo "<ul><li>" . sprintf( __( '%s Cached Pages', 'wp-super-cache' ), $cache_stats[ 'supercache' ][ 'cached' ] ) . "</li>";
		if ( isset( $now ) && isset( $cache_stats ) )
			$age = intval( ( $now - $cache_stats['generated'] ) / 60 );
		else
			$age = 0;
		echo "<li>" . sprintf( __( '%s Expired Pages', 'wp-super-cache' ), $cache_stats[ 'supercache' ][ 'expired' ] ) . "</li></ul>";
		if ( $valid_nonce && array_key_exists('listfiles', $_GET) && isset( $_GET[ 'listfiles' ] ) ) {
			echo "<div style='padding: 10px; border: 1px solid #333; height: 400px; width: 90%; overflow: auto'>";
			$cache_description = array( 'supercache' => __( 'WP-Super-Cached', 'wp-super-cache' ), 'wpcache' => __( 'WP-Cached', 'wp-super-cache' ) );
			foreach( $cache_stats as $type => $details ) {
				if ( is_array( $details ) == false )
					continue;
				foreach( array( 'cached_list' => 'Fresh', 'expired_list' => 'Stale' ) as $list => $description ) {
					if ( is_array( $details[ $list ] ) & !empty( $details[ $list ] ) ) {
						echo "<h5>" . sprintf( __( '%s %s Files', 'wp-super-cache' ), $description, $cache_description[ $type ] ) . "</h5>";
						echo "<table class='widefat'><tr><th>#</th><th>" . __( 'URI', 'wp-super-cache' ) . "</th><th>" . __( 'Files', 'wp-super-cache' ) . "</th><th>" . __( 'Age', 'wp-super-cache' ) . "</th><th>" . __( 'Delete', 'wp-super-cache' ) . "</th></tr>";
						$c = 1;
						$flip = 1;

						ksort( $details[ $list ] );
						foreach( $details[ $list ] as $directory => $d ) {
							if ( isset( $d[ 'upper_age' ] ) ) {
								$age = "{$d[ 'lower_age' ]} - {$d[ 'upper_age' ]}";
							} else {
								$age = $d[ 'lower_age' ];
							}
							$bg = $flip ? 'style="background: #EAEAEA;"' : '';
							echo "<tr $bg><td>$c</td><td> <a href='http://{$directory}'>{$directory}</a></td><td>{$d[ 'files' ]}</td><td>{$age}</td><td><a href='" . wp_nonce_url( add_query_arg( array( 'page' => 'wpsupercache', 'action' => 'deletesupercache', 'uri' => base64_encode( $directory ) ) ), 'wp-cache' ) . "#listfiles'>X</a></td></tr>\n";
							$flip = !$flip;
							++$c;
						}
						echo "</table>";
					}
				}
			}
			echo "</div>";
			echo "<p><a href='?page=wpsupercache&tab=contents#top'>" . __( 'Hide file list', 'wp-super-cache' ) . "</a></p>";
		} elseif ( $cache_stats[ 'supercache' ][ 'cached' ] > 500 || $cache_stats[ 'supercache' ][ 'expired' ] > 500 || $cache_stats[ 'wpcache' ][ 'cached' ] > 500 || $cache_stats[ 'wpcache' ][ 'expired' ] > 500 ) {
			echo "<p><em>" . __( 'Too many cached files, no listing possible.', 'wp-super-cache' ) . "</em></p>";
		} else {
			echo "<p><a href='" . wp_nonce_url( add_query_arg( array( 'page' => 'wpsupercache', 'listfiles' => '1' ) ), 'wp-cache' ) . "#listfiles'>" . __( 'List all cached files', 'wp-super-cache' ) . "</a></p>";
		}
		if ( $cache_max_time > 0 )
			echo "<p>" . sprintf( __( 'Expired files are files older than %s seconds. They are still used by the plugin and are deleted periodically.', 'wp-super-cache' ), $cache_max_time ) . "</p>";
		if ( $wp_cache_preload_on )
			echo "<p>" . __( 'Preload mode is enabled. Supercache files will never be expired.', 'wp-super-cache' ) . "</p>";
	} // cache_stats
	wp_cache_delete_buttons();

	echo '</fieldset>';
}

function wp_cache_delete_buttons() {

	$admin_url = admin_url( 'options-general.php?page=wpsupercache' );

	echo '<form name="wp_cache_content_expired" action="' . esc_url_raw( add_query_arg( 'tab', 'contents', $admin_url ) . '#listfiles' ) . '" method="post">';
	echo '<input type="hidden" name="wp_delete_expired" />';
	echo '<div class="submit" style="float:left"><input class="button-primary" type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Delete Expired', 'wp-super-cache' ) . '" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";

	echo '<form name="wp_cache_content_delete" action="' . esc_url_raw( add_query_arg( 'tab', 'contents', $admin_url ) . '#listfiles' ) . '" method="post">';
	echo '<input type="hidden" name="wp_delete_cache" />';
	echo '<div class="submit" style="float:left;margin-left:10px"><input id="deletepost" class="button-secondary" type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Delete Cache', 'wp-super-cache' ) . '" /></div>';
	wp_nonce_field('wp-cache');
	echo "</form>\n";
	if ( is_multisite() && wpsupercache_site_admin() ) {
		echo '<form name="wp_cache_content_delete" action="' . esc_url_raw( add_query_arg( 'tab', 'contents', $admin_url ) . '#listfiles' ) . '" method="post">';
		echo '<input type="hidden" name="wp_delete_all_cache" />';
		echo '<div class="submit" style="float:left;margin-left:10px"><input id="deleteallpost" class="button-secondary" type="submit" ' . SUBMITDISABLED . 'value="' . __( 'Delete Cache On All Blogs', 'wp-super-cache' ) . '" /></div>';
		wp_nonce_field('wp-cache');
		echo "</form>\n";
	}
}

function delete_cache_dashboard() {
	if ( function_exists( '_deprecated_function' ) ) {
		_deprecated_function( __FUNCTION__, 'WP Super Cache 1.6.4' );
	}

	if ( false == wpsupercache_site_admin() )
		return false;

	if ( function_exists('current_user_can') && !current_user_can('manage_options') )
		return false;

	echo "<li><a href='" . wp_nonce_url( 'options-general.php?page=wpsupercache&wp_delete_cache=1', 'wp-cache' ) . "' target='_blank' title='" . __( 'Delete Super Cache cached files (opens in new window)', 'wp-super-cache' ) . "'>" . __( 'Delete Cache', 'wp-super-cache' ) . "</a></li>";
}
//add_action( 'dashmenu', 'delete_cache_dashboard' );

function wpsc_dirsize($directory, $sizes) {
	global $cache_max_time, $cache_path, $valid_nonce, $wp_cache_preload_on, $file_prefix;
	$now = time();

	if (is_dir($directory)) {
		if( $dh = opendir( $directory ) ) {
			while( ( $entry = readdir( $dh ) ) !== false ) {
				if ($entry != '.' && $entry != '..') {
					$sizes = wpsc_dirsize( trailingslashit( $directory ) . $entry, $sizes );
				}
			}
			closedir($dh);
		}
	} elseif ( is_file( $directory ) && strpos( $directory, 'meta-' . $file_prefix ) === false ) {
		if ( strpos( $directory, '/' . $file_prefix ) !== false ) {
			$cache_type = 'wpcache';
		} else {
			$cache_type = 'supercache';
		}
		$keep_fresh = false;
		if ( $cache_type === 'supercache' && $wp_cache_preload_on ) {
			$keep_fresh = true;
		}
		$filem = filemtime( $directory );
		if ( ! $keep_fresh && $cache_max_time > 0 && $filem + $cache_max_time <= $now ) {
			$cache_status = 'expired';
		} else {
			$cache_status = 'cached';
		}
		$sizes[ $cache_type ][ $cache_status ] += 1;
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Presumably the caller should handle it if necessary.
		if ( $valid_nonce && isset( $_GET['listfiles'] ) ) {
			$dir = str_replace( $cache_path . 'supercache/', '', dirname( $directory ) );
			$age = $now - $filem;
			if ( ! isset( $sizes[ $cache_type ][ $cache_status . '_list' ][ $dir ] ) ) {
				$sizes[ $cache_type ][ $cache_status . '_list' ][ $dir ]['lower_age'] = $age;
				$sizes[ $cache_type ][ $cache_status . '_list' ][ $dir ]['files']     = 1;
			} else {
				$sizes[ $cache_type ][ $cache_status . '_list' ][ $dir ]['files'] += 1;
				if ( $age <= $sizes[ $cache_type ][ $cache_status . '_list' ][ $dir ]['lower_age'] ) {

					if ( $age < $sizes[ $cache_type ][ $cache_status . '_list' ][ $dir ]['lower_age'] && ! isset( $sizes[ $cache_type ][ $cache_status . '_list' ][ $dir ]['upper_age'] ) ) {
						$sizes[ $cache_type ][ $cache_status . '_list' ][ $dir ]['upper_age'] = $sizes[ $cache_type ][ $cache_status . '_list' ][ $dir ]['lower_age'];
					}

					$sizes[ $cache_type ][ $cache_status . '_list' ][ $dir ]['lower_age'] = $age;

				} elseif ( ! isset( $sizes[ $cache_type ][ $cache_status . '_list' ][ $dir ]['upper_age'] ) || $age > $sizes[ $cache_type ][ $cache_status . '_list' ][ $dir ]['upper_age'] ) {

					$sizes[ $cache_type ][ $cache_status . '_list' ][ $dir ]['upper_age'] = $age;

				}
			}
		}
		if ( ! isset( $sizes['fsize'] ) ) {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			$sizes[ $cache_type ]['fsize'] = @filesize( $directory );
		} else {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			$sizes[ $cache_type ]['fsize'] += @filesize( $directory );
		}
	}
	return $sizes;
}

function wp_cache_clean_cache( $file_prefix, $all = false ) {
	global $cache_path, $supercachedir, $blog_cache_dir;

	do_action( 'wp_cache_cleared' );

	if ( $all == true && wpsupercache_site_admin() && function_exists( 'prune_super_cache' ) ) {
		prune_super_cache( $cache_path, true );
		return true;
	}
	if ( $supercachedir == '' )
		$supercachedir = get_supercache_dir();

	if (function_exists ('prune_super_cache')) {
		if( is_dir( $supercachedir ) ) {
			prune_super_cache( $supercachedir, true );
		} elseif( is_dir( $supercachedir . '.disabled' ) ) {
			prune_super_cache( $supercachedir . '.disabled', true );
		}
		$_POST[ 'super_cache_stats' ] = 1; // regenerate super cache stats;
	} else {
		wp_cache_debug( 'Warning! prune_super_cache() not found in wp-cache.php', 1 );
	}

	wp_cache_clean_legacy_files( $blog_cache_dir, $file_prefix );
	wp_cache_clean_legacy_files( $cache_path, $file_prefix );
}

function wpsc_delete_post_cache( $id ) {
	$post = get_post( $id );
	wpsc_delete_url_cache( get_author_posts_url( $post->post_author ) );
	$permalink = get_permalink( $id );
	if ( $permalink != '' ) {
		wpsc_delete_url_cache( $permalink );
		return true;
	} else {
		return false;
	}
}

function wp_cache_clean_legacy_files( $dir, $file_prefix ) {
	global $wpdb;

	$dir = trailingslashit( $dir );
	if ( @is_dir( $dir . 'meta' ) == false )
		return false;

	if ( $handle = @opendir( $dir ) ) {
		$curr_blog_id = is_multisite() ? get_current_blog_id() : false;

		while ( false !== ( $file = readdir( $handle ) ) ) {
			if ( is_file( $dir . $file ) == false || $file == 'index.html' ) {
				continue;
			}

			if ( strpos( $file, $file_prefix ) !== false ) {
				if ( strpos( $file, '.html' ) ) {
					// delete old WPCache files immediately
					@unlink( $dir . $file);
					@unlink( $dir . 'meta/' . str_replace( '.html', '.meta', $file ) );
				} else {
					$meta = json_decode( wp_cache_get_legacy_cache( $dir . 'meta/' . $file ), true );
					if (  $curr_blog_id && $curr_blog_id !== (int)$meta['blog_id'] ) {
						continue;
					}
					@unlink( $dir . $file);
					@unlink( $dir . 'meta/' . $file);
				}
			}
		}
		closedir($handle);
	}
}

function wp_cache_clean_expired($file_prefix) {
	global $cache_max_time, $blog_cache_dir, $wp_cache_preload_on;

	if ( $cache_max_time == 0 ) {
		return false;
	}

	// If phase2 was compiled, use its function to avoid race-conditions
	if(function_exists('wp_cache_phase2_clean_expired')) {
		if ( $wp_cache_preload_on != 1 && function_exists ('prune_super_cache')) {
			$dir = get_supercache_dir();
			if( is_dir( $dir ) ) {
				prune_super_cache( $dir );
			} elseif( is_dir( $dir . '.disabled' ) ) {
				prune_super_cache( $dir . '.disabled' );
			}
			$_POST[ 'super_cache_stats' ] = 1; // regenerate super cache stats;
		}
		return wp_cache_phase2_clean_expired($file_prefix);
	}

	$now = time();
	if ( $handle = @opendir( $blog_cache_dir ) ) {
		while ( false !== ( $file = readdir( $handle ) ) ) {
			if ( strpos( $file, $file_prefix ) !== false ) {
				if ( strpos( $file, '.html' ) ) {
					@unlink( $blog_cache_dir . $file);
					@unlink( $blog_cache_dir . 'meta/' . str_replace( '.html', '.meta', $file ) );
				} elseif ( ( filemtime( $blog_cache_dir . $file ) + $cache_max_time ) <= $now ) {
					@unlink( $blog_cache_dir . $file );
					@unlink( $blog_cache_dir . 'meta/' . $file );
				}
			}
		}
		closedir($handle);
	}
}

function wpsc_remove_marker( $filename, $marker ) {
	if (!file_exists( $filename ) || is_writeable_ACLSafe( $filename ) ) {
		if (!file_exists( $filename ) ) {
			return '';
		} else {
			$markerdata = explode( "\n", implode( '', file( $filename ) ) );
		}

		$f = fopen( $filename, 'w' );
		if ( $markerdata ) {
			$state = true;
			foreach ( $markerdata as $n => $markerline ) {
				if (strpos($markerline, '# BEGIN ' . $marker) !== false)
					$state = false;
				if ( $state ) {
					if ( $n + 1 < count( $markerdata ) )
						fwrite( $f, "{$markerline}\n" );
					else
						fwrite( $f, "{$markerline}" );
				}
				if (strpos($markerline, '# END ' . $marker) !== false) {
					$state = true;
				}
			}
		}
		return true;
	} else {
		return false;
	}
}

if( get_option( 'gzipcompression' ) )
	update_option( 'gzipcompression', 0 );

// Catch 404 requests. Themes that use query_posts() destroy $wp_query->is_404
function wp_cache_catch_404() {
	global $wp_cache_404;
	if ( function_exists( '_deprecated_function' ) )
		_deprecated_function( __FUNCTION__, 'WP Super Cache 1.5.6' );
	$wp_cache_404 = false;
	if( is_404() )
		$wp_cache_404 = true;
}
//More info - https://github.com/Automattic/wp-super-cache/pull/373
//add_action( 'template_redirect', 'wp_cache_catch_404' );

function wp_cache_favorite_action( $actions ) {
	if ( function_exists( '_deprecated_function' ) ) {
		_deprecated_function( __FUNCTION__, 'WP Super Cache 1.6.4' );
	}

	if ( false == wpsupercache_site_admin() )
		return $actions;

	if ( function_exists('current_user_can') && !current_user_can('manage_options') )
		return $actions;

	$actions[ wp_nonce_url( 'options-general.php?page=wpsupercache&wp_delete_cache=1&tab=contents', 'wp-cache' ) ] = array( __( 'Delete Cache', 'wp-super-cache' ), 'manage_options' );

	return $actions;
}
//add_filter( 'favorite_actions', 'wp_cache_favorite_action' );

function wp_cache_plugin_notice( $plugin ) {
	global $cache_enabled;
	if( $plugin == 'wp-super-cache/wp-cache.php' && !$cache_enabled && function_exists( 'admin_url' ) )
		echo '<td colspan="5" class="plugin-update">' . sprintf( __( 'WP Super Cache must be configured. Go to <a href="%s">the admin page</a> to enable and configure the plugin.', 'wp-super-cache' ), admin_url( 'options-general.php?page=wpsupercache' ) ) . '</td>';
}
add_action( 'after_plugin_row', 'wp_cache_plugin_notice' );

function wp_cache_plugin_actions( $links, $file ) {
	if( $file == 'wp-super-cache/wp-cache.php' && function_exists( 'admin_url' ) ) {
		$settings_link = '<a href="' . admin_url( 'options-general.php?page=wpsupercache' ) . '">' . __( 'Settings', 'wp-super-cache' ) . '</a>';
		array_unshift( $links, $settings_link ); // before other links
	}
	return $links;
}
add_filter( 'plugin_action_links', 'wp_cache_plugin_actions', 10, 2 );

function wp_cache_admin_notice() {
	global $cache_enabled, $wp_cache_phase1_loaded;
	if( substr( $_SERVER['PHP_SELF'], -11 ) == 'plugins.php' && !$cache_enabled && function_exists( 'admin_url' ) )
		echo '<div class="notice notice-info"><p><strong>' . sprintf( __('WP Super Cache is disabled. Please go to the <a href="%s">plugin admin page</a> to enable caching.', 'wp-super-cache' ), admin_url( 'options-general.php?page=wpsupercache' ) ) . '</strong></p></div>';

	if ( defined( 'WP_CACHE' ) && WP_CACHE == true && ( defined( 'ADVANCEDCACHEPROBLEM' ) || ( $cache_enabled && false == isset( $wp_cache_phase1_loaded ) ) ) ) {
		if ( wp_cache_create_advanced_cache() ) {
			echo '<div class="notice notice-error"><p>' . sprintf( __( 'Warning! WP Super Cache caching <strong>was</strong> broken but has been <strong>fixed</strong>! The script advanced-cache.php could not load wp-cache-phase1.php.<br /><br />The file %1$s/advanced-cache.php has been recreated and WPCACHEHOME fixed in your wp-config.php. Reload to hide this message.', 'wp-super-cache' ), WP_CONTENT_DIR ) . '</p></div>';
		}
	}
}
add_action( 'admin_notices', 'wp_cache_admin_notice' );

function wp_cache_check_site() {
	global $wp_super_cache_front_page_check, $wp_super_cache_front_page_clear, $wp_super_cache_front_page_text, $wp_super_cache_front_page_notification, $wpdb;

	if ( !isset( $wp_super_cache_front_page_check ) || ( isset( $wp_super_cache_front_page_check ) && $wp_super_cache_front_page_check == 0 ) ) {
		return false;
	}

	if ( function_exists( "wp_remote_get" ) == false ) {
		return false;
	}
	$front_page = wp_remote_get( site_url(), array('timeout' => 60, 'blocking' => true ) );
	if( is_array( $front_page ) ) {
		// Check for gzipped front page
		if ( $front_page[ 'headers' ][ 'content-type' ] == 'application/x-gzip' ) {
			if ( !isset( $wp_super_cache_front_page_clear ) || ( isset( $wp_super_cache_front_page_clear ) && $wp_super_cache_front_page_clear == 0 ) ) {
				wp_mail( get_option( 'admin_email' ), sprintf( __( '[%s] Front page is gzipped! Please clear cache!', 'wp-super-cache' ), home_url() ), sprintf( __( "Please visit %s to clear the cache as the front page of your site is now downloading!", 'wp-super-cache' ), admin_url( 'options-general.php?page=wpsupercache' ) ) );
			} else {
				wp_cache_clear_cache( $wpdb->blogid );
				wp_mail( get_option( 'admin_email' ), sprintf( __( '[%s] Front page is gzipped! Cache Cleared!', 'wp-super-cache' ), home_url() ), sprintf( __( "The cache on your blog has been cleared because the front page of your site is now downloading. Please visit %s to verify the cache has been cleared.", 'wp-super-cache' ), admin_url( 'options-general.php?page=wpsupercache' ) ) );
			}
		}

		// Check for broken front page
		if ( isset( $wp_super_cache_front_page_text ) && $wp_super_cache_front_page_text != '' && false === strpos( $front_page[ 'body' ], $wp_super_cache_front_page_text ) ) {
			if ( !isset( $wp_super_cache_front_page_clear ) || ( isset( $wp_super_cache_front_page_clear ) && $wp_super_cache_front_page_clear == 0 ) ) {
				wp_mail( get_option( 'admin_email' ), sprintf( __( '[%s] Front page is not correct! Please clear cache!', 'wp-super-cache' ), home_url() ), sprintf( __( 'Please visit %1$s to clear the cache as the front page of your site is not correct and missing the text, "%2$s"!', 'wp-super-cache' ), admin_url( 'options-general.php?page=wpsupercache' ), $wp_super_cache_front_page_text ) );
			} else {
				wp_cache_clear_cache( $wpdb->blogid );
				wp_mail( get_option( 'admin_email' ), sprintf( __( '[%s] Front page is not correct! Cache Cleared!', 'wp-super-cache' ), home_url() ), sprintf( __( 'The cache on your blog has been cleared because the front page of your site is missing the text "%2$s". Please visit %1$s to verify the cache has been cleared.', 'wp-super-cache' ), admin_url( 'options-general.php?page=wpsupercache' ), $wp_super_cache_front_page_text ) );
			}
		}
	}
	if ( isset( $wp_super_cache_front_page_notification ) && $wp_super_cache_front_page_notification == 1 ) {
		wp_mail( get_option( 'admin_email' ), sprintf( __( '[%s] Front page check!', 'wp-super-cache' ), home_url() ), sprintf( __( "WP Super Cache has checked the front page of your blog. Please visit %s if you would like to disable this.", 'wp-super-cache' ) . "\n\n", admin_url( 'options-general.php?page=wpsupercache' ) ) );
	}

	if ( !wp_next_scheduled( 'wp_cache_check_site_hook' ) ) {
		wp_schedule_single_event( time() + 360 , 'wp_cache_check_site_hook' );
		wp_cache_debug( 'scheduled wp_cache_check_site_hook for 360 seconds time.', 2 );
	}
}
add_action( 'wp_cache_check_site_hook', 'wp_cache_check_site' );

function update_cached_mobile_ua_list( $mobile_browsers, $mobile_prefixes = 0, $mobile_groups = 0 ) {
	global $wp_cache_config_file, $wp_cache_mobile_browsers, $wp_cache_mobile_prefixes, $wp_cache_mobile_groups;
	wp_cache_setting( 'wp_cache_mobile_browsers', $mobile_browsers );
	wp_cache_setting( 'wp_cache_mobile_prefixes', $mobile_prefixes );
	if ( is_array( $mobile_groups ) ) {
		$wp_cache_mobile_groups = $mobile_groups;
		wp_cache_replace_line('^ *\$wp_cache_mobile_groups', "\$wp_cache_mobile_groups = '" . implode( ', ', $mobile_groups ) . "';", $wp_cache_config_file);
	}

	return true;
}

function wpsc_update_htaccess() {
	extract( wpsc_get_htaccess_info() ); // $document_root, $apache_root, $home_path, $home_root, $home_root_lc, $inst_root, $wprules, $scrules, $condition_rules, $rules, $gziprules
	wpsc_remove_marker( $home_path.'.htaccess', 'WordPress' ); // remove original WP rules so SuperCache rules go on top
	if( insert_with_markers( $home_path.'.htaccess', 'WPSuperCache', explode( "\n", $rules ) ) && insert_with_markers( $home_path.'.htaccess', 'WordPress', explode( "\n", $wprules ) ) ) {
		return true;
	} else {
		return false;
	}
}

function wpsc_update_htaccess_form( $short_form = true ) {
	global $wpmu_version;

	$admin_url = admin_url( 'options-general.php?page=wpsupercache' );
	extract( wpsc_get_htaccess_info() ); // $document_root, $apache_root, $home_path, $home_root, $home_root_lc, $inst_root, $wprules, $scrules, $condition_rules, $rules, $gziprules
	if( !is_writeable_ACLSafe( $home_path . ".htaccess" ) ) {
		echo "<div style='padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'><h5>" . __( 'Cannot update .htaccess', 'wp-super-cache' ) . "</h5><p>" . sprintf( __( 'The file <code>%s.htaccess</code> cannot be modified by the web server. Please correct this using the chmod command or your ftp client.', 'wp-super-cache' ), $home_path ) . "</p><p>" . __( 'Refresh this page when the file permissions have been modified.' ) . "</p><p>" . sprintf( __( 'Alternatively, you can edit your <code>%s.htaccess</code> file manually and add the following code (before any WordPress rules):', 'wp-super-cache' ), $home_path ) . "</p>";
		echo "<p><pre># BEGIN WPSuperCache\n" . esc_html( $rules ) . "# END WPSuperCache</pre></p></div>";
	} else {
		if ( $short_form == false ) {
			echo "<p>" . sprintf( __( 'To serve static html files your server must have the correct mod_rewrite rules added to a file called <code>%s.htaccess</code>', 'wp-super-cache' ), $home_path ) . " ";
			_e( "You can edit the file yourself. Add the following rules.", 'wp-super-cache' );
			echo __( " Make sure they appear before any existing WordPress rules. ", 'wp-super-cache' ) . "</p>";
			echo "<div style='overflow: auto; width: 800px; height: 400px; padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'>";
			echo "<pre># BEGIN WPSuperCache\n" . esc_html( $rules ) . "# END WPSuperCache</pre></p>";
			echo "</div>";
			echo "<h5>" . sprintf( __( 'Rules must be added to %s too:', 'wp-super-cache' ), WP_CONTENT_DIR . "/cache/.htaccess" ) . "</h5>";
			echo "<div style='overflow: auto; width: 800px; height: 400px; padding:0 8px;color:#9f6000;background-color:#feefb3;border:1px solid #9f6000;'>";
			echo "<pre># BEGIN supercache\n" . esc_html( $gziprules ) . "# END supercache</pre></p>";
			echo "</div>";
		}
		if ( !isset( $wpmu_version ) || $wpmu_version == '' ) {
			echo '<form name="updatehtaccess" action="' . esc_url_raw( add_query_arg( 'tab', 'settings', $admin_url ) . '#modrewrite' ) . '" method="post">';
			echo '<input type="hidden" name="updatehtaccess" value="1" />';
			echo '<div class="submit"><input class="button-primary" type="submit" ' . SUBMITDISABLED . 'id="updatehtaccess" value="' . __( 'Update Mod_Rewrite Rules', 'wp-super-cache' ) . '" /></div>';
			wp_nonce_field('wp-cache');
			echo "</form>\n";
		}
	}
}

/*
 * Return LOGGED_IN_COOKIE if it doesn't begin with wordpress_logged_in
 * to avoid having people update their .htaccess file
 */
function wpsc_get_logged_in_cookie() {
	$logged_in_cookie = 'wordpress_logged_in';
	if ( defined( 'LOGGED_IN_COOKIE' ) && substr( constant( 'LOGGED_IN_COOKIE' ), 0, 19 ) != 'wordpress_logged_in' )
		$logged_in_cookie = constant( 'LOGGED_IN_COOKIE' );
	return $logged_in_cookie;
}

function wpsc_get_htaccess_info() {
	global $wp_cache_mobile_enabled, $wp_cache_mobile_prefixes, $wp_cache_mobile_browsers, $wp_cache_disable_utf8;
	global $htaccess_path;

	if ( isset( $_SERVER[ "PHP_DOCUMENT_ROOT" ] ) ) {
		$document_root = $_SERVER[ "PHP_DOCUMENT_ROOT" ];
		$apache_root = $_SERVER[ "PHP_DOCUMENT_ROOT" ];
	} else {
		$document_root = $_SERVER[ "DOCUMENT_ROOT" ];
		$apache_root = '%{DOCUMENT_ROOT}';
	}
	$content_dir_root = $document_root;
	if ( strpos( $document_root, '/kunden/homepages/' ) === 0 ) {
		// https://wordpress.org/support/topic/plugin-wp-super-cache-how-to-get-mod_rewrite-working-on-1and1-shared-hosting?replies=1
		// On 1and1, PHP's directory structure starts with '/homepages'. The
		// Apache directory structure has an extra '/kunden' before it.
		// Also 1and1 does not support the %{DOCUMENT_ROOT} variable in
		// .htaccess files.
		// This prevents the $inst_root from being calculated correctly and
		// means that the $apache_root is wrong.
		//
		// e.g. This is an example of how Apache and PHP see the directory
		// structure on	1and1:
		// Apache: /kunden/homepages/xx/dxxxxxxxx/htdocs/site1/index.html
		// PHP:           /homepages/xx/dxxxxxxxx/htdocs/site1/index.html
		// Here we fix up the paths to make mode_rewrite work on 1and1 shared hosting.
		$content_dir_root = substr( $content_dir_root, 7 );
		$apache_root = $document_root;
	}
	$home_path = get_home_path();
	$home_root = parse_url(get_bloginfo('url'));
	$home_root = isset( $home_root[ 'path' ] ) ? trailingslashit( $home_root[ 'path' ] ) : '/';
	if ( isset( $htaccess_path ) ) {
		$home_path = $htaccess_path;
	} elseif (
		$home_root == '/' &&
		$home_path != $_SERVER[ 'DOCUMENT_ROOT' ]
	) {
		$home_path = $_SERVER[ 'DOCUMENT_ROOT' ];
	} elseif (
		$home_root != '/' &&
		$home_path != str_replace( '//', '/', $_SERVER[ 'DOCUMENT_ROOT' ] . $home_root ) &&
		is_dir( $_SERVER[ 'DOCUMENT_ROOT' ] . $home_root )
	) {
		$home_path = str_replace( '//', '/', $_SERVER[ 'DOCUMENT_ROOT' ] . $home_root );
	}

	$home_path = trailingslashit( $home_path );
	$home_root_lc = str_replace( '//', '/', strtolower( $home_root ) );
	$inst_root = str_replace( '//', '/', '/' . trailingslashit( str_replace( $content_dir_root, '', str_replace( '\\', '/', WP_CONTENT_DIR ) ) ) );
	$wprules = implode( "\n", extract_from_markers( $home_path.'.htaccess', 'WordPress' ) );
	$wprules = str_replace( "RewriteEngine On\n", '', $wprules );
	$wprules = str_replace( "RewriteBase $home_root\n", '', $wprules );
	$scrules = implode( "\n", extract_from_markers( $home_path.'.htaccess', 'WPSuperCache' ) );

	if( substr( get_option( 'permalink_structure' ), -1 ) == '/' ) {
		$condition_rules[] = "RewriteCond %{REQUEST_URI} !^.*[^/]$";
		$condition_rules[] = "RewriteCond %{REQUEST_URI} !^.*//.*$";
	}
	$condition_rules[] = "RewriteCond %{REQUEST_METHOD} !POST";
	$condition_rules[] = "RewriteCond %{QUERY_STRING} ^$";
	$condition_rules[] = "RewriteCond %{HTTP:Cookie} !^.*(comment_author_|" . wpsc_get_logged_in_cookie() . wpsc_get_extra_cookies() . "|wp-postpass_).*$";
	$condition_rules[] = "RewriteCond %{HTTP:X-Wap-Profile} !^[a-z0-9\\\"]+ [NC]";
	$condition_rules[] = "RewriteCond %{HTTP:Profile} !^[a-z0-9\\\"]+ [NC]";
	if ( $wp_cache_mobile_enabled ) {
		if ( isset( $wp_cache_mobile_browsers ) && "" != $wp_cache_mobile_browsers )
			$condition_rules[] = "RewriteCond %{HTTP_USER_AGENT} !^.*(" . addcslashes( str_replace( ', ', '|', $wp_cache_mobile_browsers ), ' ' ) . ").* [NC]";
		if ( isset( $wp_cache_mobile_prefixes ) && "" != $wp_cache_mobile_prefixes )
			$condition_rules[] = "RewriteCond %{HTTP_USER_AGENT} !^(" . addcslashes( str_replace( ', ', '|', $wp_cache_mobile_prefixes ), ' ' ) . ").* [NC]";
	}
	$condition_rules = apply_filters( 'supercacherewriteconditions', $condition_rules );

	$rules = "<IfModule mod_rewrite.c>\n";
	$rules .= "RewriteEngine On\n";
	$rules .= "RewriteBase $home_root\n"; // props Chris Messina
	$rules .= "#If you serve pages from behind a proxy you may want to change 'RewriteCond %{HTTPS} on' to something more sensible\n";
	if ( isset( $wp_cache_disable_utf8 ) == false || $wp_cache_disable_utf8 == 0 ) {
		$charset = get_option('blog_charset') == '' ? 'UTF-8' : get_option('blog_charset');
		$rules .= "AddDefaultCharset {$charset}\n";
	}

	$rules .= "CONDITION_RULES";
	$rules .= "RewriteCond %{HTTP:Accept-Encoding} gzip\n";
	$rules .= "RewriteCond %{HTTPS} on\n";
	$rules .= "RewriteCond {$apache_root}{$inst_root}cache/supercache/%{SERVER_NAME}{$home_root_lc}$1/index-https.html.gz -f\n";
	$rules .= "RewriteRule ^(.*) \"{$inst_root}cache/supercache/%{SERVER_NAME}{$home_root_lc}$1/index-https.html.gz\" [L]\n\n";

	$rules .= "CONDITION_RULES";
	$rules .= "RewriteCond %{HTTP:Accept-Encoding} gzip\n";
	$rules .= "RewriteCond %{HTTPS} !on\n";
	$rules .= "RewriteCond {$apache_root}{$inst_root}cache/supercache/%{SERVER_NAME}{$home_root_lc}$1/index.html.gz -f\n";
	$rules .= "RewriteRule ^(.*) \"{$inst_root}cache/supercache/%{SERVER_NAME}{$home_root_lc}$1/index.html.gz\" [L]\n\n";

	$rules .= "CONDITION_RULES";
	$rules .= "RewriteCond %{HTTPS} on\n";
	$rules .= "RewriteCond {$apache_root}{$inst_root}cache/supercache/%{SERVER_NAME}{$home_root_lc}$1/index-https.html -f\n";
	$rules .= "RewriteRule ^(.*) \"{$inst_root}cache/supercache/%{SERVER_NAME}{$home_root_lc}$1/index-https.html\" [L]\n\n";

	$rules .= "CONDITION_RULES";
	$rules .= "RewriteCond %{HTTPS} !on\n";
	$rules .= "RewriteCond {$apache_root}{$inst_root}cache/supercache/%{SERVER_NAME}{$home_root_lc}$1/index.html -f\n";
	$rules .= "RewriteRule ^(.*) \"{$inst_root}cache/supercache/%{SERVER_NAME}{$home_root_lc}$1/index.html\" [L]\n";
	$rules .= "</IfModule>\n";
	$rules = apply_filters( 'supercacherewriterules', $rules );

	$rules = str_replace( "CONDITION_RULES", implode( "\n", $condition_rules ) . "\n", $rules );

	$gziprules =  "<IfModule mod_mime.c>\n  <FilesMatch \"\\.html\\.gz\$\">\n    ForceType text/html\n    FileETag None\n  </FilesMatch>\n  AddEncoding gzip .gz\n  AddType text/html .gz\n</IfModule>\n";
	$gziprules .= "<IfModule mod_deflate.c>\n  SetEnvIfNoCase Request_URI \.gz$ no-gzip\n</IfModule>\n";

	// Default headers.
	$headers = array(
		'Vary'          => 'Accept-Encoding, Cookie',
		'Cache-Control' => 'max-age=3, must-revalidate',
	);

	// Allow users to override the Vary header with WPSC_VARY_HEADER.
	if ( defined( 'WPSC_VARY_HEADER' ) && ! empty( WPSC_VARY_HEADER ) ) {
		$headers['Vary'] = WPSC_VARY_HEADER;
	}

	// Allow users to override Cache-control header with WPSC_CACHE_CONTROL_HEADER
	if ( defined( 'WPSC_CACHE_CONTROL_HEADER' ) && ! empty( WPSC_CACHE_CONTROL_HEADER ) ) {
		$headers['Cache-Control'] = WPSC_CACHE_CONTROL_HEADER;
	}

	// Allow overriding headers with a filter.
	$headers = apply_filters( 'wpsc_htaccess_mod_headers', $headers );

	// Combine headers into a block of text.
	$headers_text = join(
		"\n",
		array_map(
			function ( $key, $value ) {
				return "  Header set $key '" . addcslashes( $value, "'" ) . "'";
			},
			array_keys( $headers ),
			array_values( $headers )
		)
	);

	// Pack headers into gziprules (for historic reasons) - TODO refactor the values
	// returned to better reflect the blocks being written.
	if ( $headers_text != '' ) {
		$gziprules .= "<IfModule mod_headers.c>\n$headers_text\n</IfModule>\n";
	}

	// Deafult mod_expires rules.
	$expires_rules = array(
		'ExpiresActive On',
		'ExpiresByType text/html A3',
	);

	// Allow overriding mod_expires rules with a filter.
	$expires_rules = apply_filters( 'wpsc_htaccess_mod_expires', $expires_rules );

	$gziprules .= "<IfModule mod_expires.c>\n";
	$gziprules .= join(
		"\n",
		array_map(
			function ( $line ) {
				return "  $line";
			},
			$expires_rules
		)
	);
	$gziprules .= "\n</IfModule>\n";

	$gziprules .= "Options -Indexes\n";

	return array(
		'document_root'   => $document_root,
		'apache_root'     => $apache_root,
		'home_path'       => $home_path,
		'home_root'       => $home_root,
		'home_root_lc'    => $home_root_lc,
		'inst_root'       => $inst_root,
		'wprules'         => $wprules,
		'scrules'         => $scrules,
		'condition_rules' => $condition_rules,
		'rules'           => $rules,
		'gziprules'       => $gziprules,
	);
}

function clear_post_supercache( $post_id ) {
	$dir = get_current_url_supercache_dir( $post_id );
	if ( false == @is_dir( $dir ) )
		return false;

	if ( get_supercache_dir() == $dir ) {
		wp_cache_debug( "clear_post_supercache: not deleting post_id $post_id as it points at homepage: $dir" );
		return false;
	}

	wp_cache_debug( "clear_post_supercache: post_id: $post_id. deleting files in $dir" );
	if ( get_post_type( $post_id ) != 'page') { // don't delete child pages if they exist
		prune_super_cache( $dir, true );
	} else {
		wpsc_delete_files( $dir );
	}
}

function wp_cron_preload_cache() {
	global $wpdb, $wp_cache_preload_interval, $wp_cache_preload_posts, $wp_cache_preload_email_me, $wp_cache_preload_email_volume, $cache_path, $wp_cache_preload_taxonomies;

	if ( get_option( 'preload_cache_stop' ) ) {
		delete_option( 'preload_cache_stop' );
		wp_cache_debug( 'wp_cron_preload_cache: preload cancelled', 1 );
		return true;
	}

	$mutex = $cache_path . "preload_mutex.tmp";
	sleep( 3 + mt_rand( 1, 5 ) );
	if ( @file_exists( $mutex ) ) {
		if ( @filemtime( $mutex ) > ( time() - 600 ) ) {
			wp_cache_debug( 'wp_cron_preload_cache: preload mutex found and less than 600 seconds old. Aborting preload.', 1 );
			return true;
		} else {
			wp_cache_debug( 'wp_cron_preload_cache: old preload mutex found and deleted. Preload continues.', 1 );
			@unlink( $mutex );
		}
	}
	$fp = @fopen( $mutex, 'w' );
	@fclose( $fp );

	$counter = get_option( 'preload_cache_counter' );
	if ( is_array( $counter ) == false ) {
		wp_cache_debug( 'wp_cron_preload_cache: setting up preload for the first time!', 5 );
		$counter = array( 'c' => 0, 't' => time() );
		update_option( 'preload_cache_counter', $counter );
	}
	$c = $counter[ 'c' ];

	update_option( 'preload_cache_counter', array( 'c' => ( $c + 100 ), 't' => time() ) );

	if ( $wp_cache_preload_email_volume == 'none' && $wp_cache_preload_email_me == 1 ) {
		$wp_cache_preload_email_me = 0;
		wp_cache_setting( 'wp_cache_preload_email_me', 0 );
	}
	if ( $wp_cache_preload_email_me && $c == 0 )
		wp_mail( get_option( 'admin_email' ), sprintf( __( '[%1$s] Cache Preload Started', 'wp-super-cache' ), home_url(), '' ), ' ' );

	if ( $wp_cache_preload_posts == 'all' || $c < $wp_cache_preload_posts ) {
		wp_cache_debug( 'wp_cron_preload_cache: doing taxonomy preload.', 5 );
		$permalink_counter_msg = $cache_path . "preload_permalink.txt";
		if ( isset( $wp_cache_preload_taxonomies ) && $wp_cache_preload_taxonomies ) {
			$taxonomies = apply_filters( 'wp_cache_preload_taxonomies', array( 'post_tag' => 'tag', 'category' => 'category' ) );
			foreach( $taxonomies as $taxonomy => $path ) {
				$taxonomy_filename = $cache_path . "taxonomy_" . $taxonomy . ".txt";
				if ( $c == 0 )
					@unlink( $taxonomy_filename );

				if ( false == @file_exists( $taxonomy_filename ) ) {
					$out = '';
					$records = get_terms( $taxonomy );
					foreach( $records as $term ) {
						$out .= get_term_link( $term ). "\n";
					}
					$fp = fopen( $taxonomy_filename, 'w' );
					if ( $fp ) {
						fwrite( $fp, $out );
						fclose( $fp );
					}
					$details = explode( "\n", $out );
				} else {
					$details = explode( "\n", file_get_contents( $taxonomy_filename ) );
				}
				if ( count( $details ) != 1 && $details[ 0 ] != '' ) {
					$rows = array_splice( $details, 0, 50 );
					if ( $wp_cache_preload_email_me && $wp_cache_preload_email_volume == 'many' )
						wp_mail( get_option( 'admin_email' ), sprintf( __( '[%1$s] Refreshing %2$s taxonomy from %3$d to %4$d', 'wp-super-cache' ), home_url(), $taxonomy, $c, ($c+100) ), 'Refreshing: ' . print_r( $rows, 1 ) );
					foreach( (array)$rows as $url ) {
						set_time_limit( 60 );
						if ( $url == '' )
							continue;
						$url_info = parse_url( $url );
						$dir = get_supercache_dir() . $url_info[ 'path' ];
						wp_cache_debug( "wp_cron_preload_cache: delete $dir", 5 );
						prune_super_cache( $dir );
						$fp = @fopen( $permalink_counter_msg, 'w' );
						if ( $fp ) {
							@fwrite( $fp, "$taxonomy: $url" );
							@fclose( $fp );
						}
						wp_remote_get( $url, array('timeout' => 60, 'blocking' => true ) );
						wp_cache_debug( "wp_cron_preload_cache: fetched $url", 5 );
						sleep( 1 );
						if ( @file_exists( $cache_path . "stop_preload.txt" ) ) {
							wp_cache_debug( 'wp_cron_preload_cache: cancelling preload. stop_preload.txt found.', 5 );
							@unlink( $mutex );
							@unlink( $cache_path . "stop_preload.txt" );
							@unlink( $taxonomy_filename );
							update_option( 'preload_cache_counter', array( 'c' => 0, 't' => time() ) );
							if ( $wp_cache_preload_email_me )
								wp_mail( get_option( 'admin_email' ), sprintf( __( '[%1$s] Cache Preload Stopped', 'wp-super-cache' ), home_url(), '' ), ' ' );
							return true;
						}
					}
					$fp = fopen( $taxonomy_filename, 'w' );
					if ( $fp ) {
						fwrite( $fp, implode( "\n", $details ) );
						fclose( $fp );
					}
				}
			}
		}
	}

	if ( $wp_cache_preload_posts == 'all' || $c < $wp_cache_preload_posts ) {
		$types = wpsc_get_post_types();
		$posts = $wpdb->get_col( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE ( post_type IN ( $types ) ) AND post_status = 'publish' ORDER BY ID DESC LIMIT %d, 100", $c ) );
		wp_cache_debug( "wp_cron_preload_cache: got 100 posts from position $c.", 5 );
	} else {
		wp_cache_debug( "wp_cron_preload_cache: no more posts to get. Limit ($wp_cache_preload_posts) reached.", 5 );
		$posts = false;
	}
	if ( !isset( $wp_cache_preload_email_volume ) )
		$wp_cache_preload_email_volume = 'medium';

	if ( $posts ) {
		if ( get_option( 'show_on_front' ) == 'page' ) {
			$page_on_front = get_option( 'page_on_front' );
			$page_for_posts = get_option( 'page_for_posts' );
		} else {
			$page_on_front = $page_for_posts = 0;
		}
		if ( $wp_cache_preload_email_me && $wp_cache_preload_email_volume == 'many' )
			wp_mail( get_option( 'admin_email' ), sprintf( __( '[%1$s] Refreshing posts from %2$d to %3$d', 'wp-super-cache' ), home_url(), $c, ($c+100) ), ' ' );
		$msg = '';
		$count = $c + 1;
		$permalink_counter_msg = $cache_path . "preload_permalink.txt";
		foreach( $posts as $post_id ) {
			set_time_limit( 60 );
			if ( $page_on_front != 0 && ( $post_id == $page_on_front || $post_id == $page_for_posts ) )
				continue;
			$url = get_permalink( $post_id );

			if ( wp_cache_is_rejected( $url ) ) {
				wp_cache_debug( "wp_cron_preload_cache: skipped $url per rejected strings setting" );
				continue;
			}
			clear_post_supercache( $post_id );
			$fp = @fopen( $permalink_counter_msg, 'w' );
			if ( $fp ) {
				@fwrite( $fp, $count . " " . $url );
				@fclose( $fp );
			}
			if ( @file_exists( $cache_path . "stop_preload.txt" ) ) {
				wp_cache_debug( 'wp_cron_preload_cache: cancelling preload. stop_preload.txt found.', 5 );
				@unlink( $mutex );
				@unlink( $cache_path . "stop_preload.txt" );
				update_option( 'preload_cache_counter', array( 'c' => 0, 't' => time() ) );
				if ( $wp_cache_preload_email_me )
					wp_mail( get_option( 'admin_email' ), sprintf( __( '[%1$s] Cache Preload Stopped', 'wp-super-cache' ), home_url(), '' ), ' ' );
				return true;
			}
			$msg .= "$url\n";
			wp_remote_get( $url, array('timeout' => 60, 'blocking' => true ) );
			wp_cache_debug( "wp_cron_preload_cache: fetched $url", 5 );
			sleep( 1 );
			++$count;
		}
		if ( $wp_cache_preload_email_me && ( $wp_cache_preload_email_volume == 'medium' || $wp_cache_preload_email_volume == 'many' ) )
			wp_mail( get_option( 'admin_email' ), sprintf( __( '[%1$s] %2$d posts refreshed', 'wp-super-cache' ), home_url(), ($c+100) ), __( "Refreshed the following posts:", 'wp-super-cache' ) . "\n$msg" );
		if ( defined( 'DOING_CRON' ) ) {
			wp_cache_debug( 'wp_cron_preload_cache: scheduling the next preload in 30 seconds.', 5 );
			wp_schedule_single_event( time() + 30, 'wp_cache_preload_hook' );
		}
		wpsc_delete_files( get_supercache_dir() );
	} else {
		$msg = '';
		update_option( 'preload_cache_counter', array( 'c' => 0, 't' => time() ) );
		if ( (int)$wp_cache_preload_interval && defined( 'DOING_CRON' ) ) {
			if ( $wp_cache_preload_email_me )
				$msg = sprintf( __( 'Scheduling next preload refresh in %d minutes.', 'wp-super-cache' ), (int)$wp_cache_preload_interval );
			wp_cache_debug( "wp_cron_preload_cache: no more posts. scheduling next preload in $wp_cache_preload_interval minutes.", 5 );
			wp_schedule_single_event( time() + ( (int)$wp_cache_preload_interval * 60 ), 'wp_cache_full_preload_hook' );
		}
		global $file_prefix, $cache_max_time;
		if ( $wp_cache_preload_interval > 0 ) {
			$cache_max_time = (int)$wp_cache_preload_interval * 60; // fool the GC into expiring really old files
		} else {
			$cache_max_time = 86400; // fool the GC into expiring really old files
		}
		if ( $wp_cache_preload_email_me )
			wp_mail( get_option( 'admin_email' ), sprintf( __( '[%s] Cache Preload Completed', 'wp-super-cache' ), home_url() ), __( "Cleaning up old supercache files.", 'wp-super-cache' ) . "\n" . $msg );
		if ( $cache_max_time > 0 ) { // GC is NOT disabled
			wp_cache_debug( "wp_cron_preload_cache: clean expired cache files older than $cache_max_time seconds.", 5 );
			wp_cache_phase2_clean_expired( $file_prefix, true ); // force cleanup of old files.
		}
	}
	@unlink( $mutex );
}
add_action( 'wp_cache_preload_hook', 'wp_cron_preload_cache' );
add_action( 'wp_cache_full_preload_hook', 'wp_cron_preload_cache' );

function next_preload_message( $hook, $text, $limit = 0 ) {
	global $currently_preloading, $wp_cache_preload_interval;
	if ( $next_preload = wp_next_scheduled( $hook ) ) {
		$next_time = $next_preload - time();
		if ( $limit != 0 && $next_time > $limit )
			return false;
		$h = $m = $s = 0;
		if ( $next_time > 0 ) {
			$m = (int)($next_time / 60);
			$s = $next_time % 60;
			$h = (int)($m / 60); $m = $m % 60;
		}
		if ( $next_time > 0 && $next_time < ( 60 * $wp_cache_preload_interval ) )
			echo '<div class="notice notice-warning"><p>' . sprintf( $text, $h, $m, $s ) . '</p></div>';
		if ( ( $next_preload - time() ) <= 60 )
			$currently_preloading = true;
	}
}

function option_preload_cache_counter( $value ) {
	if ( false == is_array( $value ) ) {
		$ret = array( 'c' => $value, 't' => time(), 'first' => 1 );
		return $ret;
	}

	return $value;
}
add_filter( 'option_preload_cache_counter', 'option_preload_cache_counter' );

function check_up_on_preloading() {
	$value = get_option( 'preload_cache_counter' );
	if ( is_array( $value ) && $value[ 'c' ] > 0 && ( time() - $value[ 't' ] ) > 3600 && false == wp_next_scheduled( 'wp_cache_preload_hook' ) ) {
		if ( is_admin() ) {
			if ( get_option( 'wpsc_preload_restart_email' ) < ( time() - 86400 ) ) {
				wp_mail( get_option( 'admin_email' ), sprintf( __( '[%s] Preload may have stalled.', 'wp-super-cache' ), get_bloginfo( 'url' ) ), sprintf( __( "Preload has been restarted.\n%s", 'wp-super-cache' ), admin_url( "options-general.php?page=wpsupercache" ) ) );
				update_option( 'wpsc_preload_restart_email', time() );
			}
			add_action( 'admin_notices', 'wpsc_preload_restart_notice' );
		}
		wp_schedule_single_event( time() + 30, 'wp_cache_preload_hook' );
	}
}
add_action( 'init', 'check_up_on_preloading' ); // sometimes preloading stops working. Kickstart it.

function wpsc_preload_restart_notice() {

	if ( false == wpsupercache_site_admin() )
		return false;
	if ( ! isset( $_GET[ 'page' ] ) || $_GET[ 'page' ] != 'wpsupercache' )
		return false;
	echo '<div class="notice notice-error"><p>' . __( 'Warning! WP Super Cache preload was interrupted but has been restarted.', 'wp-super-cache' ) . '</p></div>';
}

function wp_cache_disable_plugin( $delete_config_file = true ) {
	global $wp_rewrite;
	if ( file_exists( ABSPATH . 'wp-config.php') ) {
		$global_config_file = ABSPATH . 'wp-config.php';
	} else {
		$global_config_file = dirname(ABSPATH) . '/wp-config.php';
	}

	if ( apply_filters( 'wpsc_enable_wp_config_edit', true ) ) {
		$line = 'define(\'WP_CACHE\', true);';
		if (
			strpos( file_get_contents( $global_config_file ), $line ) &&
			(
				! is_writeable_ACLSafe( $global_config_file ) ||
				! wp_cache_replace_line( 'define*\(*\'WP_CACHE\'', '', $global_config_file )
			)
		) {
			wp_die( "Could not remove WP_CACHE define from $global_config_file. Please edit that file and remove the line containing the text 'WP_CACHE'. Then refresh this page." );
		}
		$line = 'define( \'WPCACHEHOME\',';
		if (
			strpos( file_get_contents( $global_config_file ), $line ) &&
			(
				! is_writeable_ACLSafe( $global_config_file ) ||
				! wp_cache_replace_line( 'define *\( *\'WPCACHEHOME\'', '', $global_config_file )
			)
		) {
			wp_die( "Could not remove WPCACHEHOME define from $global_config_file. Please edit that file and remove the line containing the text 'WPCACHEHOME'. Then refresh this page." );
		}
	} elseif ( function_exists( 'wp_cache_debug' ) ) {
		wp_cache_debug( 'wp_cache_disable_plugin: not allowed to edit wp-config.php per configuration.' );
	}

	uninstall_supercache( WP_CONTENT_DIR . '/cache' );
	$file_not_deleted = false;
	wpsc_remove_advanced_cache();
	if ( @file_exists( WP_CONTENT_DIR . "/advanced-cache.php" ) ) {
		$file_not_deleted[] = WP_CONTENT_DIR . '/advanced-cache.php';
	}
	if ( $delete_config_file && @file_exists( WPCACHECONFIGPATH . "/wp-cache-config.php" ) ) {
		if ( false == unlink( WPCACHECONFIGPATH . "/wp-cache-config.php" ) )
			$file_not_deleted[] = WPCACHECONFIGPATH . '/wp-cache-config.php';
	}
	if ( $file_not_deleted ) {
		$msg = __( "Dear User,\n\nWP Super Cache was removed from your blog or deactivated but some files could\nnot be deleted.\n\n", 'wp-super-cache' );
		foreach( (array)$file_not_deleted as $path ) {
			$msg .=  "{$path}\n";
		}
		$msg .= "\n";
		$msg .= sprintf( __( "You should delete these files manually.\nYou may need to change the permissions of the files or parent directory.\nYou can read more about this in the Codex at\n%s\n\nThank you.", 'wp-super-cache' ), 'https://codex.wordpress.org/Changing_File_Permissions#About_Chmod' );

		if ( apply_filters( 'wpsc_send_uninstall_errors', 1 ) ) {
			wp_mail( get_option( 'admin_email' ), __( 'WP Super Cache: could not delete files', 'wp-super-cache' ), $msg );
		}
	}
	extract( wpsc_get_htaccess_info() ); // $document_root, $apache_root, $home_path, $home_root, $home_root_lc, $inst_root, $wprules, $scrules, $condition_rules, $rules, $gziprules
	if ( $scrules != '' && insert_with_markers( $home_path.'.htaccess', 'WPSuperCache', array() ) ) {
		$wp_rewrite->flush_rules();
	} elseif( $scrules != '' ) {
		wp_mail( get_option( 'admin_email' ), __( 'Supercache Uninstall Problems', 'wp-super-cache' ), sprintf( __( "Dear User,\n\nWP Super Cache was removed from your blog but the mod_rewrite rules\nin your .htaccess were not.\n\nPlease edit the following file and remove the code\nbetween 'BEGIN WPSuperCache' and 'END WPSuperCache'. Please backup the file first!\n\n%s\n\nRegards,\nWP Super Cache Plugin\nhttps://wordpress.org/plugins/wp-super-cache/", 'wp-super-cache' ), ABSPATH . '/.htaccess' ) );
	}
}

function uninstall_supercache( $folderPath ) { // from http://www.php.net/manual/en/function.rmdir.php
	if ( trailingslashit( constant( 'ABSPATH' ) ) == trailingslashit( $folderPath ) )
		return false;
	if ( @is_dir ( $folderPath ) ) {
		$dh  = @opendir($folderPath);
		while( false !== ( $value = @readdir( $dh ) ) ) {
			if ( $value != "." && $value != ".." ) {
				$value = $folderPath . "/" . $value;
				if ( @is_dir ( $value ) ) {
					uninstall_supercache( $value );
				} else {
					@unlink( $value );
				}
			}
		}
		return @rmdir( $folderPath );
	} else {
		return false;
	}
}

function supercache_admin_bar_render() {
	global $wp_admin_bar;

	if ( function_exists( '_deprecated_function' ) ) {
		_deprecated_function( __FUNCTION__, 'WP Super Cache 1.6.4' );
	}

	wpsc_admin_bar_render( $wp_admin_bar );
}

function wpsc_cancel_preload() {
	global $cache_path;
	$next_preload = wp_next_scheduled( 'wp_cache_preload_hook' );
	if ( $next_preload ) {
		wp_cache_debug( 'wpsc_cancel_preload: unscheduling wp_cache_preload_hook' );
		update_option( 'preload_cache_counter', array( 'c' => 0, 't' => time() ) );
		wp_unschedule_event( $next_preload, 'wp_cache_preload_hook' );
	}
	$next_preload = wp_next_scheduled( 'wp_cache_full_preload_hook' );
	if ( $next_preload ) {
		update_option( 'preload_cache_counter', array( 'c' => 0, 't' => time() ) );
		wp_cache_debug( 'wpsc_cancel_preload: unscheduling wp_cache_full_preload_hook' );
		wp_unschedule_event( $next_preload, 'wp_cache_full_preload_hook' );
	}
	wp_cache_debug( 'wpsc_cancel_preload: creating stop_preload.txt' );
	$fp = @fopen( $cache_path . "stop_preload.txt", 'w' );
	@fclose( $fp );
}

function wpsc_enable_preload() {
	global $cache_path;

	@unlink( $cache_path . "preload_mutex.tmp" );
	update_option( 'preload_cache_counter', array( 'c' => 0, 't' => time() ) );
	wp_schedule_single_event( time() + 10, 'wp_cache_full_preload_hook' );
}

function wpsc_get_post_types() {

	$preload_type_args = apply_filters( 'wpsc_preload_post_types_args', array(
		'public'             => true,
		'publicly_queryable' => true
	) );

	$post_types = (array) apply_filters( 'wpsc_preload_post_types', get_post_types( $preload_type_args, 'names', 'or' ));

	return "'" . join( "', '", array_map( 'esc_sql', $post_types ) ) . "'";
}
function wpsc_post_count() {
	global $wpdb;
	static $count;

	if ( isset( $count ) ) {
		return $count;
	}

	$post_type_list = wpsc_get_post_types();
	$count = $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type IN ( $post_type_list ) AND post_status = 'publish'" );

	return $count;
}
function wpsc_preload_settings( $min_refresh_interval = 'NA' ) {
	global $wp_cache_preload_interval, $wp_cache_preload_on, $wp_cache_preload_taxonomies, $wp_cache_preload_email_me, $wp_cache_preload_email_volume, $wp_cache_preload_posts, $wpdb;

	$return = array();

	if ( isset( $_POST[ 'action' ] ) == false || $_POST[ 'action' ] != 'preload' )
		return $return;

	if ( isset( $_POST[ 'preload_off' ] ) ) {
		wpsc_cancel_preload();
		$return[] = "<p><strong>" . __( 'Scheduled preloading of cache almost cancelled. It may take up to a minute for it to cancel completely.', 'wp-super-cache' ) . "</strong></p>";
		return $return;
	} elseif ( isset( $_POST[ 'preload_now' ] ) ) {
		wpsc_enable_preload();
		return $return;
	}

	if ( $min_refresh_interval == 'NA' ) {
		$count = wpsc_post_count();
		if ( $count > 1000 ) {
			$min_refresh_interval = 720;
		} else {
			$min_refresh_interval = 30;
		}
	}

	// Set to true if the preload interval is changed, and a reschedule is required.
	$force_preload_reschedule = false;

	if ( isset( $_POST[ 'wp_cache_preload_interval' ] ) && ( $_POST[ 'wp_cache_preload_interval' ] == 0 || $_POST[ 'wp_cache_preload_interval' ] >= $min_refresh_interval ) ) {
		$_POST[ 'wp_cache_preload_interval' ] = (int)$_POST[ 'wp_cache_preload_interval' ];
		if ( $wp_cache_preload_interval != $_POST[ 'wp_cache_preload_interval' ] ) {
			$force_preload_reschedule = true;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Missing
		$wp_cache_preload_interval = (int) $_POST['wp_cache_preload_interval'];
		wp_cache_setting( 'wp_cache_preload_interval', $wp_cache_preload_interval );
	}

	if ( $_POST[ 'wp_cache_preload_posts' ] == 'all' ) {
		$wp_cache_preload_posts = 'all';
	} else {
		$wp_cache_preload_posts = (int)$_POST[ 'wp_cache_preload_posts' ];
	}
	wp_cache_setting( 'wp_cache_preload_posts', $wp_cache_preload_posts );

	if ( isset( $_POST[ 'wp_cache_preload_email_volume' ] ) && in_array( $_POST[ 'wp_cache_preload_email_volume' ], array( 'none', 'less', 'medium', 'many' ) ) ) {
		$wp_cache_preload_email_volume = $_POST[ 'wp_cache_preload_email_volume' ];
	} else {
		$wp_cache_preload_email_volume = 'none';
	}
	wp_cache_setting( 'wp_cache_preload_email_volume', $wp_cache_preload_email_volume );

	if ( $wp_cache_preload_email_volume == 'none' )
		wp_cache_setting( 'wp_cache_preload_email_me', 0 );
	else
		wp_cache_setting( 'wp_cache_preload_email_me', 1 );

	if ( isset( $_POST[ 'wp_cache_preload_taxonomies' ] ) ) {
		$wp_cache_preload_taxonomies = 1;
	} else {
		$wp_cache_preload_taxonomies = 0;
	}
	wp_cache_setting( 'wp_cache_preload_taxonomies', $wp_cache_preload_taxonomies );

	if ( isset( $_POST[ 'wp_cache_preload_on' ] ) ) {
		$wp_cache_preload_on = 1;
	} else {
		$wp_cache_preload_on = 0;
	}
	wp_cache_setting( 'wp_cache_preload_on', $wp_cache_preload_on );

	// Ensure that preload settings are applied to scheduled cron.
	$next_preload    = wp_next_scheduled( 'wp_cache_full_preload_hook' );
	$should_schedule = ( $wp_cache_preload_on === 1 && $wp_cache_preload_interval > 0 );

	// If forcing a reschedule, or preload is disabled, clear the next scheduled event.
	if ( $next_preload && ( ! $should_schedule || $force_preload_reschedule ) ) {
		wp_cache_debug( 'Clearing old preload event' );
		update_option(
			'preload_cache_counter',
			array(
				'c' => 0,
				't' => time(),
			)
		);

		add_option( 'preload_cache_stop', 1 );
		wp_unschedule_event( $next_preload, 'wp_cache_full_preload_hook' );

		$next_preload = 0;
	}

	// Ensure a preload is scheduled if it should be.
	if ( ! $next_preload && $should_schedule ) {
		wp_cache_debug( 'Scheduling new preload event' );
		wp_schedule_single_event( time() + ( $wp_cache_preload_interval * 60 ), 'wp_cache_full_preload_hook' );
	}

	return $return;
}

function wpsc_is_preloading() {
	if ( wp_next_scheduled( 'wp_cache_preload_hook' ) || wp_next_scheduled( 'wp_cache_full_preload_hook' ) ) {
		return true;
	} else {
		return false;
	}
}

function wpsc_set_default_gc( $force = false ) {
	global $cache_path, $wp_cache_shutdown_gc, $cache_schedule_type;

	if ( isset( $wp_cache_shutdown_gc ) && $wp_cache_shutdown_gc == 1 ) {
		return false;
	}

	if ( $force ) {
		unset( $cache_schedule_type );
		$timestamp = wp_next_scheduled( 'wp_cache_gc' );
		if ( $timestamp ) {
			wp_unschedule_event( $timestamp, 'wp_cache_gc' );
		}
	}

	// set up garbage collection with some default settings
	if ( false == isset( $cache_schedule_type ) && false == wp_next_scheduled( 'wp_cache_gc' ) ) {
		$cache_schedule_type     = 'interval';
		$cache_time_interval     = 600;
		$cache_max_time          = 1800;
		$cache_schedule_interval = 'hourly';
		$cache_gc_email_me       = 0;
		wp_cache_setting( 'cache_schedule_type', $cache_schedule_type );
		wp_cache_setting( 'cache_time_interval', $cache_time_interval );
		wp_cache_setting( 'cache_max_time', $cache_max_time );
		wp_cache_setting( 'cache_schedule_interval', $cache_schedule_interval );
		wp_cache_setting( 'cache_gc_email_me', $cache_gc_email_me );

		wp_schedule_single_event( time() + 600, 'wp_cache_gc' );
	}

	return true;
}

function add_mod_rewrite_rules() {
	return update_mod_rewrite_rules();
}

function remove_mod_rewrite_rules() {
	return update_mod_rewrite_rules( false );
}

function update_mod_rewrite_rules( $add_rules = true ) {
	global $cache_path, $update_mod_rewrite_rules_error;

	$update_mod_rewrite_rules_error = false;

	if ( defined( "DO_NOT_UPDATE_HTACCESS" ) ) {
		$update_mod_rewrite_rules_error = ".htaccess update disabled by admin: DO_NOT_UPDATE_HTACCESS defined";
		return false;
	}

	if ( ! function_exists( 'get_home_path' ) ) {
		include_once( ABSPATH . 'wp-admin/includes/file.php' ); // get_home_path()
		include_once( ABSPATH . 'wp-admin/includes/misc.php' ); // extract_from_markers()
	}
	$home_path = trailingslashit( get_home_path() );
	$home_root = parse_url( get_bloginfo( 'url' ) );
	$home_root = isset( $home_root[ 'path' ] ) ? trailingslashit( $home_root[ 'path' ] ) : '/';
	if (
		$home_root == '/' &&
		$home_path != $_SERVER[ 'DOCUMENT_ROOT' ]
	) {
		$home_path = $_SERVER[ 'DOCUMENT_ROOT' ];
	} elseif (
		$home_root != '/' &&
		$home_path != str_replace( '//', '/', $_SERVER[ 'DOCUMENT_ROOT' ] . $home_root ) &&
		is_dir( $_SERVER[ 'DOCUMENT_ROOT' ] . $home_root )
	) {
		$home_path = str_replace( '//', '/', $_SERVER[ 'DOCUMENT_ROOT' ] . $home_root );
	}
	$home_path = trailingslashit( $home_path );

	if ( ! file_exists( $home_path . ".htaccess" ) ) {
		$update_mod_rewrite_rules_error = ".htaccess not found: {$home_path}.htaccess";
		return false;
	}

	$generated_rules = wpsc_get_htaccess_info();
	$existing_rules  = implode( "\n", extract_from_markers( $home_path . '.htaccess', 'WPSuperCache' ) );

	$rules = $add_rules ? $generated_rules[ 'rules' ] : '';

	if ( $existing_rules == $rules ) {
		$update_mod_rewrite_rules_error = "rules have not changed";
		return true;
	}

	if ( $generated_rules[ 'wprules' ] == '' ) {
		$update_mod_rewrite_rules_error = "WordPress rules empty";
		return false;
	}

	if ( empty( $rules ) ) {
		return insert_with_markers( $home_path . '.htaccess', 'WPSuperCache', array() );
	}

	$url = trailingslashit( get_bloginfo( 'url' ) );
	$original_page = wp_remote_get( $url, array( 'timeout' => 60, 'blocking' => true ) );
	if ( is_wp_error( $original_page ) ) {
		$update_mod_rewrite_rules_error = "Problem loading page";
		return false;
	}

	$backup_filename = $cache_path . 'htaccess.' . mt_rand() . ".php";
	$backup_file_contents = file_get_contents( $home_path . '.htaccess' );
	file_put_contents( $backup_filename, "<" . "?php die(); ?" . ">" . $backup_file_contents );
	$existing_gzip_rules = implode( "\n", extract_from_markers( $cache_path . '.htaccess', 'supercache' ) );
	if ( $existing_gzip_rules != $generated_rules[ 'gziprules' ] ) {
		insert_with_markers( $cache_path . '.htaccess', 'supercache', explode( "\n", $generated_rules[ 'gziprules' ] ) );
	}
	$wprules = extract_from_markers( $home_path . '.htaccess', 'WordPress' );
	wpsc_remove_marker( $home_path . '.htaccess', 'WordPress' ); // remove original WP rules so SuperCache rules go on top
	if ( insert_with_markers( $home_path . '.htaccess', 'WPSuperCache', explode( "\n", $rules ) ) && insert_with_markers( $home_path . '.htaccess', 'WordPress', $wprules ) ) {
		$new_page = wp_remote_get( $url, array( 'timeout' => 60, 'blocking' => true ) );
		$restore_backup = false;
		if ( is_wp_error( $new_page ) ) {
			$restore_backup = true;
			$update_mod_rewrite_rules_error = "Error testing page with new .htaccess rules: " . $new_page->get_error_message() . ".";
			wp_cache_debug( 'update_mod_rewrite_rules: failed to update rules. error fetching second page: ' . $new_page->get_error_message() );
		} elseif ( $new_page[ 'body' ] != $original_page[ 'body' ] ) {
			$restore_backup = true;
			$update_mod_rewrite_rules_error = "Page test failed as pages did not match with new .htaccess rules.";
			wp_cache_debug( 'update_mod_rewrite_rules: failed to update rules. page test failed as pages did not match. Files dumped in ' . $cache_path . ' for inspection.' );
			wp_cache_debug( 'update_mod_rewrite_rules: original page: 1-' . md5( $original_page[ 'body' ] ) . '.txt' );
			wp_cache_debug( 'update_mod_rewrite_rules: new page: 1-' . md5( $new_page[ 'body' ] ) . '.txt' );
			file_put_contents( $cache_path . '1-' . md5( $original_page[ 'body' ] ) . '.txt', $original_page[ 'body' ] );
			file_put_contents( $cache_path . '2-' . md5( $new_page[ 'body' ] ) . '.txt', $new_page[ 'body' ] );
		}

		if ( $restore_backup ) {
			global $wp_cache_debug;
			file_put_contents( $home_path . '.htaccess', $backup_file_contents );
			unlink( $backup_filename );
			if ( $wp_cache_debug ) {
				$update_mod_rewrite_rules_error .= "<br />See debug log for further details";
			} else {
				$update_mod_rewrite_rules_error .= "<br />Enable debug log on Debugging page for further details and try again";
			}

			return false;
		}
	} else {
		file_put_contents( $home_path . '.htaccess', $backup_file_contents );
		unlink( $backup_filename );
		$update_mod_rewrite_rules_error = "problem inserting rules in .htaccess and original .htaccess restored";
		return false;
	}

	return true;
}

// Delete feeds when the site is updated so that feed files are always fresh
function wpsc_feed_update( $type, $permalink ) {
	$wpsc_feed_list = get_option( 'wpsc_feed_list' );

	update_option( 'wpsc_feed_list', array() );
	if ( is_array( $wpsc_feed_list ) && ! empty( $wpsc_feed_list ) ) {
		foreach( $wpsc_feed_list as $file ) {
			wp_cache_debug( "wpsc_feed_update: deleting feed: $file" );
			prune_super_cache( $file, true );
			prune_super_cache( dirname( $file ) . '/meta-' . basename( $file ), true );
		}
	}
}
add_action( 'gc_cache', 'wpsc_feed_update', 10, 2 );

function wpsc_get_plugin_list() {
	$list = do_cacheaction( 'wpsc_filter_list' );
	foreach( $list as $t => $details ) {
		$key = "cache_" . $details[ 'key' ];
		if ( isset( $GLOBALS[ $key ] ) && $GLOBALS[ $key ] == 1 ) {
			$list[ $t ][ 'enabled' ] = true;
		} else {
			$list[ $t ][ 'enabled' ] = false;
		}

		$list[ $t ][ 'desc' ]  = strip_tags( $list[ $t ][ 'desc' ] );
		$list[ $t ][ 'title' ] = strip_tags( $list[ $t ][ 'title' ] );
	}
	return $list;
}

function wpsc_update_plugin_list( $update ) {
	$list = do_cacheaction( 'wpsc_filter_list' );
	foreach( $update as $key => $enabled ) {
		$plugin_toggle = "cache_{$key}";
		if ( isset( $GLOBALS[ $plugin_toggle ] ) || isset( $list[ $key ] ) ) {
			wp_cache_setting( $plugin_toggle, (int)$enabled );
		}
	}
}

function wpsc_add_plugin( $file ) {
	global $wpsc_plugins;
	if ( substr( $file, 0, strlen( ABSPATH ) ) == ABSPATH ) {
		$file = substr( $file, strlen( ABSPATH ) ); // remove ABSPATH
	}
	if (
		! isset( $wpsc_plugins ) ||
		! is_array( $wpsc_plugins ) ||
		! in_array( $file, $wpsc_plugins )
	) {
		$wpsc_plugins[] = $file;
		wp_cache_setting( 'wpsc_plugins', $wpsc_plugins );
	}
	return $file;
}
add_action( 'wpsc_add_plugin', 'wpsc_add_plugin' );

function wpsc_delete_plugin( $file ) {
	global $wpsc_plugins;
	if ( substr( $file, 0, strlen( ABSPATH ) ) == ABSPATH ) {
		$file = substr( $file, strlen( ABSPATH ) ); // remove ABSPATH
	}
	if (
		isset( $wpsc_plugins ) &&
		is_array( $wpsc_plugins ) &&
		in_array( $file, $wpsc_plugins )
	) {
		unset( $wpsc_plugins[ array_search( $file, $wpsc_plugins ) ] );
		wp_cache_setting( 'wpsc_plugins', $wpsc_plugins );
	}
	return $file;
}
add_action( 'wpsc_delete_plugin', 'wpsc_delete_plugin' );

function wpsc_get_plugins() {
	global $wpsc_plugins;
	return $wpsc_plugins;
}

function wpsc_add_cookie( $name ) {
	global $wpsc_cookies;
	if (
		! isset( $wpsc_cookies ) ||
		! is_array( $wpsc_cookies ) ||
		! in_array( $name, $wpsc_cookies )
	) {
		$wpsc_cookies[] = $name;
		wp_cache_setting( 'wpsc_cookies', $wpsc_cookies );
	}
	return $name;
}
add_action( 'wpsc_add_cookie', 'wpsc_add_cookie' );

function wpsc_delete_cookie( $name ) {
	global $wpsc_cookies;
	if (
		isset( $wpsc_cookies ) &&
		is_array( $wpsc_cookies ) &&
		in_array( $name, $wpsc_cookies )
	) {
		unset( $wpsc_cookies[ array_search( $name, $wpsc_cookies ) ] );
		wp_cache_setting( 'wpsc_cookies', $wpsc_cookies );
	}
	return $name;
}
add_action( 'wpsc_delete_cookie', 'wpsc_delete_cookie' );

function wpsc_get_cookies() {
	global $wpsc_cookies;
	return $wpsc_cookies;
}

function wpsc_get_extra_cookies() {
	global $wpsc_cookies;
	if (
		is_array( $wpsc_cookies ) &&
		! empty( $wpsc_cookies )
	) {
		return '|' . implode( '|', $wpsc_cookies );
	} else {
		return '';
	}
}

function wpsc_update_check() {
	global $wpsc_version;

	if (
		! isset( $wpsc_version ) ||
		$wpsc_version != 169
	) {
		wp_cache_setting( 'wpsc_version', 169 );
		global $wp_cache_debug_log, $cache_path;
		$log_file = $cache_path . str_replace('/', '', str_replace('..', '', $wp_cache_debug_log));
		if ( ! file_exists( $log_file ) ) {
			return false;
		}
		@unlink( $log_file );
		wp_cache_debug( 'wpsc_update_check: Deleted old log file on plugin update.' );
	}
}
add_action( 'admin_init', 'wpsc_update_check' );

/**
 * Renders a partial/template.
 *
 * The global $current_user is made available for any rendered template.
 *
 * @param string $partial  - Filename under ./partials directory, with or without .php (appended if absent).
 * @param array  $page_vars - Variables made available for the template.
 */
function wpsc_render_partial( $partial, array $page_vars = array() ) {
	if ( substr( $partial, -4 ) !== '.php' ) {
		$partial .= '.php';
	}

	if ( strpos( $partial, 'partials/' ) !== 0 ) {
		$partial = 'partials/' . $partial;
	}

	$path = __DIR__ . '/' . $partial;
	if ( ! file_exists( $path ) ) {
		return;
	}

	foreach ( $page_vars as $key => $val ) {
		$$key = $val;
	}
	global $current_user;
	include $path;
}
