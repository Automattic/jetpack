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
		return get_home_url( null, '', self::get_url_scheme_for_callable( 'home_url' ) );
	}

	public static function site_url() {
		return get_site_url( null, '', self::get_url_scheme_for_callable( 'site_url' ) );
	}

	public static function main_network_site_url() {
		return network_site_url( '', self::get_url_scheme_for_callable( 'main_network_site_url' ) );
	}

	public static function get_url_scheme_for_callable( $callable ) {
		/**
		 * By default, we will set the URL scheme for URL callables to http. This filter fires for each callable
		 * and allows developers to change that behavior so that the URLs can conditionally be synced with https schemes.
		 *
		 * @since 4.4.0
		 *
		 * @param string 'http'    The default scheme that will be used for the URL synced to WordPress.com
		 * @param string $callable The name of the callable that is being synced
		 */
		$scheme = apply_filters( 'jetpack_synced_urls_scheme', 'http', $callable );

		if ( 'http' !== $scheme && 'https' !== $scheme ) {
			$scheme = 'http';
		}

		return $scheme;
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

	public static function site_icon_url() {
		if ( ! function_exists( 'get_site_icon_url' ) || ! has_site_icon() ) {
			return get_option( 'jetpack_site_icon_url' );
		}

		return get_site_icon_url();
	}
}
