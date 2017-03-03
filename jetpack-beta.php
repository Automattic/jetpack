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
define( 'JETPACK_GITHUB_URL', 'https://github.com/Automattic/jetpack' );
define( 'JETPACK_DEFAULT_URL', 'https://jetpack.com' );

define( 'JETPACK_DEV_PLUGIN_SLUG', 'jetpack-dev' );

define( 'JETPACK_PLUGIN_FILE', 'jetpack/jetpack.php' );
define( 'JETPACK_DEV_PLUGIN_FILE', 'jetpack-dev/jetpack.php' );

define( 'JETPACK_BETA_REPORT_URL', 'https://github.com/Automattic/jetpack/issues/new' );

require_once 'autoupdate-self.php';
add_action( 'init', array( 'Jetpack_Beta_Autoupdate_Self', 'instance' ) );

class Jetpack_Beta {

	protected static $_instance = null;
	protected static $admin = null;
	protected static $added_admin_bar = false;

	/**
	 * Main Instance
	 */
	public static function instance() {
		return self::$_instance = is_null( self::$_instance ) ? new self() : self::$_instance;
	}

	/**
	 * Constructor
	 */
	public function __construct() {

		if ( isset( $_GET['delete'] ) ) {
			delete_site_transient( 'update_plugins' );
		}

		add_filter( 'auto_update_plugin', array( $this, 'auto_update_jetpack_beta' ), 10, 2 );
		add_filter( 'pre_set_site_transient_update_plugins', array( $this, 'api_check' ) );
		add_action( 'admin_bar_menu', array( $this, 'admin_bar_menu' ) );

		if ( is_admin() ) {
			require JPBETA__PLUGIN_DIR . 'jetpack-beta-admin.php';
			self::$admin = new Jetpack_Beta_Admin();
		}
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

		return JETPACK_DEV_PLUGIN_SLUG;
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

	public function admin_bar_menu() {
		global $wp_admin_bar;

		if ( !is_object( $wp_admin_bar ) )
			return;



		self::$added_admin_bar = true;
		// add a group node with a class "first-toolbar-group"
		// add a parent item
		$args = array(
			'id'    => 'jetpack-beta_admin_bar',
			'title' => 'Jetpack Beta',
			'parent' => 'top-secondary',
			'href'  => admin_url( 'admin.php?page=jetpack-beta')
		);
		$wp_admin_bar->add_node( $args );

		// add a child item to our parent item
		$args = array(
			'id'     => 'jetpack-beta_report',
			'title'  => 'Report Bug',
			'href'   => JETPACK_BETA_REPORT_URL,
			'parent' => 'jetpack-beta_admin_bar'
		);
		$wp_admin_bar->add_node( $args );

		// add a child item to our parent item
		$args = array(
			'id'     => 'jetpack-beta_version',
			'title'  => self::get_jetpack_plugin_version(),
			'parent' => 'jetpack-beta_admin_bar'
		);

		$wp_admin_bar->add_node( $args );

		// add a group node with a class "first-toolbar-group"
		$args = array(
			'id'     => 'first_group',
			'parent' => 'jetpack-beta_admin_bar',
			'meta'   => array( 'class' => 'first-toolbar-group' )
		);
		$wp_admin_bar->add_group( $args );

		if ( self::get_plugin_slug() !== JETPACK_DEV_PLUGIN_SLUG ) {
			return;
		}
		// Highlight the menu if you are running the BETA Versions..
		echo "<style>#wpadminbar #wp-admin-bar-jetpack-beta_admin_bar { background: #72af3a;}</style>";
	}

	
	public function api_check( $transient ) {
		// Check if the transient contains the 'checked' information
		// If not, just return its value without hacking it
		if ( empty( $transient->checked ) ) {
			return $transient;
		}

		// We are running the regular Jetpack version..
		if ( self::get_plugin_slug() !== JETPACK_DEV_PLUGIN_SLUG ) {
			return $transient;
		}

		// Lets always grab the latest jetab
		delete_site_transient( 'jetpack_beta_manifest' );

		// check the version and decide if it's new
		$update = version_compare( self::get_new_jetpack_version(), self::get_jetpack_plugin_version(), '>' );
		if ( $update ) {
			$response              = new stdClass;
			$response->plugin      = self::get_plugin_slug();
			$response->new_version = self::get_new_jetpack_version();
			$response->slug        = self::get_plugin_slug();
			$response->url         = self::get_url();
			$response->package     = self::get_install_url();
			// If response is false, don't alter the transient
			if ( false !== $response ) {
				$transient->response[ self::get_plugin_file() ] = $response;
			}
		}
		return $transient;
	}

	static function get_jetpack_plugin_version() {
		$info = self::get_jetpack_plugin_info();
		return $info['Version'];
	}

	static function get_new_jetpack_version() {
		$manifest = self::get_beta_manifest();

		list( $branch, $section ) = (array) get_option( 'jetpack_dev_currently_installed' );

		if ( 'master' === $section && isset( $manifest->{$section}->version ) ) {
			return $manifest->{$section}->version;
		}

		if ( isset( $manifest->{$section}->{$branch}->version ) ) {
			return $manifest->{$section}->{$branch}->version;
		}
		return 0;
	}

	static function get_url( $branch = null, $section = null ) {
		
		if ( is_null ( $section ) ) {
			list( $branch, $section ) = (array) get_option( 'jetpack_dev_currently_installed' );
		}
		
		if ( 'master' === $section ) {
			return JETPACK_GITHUB_URL . '/tree/master-build';
		}

		if ( 'rc' === $section ) {
			return JETPACK_GITHUB_URL . '/tree/' . $section . '-build';
		}

		if ( 'pr' === $section ) {
			$manifest = self::get_beta_manifest();
			return isset( $manifest->{$section}->{$branch}->pr )
				? JETPACK_GITHUB_URL  . '/pull/' . $manifest->{$section}->{$branch}->pr
				: JETPACK_DEFAULT_URL;
		}
		return JETPACK_DEFAULT_URL;
	}

	static function get_install_url( $branch = null, $section = null ) {

		if ( is_null( $section ) ) {
			list( $branch, $section ) = (array) get_option( 'jetpack_dev_currently_installed' );
		}

		if ( 'stable' === $section ) {
			$org_data = self::get_org_data();
			return $org_data->download_link;
		}

		$manifest = Jetpack_Beta::get_beta_manifest();

		if ( 'master' === $section && isset( $manifest->{$section}->download_url ) ) {
			return $manifest->{$section}->download_url;
		}

		if ( isset( $manifest->{$section}->{$branch}->download_url ) ) {
			return $manifest->{$section}->{$branch}->download_url;
		}

		return null;
	}

	static function get_jetpack_plugin_info() {
		if( ! function_exists('get_plugin_data' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/plugin.php' );
		}

		return get_plugin_data( WP_PLUGIN_DIR . '/' . self::get_plugin_file() );
	}

	/*
	 * This needs to happen on shutdown. Other wise it doesn't work.
	 */
	static function switch_active() {
		self::replace_active_plugin( JETPACK_DEV_PLUGIN_FILE, JETPACK_PLUGIN_FILE );
	}
	
	static function get_beta_manifest() {
		return self::get_remote_data( JETPACK_BETA_MANIFEST_URL, 'manifest' );
	}

	static function get_org_data() {
		return self::get_remote_data( JETPACK_ORG_API_URL, 'org_data' );
	}

	static function get_remote_data( $url, $transient ) {
		$prefix = 'jetpack_beta_';
		$cache  = get_site_transient( $prefix . $transient );
		if ( $cache ) {
			return $cache;
		}

		$remote_manifest = wp_remote_get( $url );

		if ( is_wp_error( $remote_manifest ) ) {
			return false;
		}

		$cache = json_decode( wp_remote_retrieve_body( $remote_manifest ) );
		set_site_transient( $prefix . $transient, $cache, MINUTE_IN_SECONDS * 15 );

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

	static function proceed_to_install( $url, $plugin_folder = JETPACK_DEV_PLUGIN_SLUG, $section ) {

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




