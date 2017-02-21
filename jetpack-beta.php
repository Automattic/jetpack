<?php

/**
 * Plugin Name: Jetpack Beta Tester
 * Plugin URI: https://github.com/Automattic/jetpack-beta
 * Description: Uses your auto-updater to update your local Jetpack to our latest beta version from the master-stable branch on GitHub. DO NOT USE IN PRODUCTION.
 * Version: 2.0
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 *
 * Based on WooCommerce Beta Tester plugin by Mike Jolley
 */

/*
This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
*/
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * How this plugin works.
 * Jetpack beta manages files inside jetpack-dev folder this folder should contain
 *
 */

define( 'JPBETA__PLUGIN_FOLDER', plugins_url() . '/jetpack-beta/' );
define( 'JPBETA__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'JPBETA__PLUGIN_FILE', __FILE__ );
define( 'JPBETA_VERSION', 2 );

define( 'JPBETA_DEFAULT_BRANCH', 'rc_only' );

define( 'JETPACK_BETA_MANIFEST_URL', 'https://betadownload.jetpack.me/jetpack-branches.json' );
define( 'JETPACK_ORG_API_URL', 'https://api.wordpress.org/plugins/info/1.0/jetpack.json' );
define( 'JETPACK_GITHUB_API_URL', 'https://api.github.com/repos/Automattic/Jetpack/' );
define( 'JETPACK_DEV_PLUGIN_SLUG', 'jetpack-dev' );

define( 'JETPACK_PLUGIN_FOLDER', plugins_url() . '/jetpack-dev/' );

define( 'JETPACK_PLUGIN_FILE', 'jetpack/jetpack.php' );
define( 'JETPACK_DEV_PLUGIN_FILE', 'jetpack-dev/jetpack.php' );

/**
 * Confirm Jetpack is at least installed before doing anything
 * Curiously, developers are discouraged from using WP_PLUGIN_DIR and not given a
 * function with which to get the plugin directory, so this is what we have to do
 */
require_once 'autoupdate-self.php';
add_action( 'init', array( 'Jetpack_Beta_Autoupdate_Self', 'instance' ) );

class Jetpack_Beta {

	protected static $_instance = null;

	protected static $admin = null;

	/**
	 * Main Instance
	 */
	public static function instance() {
		return self::$_instance = is_null( self::$_instance ) ? new self() : self::$_instance;
	}

	/**
	 * Ran on activation to flush update cache
	 */
	public static function activate() {
		delete_site_transient( 'update_plugins' );
		self::set_default_options();
	}

	public static function get_plugin_file() {
		return self::get_plugin_slug() . '/jetpack.php';
	}

	public static function get_plugin_slug() {
		$installed = get_option( 'jetpack_dev_currently_installed', array() );
		if ( empty( $installed ) || $installed[1] === 'stable' ) {
			return 'jetpack';
		}

		return 'jetpack-dev';
	}

	public static function set_default_options() {
		// $active_plugins = (array) get_option( 'active_plugins', array() );

		if ( file_exists( self::get_plugin_file() ) ) {
			update_option( 'jetpack_dev_currently_installed', array( 'stable', 'stable' ) );
		}
	}

	public static function deactivate() {
		// Set the
		add_action( 'shutdown', array( __CLASS__, 'switch_active' ) );
		delete_option( 'jetpack_dev_currently_installed' );

		// Delete the jetpack dev plugin
		$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, false, array() );
		if ( ! WP_Filesystem( $creds ) ) {
			/* any problems and we exit */
			return;
		}
		global $wp_filesystem;
		if ( ! $wp_filesystem ) {
			return;
		}
		
		$working_dir = WP_PLUGIN_DIR . '/' . JETPACK_DEV_PLUGIN_SLUG;
		// delete the folder JETPACK_BETA_PLUGIN_FOLDER
		if ( $wp_filesystem->is_dir( $working_dir ) ) {
			$wp_filesystem->delete( $working_dir, true );
		}
	}

	/*
	 * This needs to happen on shutdown. Other wise it doesn't work.
	 */
	static function switch_active() {
		self::replace_active_plugin( JETPACK_DEV_PLUGIN_FILE, JETPACK_PLUGIN_FILE );
	}

	/**
	 * Constructor
	 */
	public function __construct() {

		add_filter( 'auto_update_plugin', array( $this, 'auto_update_jetpack_beta' ), 10, 2 );
		add_filter( 'pre_set_site_transient_update_plugins', array( $this, 'api_check' ) );

		if ( is_admin() ) {
			require JPBETA__PLUGIN_DIR . 'jetpack-beta-admin.php';
			self::$admin = new Jetpack_Beta_Admin();
		}
	}

	static function get_beta_manifest() {
		return self::get_remote_data( JETPACK_BETA_MANIFEST_URL, 'manifest' );
	}

	static function get_org_data() {
		return self::get_remote_data( JETPACK_ORG_API_URL, 'org_data' );
	}

	static function get_remote_data( $url, $transinet ) {
		$prefix = 'jetpack_beta_';
		$cache  = get_site_transient( $prefix . $transinet );
		if ( $cache ) {
			return $cache;
		}

		$remote_manifest = wp_remote_get( $url );

		if ( is_wp_error( $remote_manifest ) ) {
			return false;
		}

		$cache = json_decode( wp_remote_retrieve_body( $remote_manifest ) );
		set_site_transient( $prefix . $transinet, $cache, MINUTE_IN_SECONDS * 15 );

		return $cache;
	}

	function auto_update_jetpack_beta( $update, $item ) {
		if ( 'sure' !== get_option( 'jp_beta_autoupdate' ) ) {
			return $update;
		}

		// Array of plugin slugs to always auto-update
		$plugins = array(
			JETPACK_DEV_PLUGIN_FILE,
		);
		if ( in_array( $item->slug, $plugins ) ) {
			return true; // Always update plugins in this array
		} else {
			return $update; // Else, use the normal API response to decide whether to update or not
		}
	}

	static function proceed_to_install( $url, $plugin_folder = 'jetpack-dev', $section ) {

		if ( 'stable' === $section && file_exists( WP_PLUGIN_DIR . '/' . JETPACK_PLUGIN_FILE ) ) {
			self::replace_active_plugin( JETPACK_DEV_PLUGIN_FILE, JETPACK_PLUGIN_FILE, true );

			return;
		}

		$temp_path = download_url( $url );

		if ( is_wp_error( $temp_path ) ) {
			wp_die( sprintf( __( 'Error Downloading: <a href="%1$s">%1$s</a> - Error: %2$s', 'jetpack-beta' ), $url, $temp_path->get_error_message() ) );
		}

		$creds = request_filesystem_credentials( site_url() . '/wp-admin/', '', false, false, array() );
		/* initialize the API */
		if ( ! WP_Filesystem( $creds ) ) {
			/* any problems and we exit */
			wp_die( "Jetpack Beta: No File System access" );
		}

		global $wp_filesystem;
		if ( 'stable' === $section ) {
			$plugin_path = WP_PLUGIN_DIR;
		} else {
			$plugin_path = str_replace( ABSPATH, $wp_filesystem->abspath(), WP_PLUGIN_DIR . '/' . $plugin_folder );
		}

		$result = unzip_file( $temp_path, $plugin_path );

		if ( is_wp_error( $result ) ) {
			wp_die( sprintf( __( 'Error Unziping file: Error: %1$s', 'jetpack-beta' ), $result->get_error_message() ) );
		}

		if ( 'stable' === $section ) {
			self::replace_active_plugin( JETPACK_DEV_PLUGIN_FILE, JETPACK_PLUGIN_FILE, true );
		} else {
			self::replace_active_plugin( JETPACK_PLUGIN_FILE, JETPACK_DEV_PLUGIN_FILE, true );
		}

	}

	static function replace_active_plugin( $current_plugin, $replace_with_plugin, $force_activate = false ) {

		$active_plugins     = (array) get_option( 'active_plugins', array() );
		$new_active_plugins = array();

		foreach ( $active_plugins as $plugin ) {
			$new_active_plugins[] = ( $plugin === $current_plugin ? $replace_with_plugin : $plugin );
		}

		if ( $force_activate && ! in_array( $replace_with_plugin, $new_active_plugins ) ) {
			$new_active_plugins[] = $replace_with_plugin;
		}
		update_option( 'active_plugins', $new_active_plugins );
	}
}

register_activation_hook( __FILE__, array( 'Jetpack_Beta', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack_Beta', 'deactivate' ) );

add_action( 'init', array( 'Jetpack_Beta', 'instance' ) );




