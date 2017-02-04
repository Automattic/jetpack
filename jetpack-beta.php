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
define( 'JPBETA__DIR', dirname( __FILE__ ) . '/' );

define( 'JPBETA_DEFAULT_BRANCH', 'rc_only' );

define( 'JETPACK_BETA_MANIFEST_URL', 'https://betadownload.jetpack.me/jetpack-branches.json' );
define( 'JETPACK_PLUGIN_SLUG', 'jetpack-dev' );

define( 'JETPACK_PLUGIN_FOLDER', plugins_url() . '/jetpack-dev/' );

define( 'JETPACK_PLUGIN_ID', 'jetpack/jetpack.php' );
define( 'JETPACK_DEV_PLUGIN', 'jetpack-dev/jetpack.php' );


define( 'JPBETA_RC_URL', 'https://betadownload.jetpack.me/rc/rc.json' );
define( 'JPBETA_BLEEDING_EDGE_URL', 'https://betadownload.jetpack.me/jetpack-bleeding-edge.json' );
//
//define( 'JPBETA_GITHUB_API_URL', 'https://api.github.com/repos/Automattic/jetpack/' );
//define( 'JPBETA_GITHUB_RAW_CONTENT_URL', 'https://raw.githubusercontent.com/Automattic/jetpack/' );
//define( 'JPBETA_DEV_STABLE_DOWNLOAD_URL', 'https://downloads.wordpress.org/plugin/jetpack.zip' );
//
//if ( defined( 'IS_PRESSABLE' ) && IS_PRESSABLE ) {
//	define( 'JETPACK_PLUGIN_PATH', WP_PLUGIN_DIR . '/jetpack-pressable-beta/jetpack.php' );
//	define( 'JETPACK_PLUGIN_ID', 'jetpack-pressable-beta/jetpack.php' );
//	define( 'JETPACK_PLUGIN_FOLDER', 'jetpack-pressable-beta' );
//} else {
//	define( 'JETPACK_PLUGIN_PATH', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
//	define( 'JETPACK_PLUGIN_ID', 'jetpack/jetpack.php' );
//	define( 'JETPACK_PLUGIN_FOLDER', 'jetpack' );
//}

/**
 * Confirm Jetpack is at least installed before doing anything
 * Curiously, developers are discouraged from using WP_PLUGIN_DIR and not given a
 * function with which to get the plugin directory, so this is what we have to do
 */
require_once 'autoupdate-self.php';
require_once 'self-install.php';
add_action( 'init', array( 'Jetpack_Beta_Self_Install', 'instance' ) );
add_action( 'init', array( 'Jetpack_Beta_Autoupdate_Self', 'instance' ) );

