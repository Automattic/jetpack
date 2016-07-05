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

	public static function rest_api_allowed_post_types() {
		/** This filter is already documented in class.json-api-endpoints.php */
		return apply_filters( 'rest_api_allowed_post_types', array( 'post', 'page', 'revision' ) );
	}

	/**
	 * Finds out if a site is using a version control system.
	 * @return bool
	 **/
	public static function is_version_controlled() {

		if ( ! class_exists( 'WP_Automatic_Updater' ) ) {
			require_once( ABSPATH . 'wp-admin/includes/class-wp-upgrader.php' );
		}
		$updater               = new WP_Automatic_Updater();
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
		if ( $filesystem_method === 'direct' ) {
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
		return self::preserve_scheme( 'home', home_url() );
	}

	public static function site_url() {
		return self::preserve_scheme( 'siteurl', site_url() );
	}

	public static function main_network_site_url() {
		return self::preserve_scheme( 'siteurl', network_site_url() );
	}

	public static function preserve_scheme( $option, $current_url ) {
		$option_url = get_option( $option );
		if ( $option_url === $current_url ) {
			return $current_url;
		}
		$parsed_option_url = parse_url( $option_url );
		$parsed_current_url = parse_url( $current_url );
		if ( $parsed_current_url[ 'host' ] === $parsed_option_url[ 'host' ] ) {
			return set_url_scheme( $current_url,  $parsed_option_url['scheme'] );
		}

		return $current_url;
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
