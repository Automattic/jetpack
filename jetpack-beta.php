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

define( 'JPBETA__PLUGIN_FILE', plugins_url() . '/jetpack-beta/' );
define( 'JPBETA__DIR', dirname( __FILE__ ) . '/' );

define( 'JPBETA_RC_URL', 'https://betadownload.jetpack.me/rc/rc.json' );
define( 'JPBETA_BLEEDING_EDGE_URL', 'https://betadownload.jetpack.me/jetpack-bleeding-edge.json' );

define( 'JPBETA_GITHUB_API_URL', 'https://api.github.com/repos/Automattic/jetpack/' );
define( 'JPBETA_GITHUB_RAW_CONTENT_URL', 'https://raw.githubusercontent.com/Automattic/jetpack/' );
define( 'JPBETA_DEV_STABLE_DOWNLOAD_URL', 'https://downloads.wordpress.org/plugin/jetpack.zip' );

if ( defined( 'IS_PRESSABLE' ) && IS_PRESSABLE ) {
	define( 'JETPACK_PLUGIN_PATH', WP_PLUGIN_DIR . '/jetpack-pressable-beta/jetpack.php' );
	define( 'JETPACK_PLUGIN_ID', 'jetpack-pressable-beta/jetpack.php' );
	define( 'JETPACK_PLUGIN_FOLDER', 'jetpack-pressable-beta' );
} else {
	define( 'JETPACK_PLUGIN_PATH', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
	define( 'JETPACK_PLUGIN_ID', 'jetpack/jetpack.php' );
	define( 'JETPACK_PLUGIN_FOLDER', 'jetpack' );
}

/**
 * Confirm Jetpack is at least installed before doing anything
 * Curiously, developers are discouraged from using WP_PLUGIN_DIR and not given a
 * function with which to get the plugin directory, so this is what we have to do
 */
if ( ! file_exists( trailingslashit( dirname( dirname( __FILE__ ) ) ) . JETPACK_PLUGIN_ID ) ) :
	add_action( 'admin_notices', 'jetpack_beta_jetpack_not_installed' );
elseif ( ! class_exists( 'Jetpack_Beta_Tester' ) ) :

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
			// add_filter( 'upgrader_source_selection', array( $this, 'upgrader_source_selection' ), 10, 3 );

			if ( is_admin() ) {
				require JPBETA__DIR . 'jetpack-beta-admin.php';
				self::$admin = new Jetpack_Beta_Admin();

				if ( defined( 'IS_PRESSABLE' ) && IS_PRESSABLE ) {
					require JPBETA__DIR . 'pressable.php';
					Jetpack_Beta_Pressable::instance();
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
	}

	register_activation_hook( __FILE__, array( 'Jetpack_Beta_Tester', 'activate' ) );
	add_action( 'init', array( 'Jetpack_Beta_Tester', 'instance' ) );
endif;
/**
 * Jetpack Not Installed Notice
 **/
if ( ! function_exists( 'jetpack_beta_jetpack_not_installed' ) ) {
	function jetpack_beta_jetpack_not_installed() {
		echo '<div class="error"><p>' . sprintf( __( 'Jetpack Beta Tester requires %s to be installed.', 'jpbeta' ), '<a href="https://jetpack.com" target="_blank">Jetpack</a>' ) . '</p></div>';
	}
}

