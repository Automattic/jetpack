<?php

/*
 * Utility functions to generate data synced to wpcom
 */

class Jetpack_Sync_Functions {

	public static function get_modules() {
		require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php' );

		return Jetpack_Admin::init()->get_modules();
	}

	public static function get_taxonomies() {
		global $wp_taxonomies;

		return $wp_taxonomies;
	}

	public static function get_post_types() {
		global $wp_post_types;

		return $wp_post_types;
	}

	public static function get_post_type_features() {
		global $_wp_post_type_features;

		return $_wp_post_type_features;
	}

	public static function get_hosting_provider() {
		if ( defined( 'GD_SYSTEM_PLUGIN_DIR' ) || class_exists( '\\WPaaS\\Plugin' ) ) {
			return 'gd-managed-wp';
		}
		if ( defined( 'MM_BASE_DIR' ) ) {
			return 'bh';
		} 
		if ( defined( 'IS_PRESSABLE' ) ) {
			return 'pressable';
		} 
		if ( function_exists( 'is_wpe' ) || function_exists( 'is_wpe_snapshot' ) ) {
			return 'wpe';
		}
		return 'unknown';
	}

	public static function rest_api_allowed_post_types() {
		/** This filter is already documented in class.json-api-endpoints.php */
		return apply_filters( 'rest_api_allowed_post_types', array( 'post', 'page', 'revision' ) );
	}

	public static function rest_api_allowed_public_metadata() {
		/** This filter is documented in json-endpoints/class.wpcom-json-api-post-endpoint.php */
		return apply_filters( 'rest_api_allowed_public_metadata', array() );
	}

	/**
	 * Finds out if a site is using a version control system.
	 * @return bool
	 **/
	public static function is_version_controlled() {

		if ( ! class_exists( 'WP_Automatic_Updater' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/class-wp-upgrader.php' );
		}
		$updater = new WP_Automatic_Updater();

		return (bool) strval( $updater->is_vcs_checkout( $context = ABSPATH ) );
	}

	/**
	 * Returns true if the site has file write access false otherwise.
	 * @return bool
	 **/
	public static function file_system_write_access() {
		if ( ! function_exists( 'get_filesystem_method' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/file.php' );
		}

		require_once( ABSPATH . 'wp-admin/includes/template.php' );

		$filesystem_method = get_filesystem_method();
		if ( 'direct' === $filesystem_method  ) {
			return true;
		}

		ob_start();
		$filesystem_credentials_are_stored = request_filesystem_credentials( self_admin_url() );
		ob_end_clean();
		if ( $filesystem_credentials_are_stored ) {
			return true;
		}

		return false;
	}

	public static function home_url() {
		return self::preserve_scheme( 'home', 'home_url', true );
	}

	public static function site_url() {
		return self::preserve_scheme( 'siteurl', 'site_url', true );
	}

	public static function main_network_site_url() {
		return self::preserve_scheme( 'siteurl', 'network_site_url', false );
	}

	public static function preserve_scheme( $option, $url_function, $normalize_www = false ) {
		$previous_https_value = isset( $_SERVER['HTTPS'] ) ? $_SERVER['HTTPS'] : null;
		$_SERVER['HTTPS'] = 'off';
		$url = call_user_func( $url_function );
		$option_url = get_option( $option );
		if ( $previous_https_value ) {
			$_SERVER['HTTPS'] = $previous_https_value;	
		} else {
			unset( $_SERVER['HTTPS'] );
		}

		if ( $option_url === $url ) {
			return $url;
		}

		// turn them both into parsed format
		$option_url = parse_url( $option_url );
		$url        = parse_url( $url );

		if ( $normalize_www ) {
			if ( $url['host'] === "www.{$option_url[ 'host' ]}" ) {
				// remove www if not present in option URL
				$url['host'] = $option_url['host'];
			}
			if ( $option_url['host'] === "www.{$url[ 'host' ]}" ) {
				// add www if present in option URL
				$url['host'] = $option_url['host'];
			}
		}

		if ( $url['host'] === $option_url['host'] ) {
			$url['scheme'] = $option_url['scheme'];
			// return set_url_scheme( $current_url,  $option_url['scheme'] );
		}

		$normalized_url = "{$url['scheme']}://{$url['host']}";

		if ( isset( $url['path'] ) ) {
			$normalized_url .= "{$url['path']}";
		}

		if ( isset( $url['query'] ) ) {
			$normalized_url .= "?{$url['query']}";
		}

		return $normalized_url;
	}

	public static function get_plugins() {
		if ( ! function_exists( 'get_plugins' ) ) {
			require_once ABSPATH . 'wp-admin/includes/plugin.php';
		}

		/** This filter is documented in wp-admin/includes/class-wp-plugins-list-table.php */
		return apply_filters( 'all_plugins', get_plugins() );
	}

	public static function wp_version() {
		global $wp_version;

		return $wp_version;
	}
}