class Jetpack_Beta_Tester {
	/** Config */
	private $config = array();
	/** Github Data */
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
		delete_site_transient( 'jetpack_latest_tag' );
	}

	public static function deactivate() {
		// delete the folder JETPACK_BETA_PLUGIN_FOLDER
		// clean up any options that were set.
		add_action( 'shutdown', array( __CLASS__, 'switch_active' ) );
	}

	/*
	 * This needs to happen on shutdown. Other wise it doesn't work.
	 */
	static function switch_active() {
		$self_install = Jetpack_Beta_Self_Install::instance();
		$self_install->replace_active_plugin( JETPACK_DEV_PLUGIN, JETPACK_PLUGIN_ID );
	}
	/**
	 * Constructor
	 */
	public function __construct() {
		if( isset( $_GET['refresh_plugin']  ) ) {
			$this->activate();
		}

		$this->config = array(
			'plugin_file'        => JETPACK_PLUGIN_ID,
			'slug'               => JETPACK_PLUGIN_ID,
			'proper_folder_name' => JETPACK_PLUGIN_FOLDER,
			'requires'           => '4.7',
			'tested'             => '4.7',
			'code_url'           => 'https://github.com/Automattic/jetpack',
			'github_api'         => 'https://api.github.com',
		);

		add_filter( 'pre_set_site_transient_update_plugins', array( $this, 'api_check' ) );
		add_filter( 'plugins_api', array( $this, 'get_plugin_info' ), 10, 3 );

		add_filter( 'auto_update_plugin', array( $this, 'auto_update_jetpack_beta' ), 10, 2 );

		if ( is_admin() ) {
			if ( class_exists( 'Jetpack' ) ) {
				require JPBETA__DIR . 'admin/class.jetpack-beta-page.php';
				$admin_page = new Jetpack_Beta_Page();
				add_action( 'jetpack_admin_menu',            array( $admin_page, 'add_actions' ) );

			} else {
				require JPBETA__DIR . 'jetpack-beta-admin.php';
				self::$admin = new Jetpack_Beta_Admin();
			}

		}
	}

	/**
	 * Update args
	 * @return array
	 */
	public function set_update_args() {
		$plugin_data = $this->get_plugin_data();

		$this->config['plugin_name']  = $plugin_data['Name'];
		$this->config['version']      = $plugin_data['Version'];
		$this->config['author']       = $plugin_data['Author'];
		$this->config['homepage']     = $plugin_data['PluginURI'];
		$this->config['new_version']  = $this->get_latest_prerelease();
		$this->config['last_updated'] = $this->get_date();
		$this->config['description']  = $this->get_description();
		$this->config['zip_url']      = $this->get_zip_url();
	}

	function get_zip_url() {
		$plugin_data = $this->get_remote_plugin_data();

		return ( isset ( $plugin_data->download_url )
			? $plugin_data->download_url
			: JPBETA_DEV_STABLE_DOWNLOAD_URL
		);
	}

	/**
	 * Check wether or not the transients need to be overruled and API needs to be called for every single page load
	 *
	 * @return bool overrule or not
	 */
	public function overrule_transients() {
		return ( defined( 'JETPACK_BETA_TESTER_FORCE_UPDATE' ) && JETPACK_BETA_TESTER_FORCE_UPDATE );
	}

	/**
	 * Get New Version from GitHub
	 *
	 * @since 1.0
	 * @return int $version the version number
	 */
	public function get_latest_prerelease() {
		$plugin_data        = $this->get_plugin_data();
		$remote_plugin_data = $this->get_remote_plugin_data();
		$version            = false;
		if ( isset ( $remote_plugin_data->version ) ) {
			if ( $this->is_bleeding_edge() ) {
				// this returns a value of version number that doesn't make any sense
				// Lets try to make more sense of it.
				$version = $this->get_bleeding_edge_version( $plugin_data['Version'], $remote_plugin_data->version );
			} else {
				$version = $remote_plugin_data->version;
			}
		}

		return ( $version ? $version : $plugin_data['Version'] );
	}

	public function get_bleeding_edge_version( $current_version, $remote_version ) {
		$build = filter_var( $remote_version, FILTER_SANITIZE_NUMBER_INT );
		if ( false === strpos( $current_version, 'Build' ) ) {
			return $current_version . '.' . $build;
		}

		return $current_version;
	}

	/**
	 * Get GitHub Data from the specified repository
	 *
	 * @since 1.0
	 * @return array $github_data the data
	 */
	public function get_github_data() {
		if ( ! empty( $this->github_data ) ) {
			$github_data = $this->github_data;
		} else {
			$github_data = get_site_transient( md5( $this->config['slug'] ) . '_github_data' );
			if ( $this->overrule_transients() || ( ! isset( $github_data ) || ! $github_data || '' == $github_data ) ) {
				$github_data = wp_remote_get( JPBETA_GITHUB_API_URL . '/branches/master-stable' );
				if ( is_wp_error( $github_data ) ) {
					return false;
				}
				$github_data = json_decode( $github_data['body'] );

				// refresh every 6 hours
				set_site_transient( md5( $this->config['slug'] ) . '_github_data', $github_data, 60 * 60 * 6 );
			}
			// Store the data in this class instance for future calls
			$this->github_data = $github_data;
		}

		return $github_data;
	}

	static function get_beta_manifest() {

		return json_decode( '{"pr":{"enchance_jitm-indiv-dismiss":{"branch":"enchance\/jitm-indiv-dismiss","commit":"fdf7c1813df72891c514427a927f9ba001a728d9","download_url":"https:\/\/betadownload.jetpack.me\/branches\/enchance_jitm-indiv-dismiss\/jetpack-dev.zip","update_date":"2017-01-26 23:00:18","version":"4.6-alpha-4942-ge3f0c43","pr":6132},"add_jetpack-plan-support":{"branch":"add\/jetpack-plan-support","commit":"d6fb1f978269315bdda67979200f069c2f40017b","download_url":"https:\/\/betadownload.jetpack.me\/branches\/add_jetpack-plan-support\/jetpack-dev.zip","update_date":"2017-02-04 04:15:19","version":"4.6-alpha-4958-g690a03d","pr":6171},"add_docs":{"branch":"add\/docs","commit":"4f364a22ddfaf0f20ca0ee9f6f8fe0f39eda13fa","download_url":"https:\/\/betadownload.jetpack.me\/branches\/add_docs\/jetpack-dev.zip","update_date":"2017-02-04 04:15:20","version":"4.5-beta2-4768-g52a2fb5","pr":5985},"add_network-enable-them-on-install":{"branch":"add\/network-enable-them-on-install","commit":"28f7399e6ef2ac691fdcd7caa14e1e97b26eca33","download_url":"https:\/\/betadownload.jetpack.me\/branches\/add_network-enable-them-on-install\/jetpack-dev.zip","update_date":"2017-02-04 04:15:19","version":"4.6-alpha-4963-g1da29d8","pr":6201},"add_blogs-i-follow":{"branch":"add\/blogs-i-follow","commit":"77afc54d4fb9cab5b9d4e4ab688bc10d97077b3d","download_url":"https:\/\/betadownload.jetpack.me\/branches\/add_blogs-i-follow\/jetpack-dev.zip","update_date":"2017-02-04 05:12:34","version":"4.6-alpha-4978-gb074243","pr":6144},"update_sync-user-language-choice":{"branch":"update\/sync-user-language-choice","commit":"2ba5a7a8c77aa703ea8302205d9b637a91564792","download_url":"https:\/\/betadownload.jetpack.me\/branches\/update_sync-user-language-choice\/jetpack-dev.zip","update_date":"2017-02-02 23:05:17","version":"4.6-beta1-5034-g5476398","pr":6053},"update_sync-home-siteurl-from-db":{"branch":"update\/sync-home-siteurl-from-db","commit":"1f62380e00232371a83be73047a7dc9294d57447","download_url":"https:\/\/betadownload.jetpack.me\/branches\/update_sync-home-siteurl-from-db\/jetpack-dev.zip","update_date":"2017-01-30 22:20:18","version":"4.6-alpha-4998-g64d93f9","pr":5852},"change_infinite-scroll-rename-google-analytics-option-label":{"branch":"change\/infinite-scroll-rename-google-analytics-option-label","commit":"8fd532edbcff9472bdf18c9434d7f05d63a324c9","download_url":"https:\/\/betadownload.jetpack.me\/branches\/change_infinite-scroll-rename-google-analytics-option-label\/jetpack-dev.zip","update_date":"2017-01-31 08:15:17","version":"4.6-alpha-4988-g46a0bb1","pr":6239},"fix_photon-carousel-conflict":{"branch":"fix\/photon-carousel-conflict","commit":"f2c2100f3c8321a9f402c11440445a66835a9c92","download_url":"https:\/\/betadownload.jetpack.me\/branches\/fix_photon-carousel-conflict\/jetpack-dev.zip","update_date":"2017-02-01 10:35:17","version":"4.6-beta1-5020-g43d57df","pr":6243},"update_imrpove-site-endpoint-performance":{"branch":"update\/imrpove-site-endpoint-performance","commit":"0c24987178b9c93de697d7d331d04f6ff56e6cc1","download_url":"https:\/\/betadownload.jetpack.me\/branches\/update_imrpove-site-endpoint-performance\/jetpack-dev.zip","update_date":"2017-02-01 20:25:17","version":"4.6-beta1-5021-gd5da336","pr":6249},"merge-1feb2017-sharedaddy":{"branch":"merge-1feb2017-sharedaddy","commit":"dedc0fc43d85c3a998860142b1ae9858833411a0","download_url":"https:\/\/betadownload.jetpack.me\/branches\/merge-1feb2017-sharedaddy\/jetpack-dev.zip","update_date":"2017-02-01 22:30:17","version":"4.6-beta1-5072-g8466f62","pr":6253},"add_json-api-plugins-action-links":{"branch":"add\/json-api-plugins-action-links","commit":"1c88a3aeff7bcbf19c4bfaa8cb4e1c2a143ded62","download_url":"https:\/\/betadownload.jetpack.me\/branches\/add_json-api-plugins-action-links\/jetpack-dev.zip","update_date":"2017-02-04 04:15:20","version":"4.6-beta1-5030-g309f823","pr":6267},"update_vaultpress-in-settings-notice":{"branch":"update\/vaultpress-in-settings-notice","commit":"705c2c023819b55e9f02e11f2dfb1ed4c157deb2","download_url":"https:\/\/betadownload.jetpack.me\/branches\/update_vaultpress-in-settings-notice\/jetpack-dev.zip","update_date":"2017-02-02 21:25:19","version":"4.6-beta1-5128-g5c23c16","pr":6270},"add_contact-widget-email-field":{"branch":"add\/contact-widget-email-field","commit":"6de9fb9e6217fc9b62bcb29a5f84432b077b24d2","download_url":"https:\/\/betadownload.jetpack.me\/branches\/add_contact-widget-email-field\/jetpack-dev.zip","update_date":"2017-02-04 04:15:23","version":"4.6-beta1-5031-g5c555ed","pr":6275},"update_eslint-rules":{"branch":"update\/eslint-rules","commit":"ceab5393385914b37abe884b64c1be61585a8f0b","download_url":"https:\/\/betadownload.jetpack.me\/branches\/update_eslint-rules\/jetpack-dev.zip","update_date":"2017-02-03 15:55:15","version":"4.6-beta1-5031-g316e839","pr":6276},"add_widget-visiblity-post-id-field":{"branch":"add\/widget-visiblity-post-id-field","commit":"f4628a57ca7ac10596d7fad30059e20ad10f5717","download_url":"https:\/\/betadownload.jetpack.me\/branches\/add_widget-visiblity-post-id-field\/jetpack-dev.zip","update_date":"2017-02-03 20:25:17","version":"4.6-beta1-5030-g76e5aad","pr":6277},"fix_5566-remainder-php-errors":{"branch":"fix\/5566-remainder-php-errors","commit":"98a0757fdf94cd2df08eb65bdc08073a8494c224","download_url":"https:\/\/betadownload.jetpack.me\/branches\/fix_5566-remainder-php-errors\/jetpack-dev.zip","update_date":"2017-02-03 14:45:14","version":"4.6-beta1-5031-gff699c0","pr":6279},"add_widget-visibility-custom-post-options":{"branch":"add\/widget-visibility-custom-post-options","commit":"f3dca5feda372a48fd960a3e1e7b5d4dde0da1ad","download_url":"https:\/\/betadownload.jetpack.me\/branches\/add_widget-visibility-custom-post-options\/jetpack-dev.zip","update_date":"2017-02-04 04:15:20","version":"4.6-beta1-5030-g8c60f34","pr":6278},"update_changelog-46":{"branch":"update\/changelog-46","commit":"9f929fde782d6570de4dcb2121819934adaee6a6","download_url":"https:\/\/betadownload.jetpack.me\/branches\/update_changelog-46\/jetpack-dev.zip","update_date":"2017-02-03 15:15:19","version":"4.6-beta1-5030-g65886f4","pr":6280},"fix_sync-sender-max_enqueue_time":{"branch":"fix\/sync-sender-max_enqueue_time","commit":"e980323b9f1e181dc69294b861f5a01b19c792e8","download_url":"https:\/\/betadownload.jetpack.me\/branches\/fix_sync-sender-max_enqueue_time\/jetpack-dev.zip","update_date":"2017-02-03 16:45:16","version":"4.6-beta1-5030-g0d83dc5","pr":6281},"update_move-connections-to-at-a-glance":{"branch":"update\/move-connections-to-at-a-glance","commit":"fe47b0ac0034acfe91aa37bf5922ee29d69a93a1","download_url":"https:\/\/betadownload.jetpack.me\/branches\/update_move-connections-to-at-a-glance\/jetpack-dev.zip","update_date":"2017-02-03 22:30:16","version":"4.6-beta1-5139-g0cdf2de","pr":6287},"update_ga-description":{"branch":"update\/ga-description","commit":"8388f65a0357d1b98ac779a0059943cfc3992617","download_url":"https:\/\/betadownload.jetpack.me\/branches\/update_ga-description\/jetpack-dev.zip","update_date":"2017-02-04 03:04:06","version":"4.6-beta1-5032-gbddec65","pr":6291},"fix_sync-endpoint-start-sync":{"branch":"fix\/sync-endpoint-start-sync","commit":"2004c06384c5a7270005567b7fd40a0e20b914b6","download_url":"https:\/\/betadownload.jetpack.me\/branches\/fix_sync-endpoint-start-sync\/jetpack-dev.zip","update_date":"2017-02-04 02:56:32","version":"4.6-beta1-5032-g4d1f997","pr":6292}},"master":{"branch":"master","commit":"e917ca1d640ad70a622d25a8e0e121b2338ca2d5","download_url":"https:\/\/betadownload.jetpack.me\/branches\/master\/jetpack-dev.zip","update_date":"2017-02-04 04:15:23","version":"4.5-rc1-4944-g224075d","pr":5503},"rc":{"branch-4.6":{"branch":"branch-4.6","commit":"ba58184466f9e160bd3e320f7b4ca0fe860748d0","download_url":"https:\/\/betadownload.jetpack.me\/branches\/branch-4.6\/jetpack-dev.zip","update_date":"2017-02-04 04:05:25","version":"4.6-beta2-5028-gba58184","pr":false}}}' );
		return wp_remote_get( JETPACK_BETA_MANIFEST_URL );

		$manifest = get_site_transient( 'jetpack_beta_manifest' );
		if ( false && $manifest ) {
			return $manifest;
		}

		$manifest = wp_remote_get( JETPACK_BETA_MANIFEST_URL );
		error_log( print_r( $manifest,1 ));
		if ( is_wp_error( $manifest ) ) {
			return false;
		}

		set_site_transient( 'jetpack_beta_manifest', $manifest, MINUTE_IN_SECONDS * 15 );
		return $manifest;
	}

	public function get_date() {
		return date( 'Y-m-d', time() );
	}

	public function get_description() {
		$plugin_data          = $this->get_remote_plugin_data();
		$current_jetpack_data = $this->get_plugin_data();

		return isset( $plugin_data->sections, $plugin_data->sections->description )
			? $plugin_data->sections->description
			: $current_jetpack_data['Description'];
	}

	public function get_plugin_data() {
		return get_plugin_data( WP_PLUGIN_DIR . '/' . $this->config['plugin_file'] );
	}

	/**
	 * Hook into the plugin update check and connect to GitHub
	 *
	 * @since 1.0
	 *
	 * @param object $transient the plugin data transient
	 *
	 * @return object $transient updated plugin data transient
	 */
	public function api_check( $transient ) {

		// Check if the transient contains the 'checked' information
		// If not, just return its value without hacking it
		if ( empty( $transient->checked ) ) {
			return $transient;
		}

		delete_site_transient( 'jetpack_beta_rc' );
		delete_site_transient( 'jetpack_beta_bleeding_edge' );

		// Update tags
		$this->set_update_args();

		// check the version and decide if it's new
		$update = version_compare( $this->config['new_version'], $this->config['version'], '>' );
		if ( $update ) {
			$response              = new stdClass;
			$response->plugin      = $this->config['slug'];
			$response->new_version = $this->config['new_version'];
			$response->slug        = $this->config['slug'];
			$response->url         = $this->config['code_url'];
			$response->package     = $this->config['zip_url'];
			// If response is false, don't alter the transient
			if ( false !== $response ) {
				$transient->response[ $this->config['plugin_file'] ] = $response;
			}
		} else {
			// Let  make sure that there is nothing to update there...
			unset( $transient->response[ $this->config['plugin_file'] ] );
		}

		return $transient;
	}

	/**
	 * Get Plugin info
	 * This gets called when the user clicks on view details.
	 *
	 * @since 1.0
	 *
	 * @param bool $false always false
	 * @param string $action the API function being performed
	 * @param object $args plugin arguments
	 *
	 * @return object $response the plugin info
	 */
	public function get_plugin_info( $false, $action, $response ) {
		// Check if this call API is for the right plugin
		if ( ! isset( $response->slug ) || $response->slug != 'jetpack' ) {
			return false;
		}
		// Update tags
		$this->set_update_args();
		$response->slug          = $this->config['slug'];
		$response->plugin        = $this->config['slug'];
		$response->name          = $this->config['plugin_name'];
		$response->plugin_name   = $this->config['plugin_name'];
		$response->version       = $this->config['new_version'];
		$response->author        = $this->config['author'];
		$response->homepage      = $this->config['homepage'];
		$response->requires      = $this->config['requires'];
		$response->tested        = $this->config['tested'];
		$response->downloaded    = 0;
		$response->last_updated  = $this->config['last_updated'];
		$response->sections      = array( 'description' => $this->get_description() );
		$response->download_link = $this->config['zip_url'];

		return $response;
	}

	function is_bleeding_edge() {
		return (bool) ( get_option( 'jp_beta_type', 'latest' ) === 'latest' );
	}

	function get_remote_plugin_data() {
		if ( $this->is_bleeding_edge() ) {
			$url  = JPBETA_BLEEDING_EDGE_URL;
			$type = 'bleeding_edge';
		} else {
			// RC
			$url  = JPBETA_RC_URL;
			$type = 'rc';
		}

		$plugin_data = get_site_transient( 'jetpack_beta_' . $type );
		if ( $this->overrule_transients() || ! empty( $plugin_data ) ) {
			return $plugin_data;
		}

		$plugin_data = wp_remote_get( $url );
		if ( is_wp_error( $plugin_data ) ) {
			error_log( 'JETPACK BETA: CAN\'T GET TO THE URL (' . $url . ') THIS SHOULDN\'T HAPPEN' );

			return false;
		}

		$plugin_data = json_decode( $plugin_data['body'] );
		// refresh every 6 hours
		set_site_transient( 'jetpack_beta_' . $type, $plugin_data, HOUR_IN_SECONDS * 6 );

		/**
		 * {
		 * "name": "Jetpack",
		 * "slug": "jetpack",
		 * "download_url": "http://betadownload.jetpack.me/rc/jetpack.zip",
		 * "version": "4.5-beta2",
		 * "author": "Automattic",
		 * "sections": {
		 * "description": "Saves lives and rescues kittens."
		 * }
		 * }
		 * */
		return (object) $plugin_data;
	}

	function auto_update_jetpack_beta ( $update, $item ) {
		if ( 'sure' !== get_option( 'jp_beta_autoupdate') ) {
			return $update;
		}

		// Array of plugin slugs to always auto-update
		$plugins = array (
			JETPACK_PLUGIN_ID,
		);
		if ( in_array( $item->slug, $plugins ) ) {
			return true; // Always update plugins in this array
		} else {
			return $update; // Else, use the normal API response to decide whether to update or not
		}
	}

	static function get_zip() {
		// The zip to install
		return 'https://downloads.wordpress.org/plugin/jetpack.zip';
	}

	/**
	 * Tell us what version the user is supposed to be running.
	 */
	static function get_version() {
		return get_option( 'jp_beta_type' );
	}
}

register_activation_hook( __FILE__, array( 'Jetpack_Beta_Tester', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Jetpack_Beta_Tester', 'deactivate' ) );

add_action( 'init', array( 'Jetpack_Beta_Tester', 'instance' ) );




