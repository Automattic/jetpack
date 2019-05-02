<?php

/*
 * Utility functions to generate data synced to wpcom
 */

class Jetpack_Sync_Functions {
	const HTTPS_CHECK_OPTION_PREFIX = 'jetpack_sync_https_history_';
	const HTTPS_CHECK_HISTORY       = 5;

	public static function get_modules() {
		require_once JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php';

		return Jetpack_Admin::init()->get_modules();
	}

	public static function get_taxonomies() {
		global $wp_taxonomies;
		$wp_taxonomies_without_callbacks = array();
		foreach ( $wp_taxonomies as $taxonomy_name => $taxonomy ) {
			$sanitized_taxonomy = self::sanitize_taxonomy( $taxonomy );
			if ( ! empty( $sanitized_taxonomy ) ) {
				$wp_taxonomies_without_callbacks[ $taxonomy_name ] = $sanitized_taxonomy;
			} else {
				error_log( 'Jetpack: Encountered a recusive taxonomy:' . $taxonomy_name );
			}
		}
		return $wp_taxonomies_without_callbacks;
	}

	public static function get_shortcodes() {
		global $shortcode_tags;
		return array_keys( $shortcode_tags );
	}

	/**
	 * Removes any callback data since we will not be able to process it on our side anyways.
	 */
	public static function sanitize_taxonomy( $taxonomy ) {

		// Lets clone the taxonomy object instead of modifing the global one.
		$cloned_taxonomy = json_decode( wp_json_encode( $taxonomy ) );

		// recursive taxonomies are no fun.
		if ( is_null( $cloned_taxonomy ) ) {
			return null;
		}
		// Remove any meta_box_cb if they are not the default wp ones.
		if ( isset( $cloned_taxonomy->meta_box_cb ) &&
			 ! in_array( $cloned_taxonomy->meta_box_cb, array( 'post_tags_meta_box', 'post_categories_meta_box' ) ) ) {
			$cloned_taxonomy->meta_box_cb = null;
		}
		// Remove update call back
		if ( isset( $cloned_taxonomy->update_count_callback ) &&
			 ! is_null( $cloned_taxonomy->update_count_callback ) ) {
			$cloned_taxonomy->update_count_callback = null;
		}
		// Remove rest_controller_class if it something other then the default.
		if ( isset( $cloned_taxonomy->rest_controller_class ) &&
			 'WP_REST_Terms_Controller' !== $cloned_taxonomy->rest_controller_class ) {
			$cloned_taxonomy->rest_controller_class = null;
		}
		return $cloned_taxonomy;
	}

	public static function get_post_types() {
		global $wp_post_types;

		$post_types_without_callbacks = array();
		foreach ( $wp_post_types as $post_type_name => $post_type ) {
			$sanitized_post_type = self::sanitize_post_type( $post_type );
			if ( ! empty( $sanitized_post_type ) ) {
				$post_types_without_callbacks[ $post_type_name ] = $sanitized_post_type;
			} else {
				error_log( 'Jetpack: Encountered a recusive post_type:' . $post_type_name );
			}
		}
		return $post_types_without_callbacks;
	}

	public static function sanitize_post_type( $post_type ) {
		// Lets clone the post type object instead of modifing the global one.
		$sanitized_post_type = array();
		foreach ( Jetpack_Sync_Defaults::$default_post_type_attributes as $attribute_key => $default_value ) {
			if ( isset( $post_type->{ $attribute_key } ) ) {
				$sanitized_post_type[ $attribute_key ] = $post_type->{ $attribute_key };
			}
		}
		return (object) $sanitized_post_type;
	}

	public static function expand_synced_post_type( $sanitized_post_type, $post_type ) {
		$post_type        = sanitize_key( $post_type );
		$post_type_object = new WP_Post_Type( $post_type, $sanitized_post_type );
		$post_type_object->add_supports();
		$post_type_object->add_rewrite_rules();
		$post_type_object->add_hooks();
		$post_type_object->register_taxonomies();
		return (object) $post_type_object;
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
		if ( defined( 'VIP_GO_ENV' ) && false !== VIP_GO_ENV ) {
			return 'vip-go';
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
	 *
	 * @return bool
	 **/
	public static function is_version_controlled() {

		if ( ! class_exists( 'WP_Automatic_Updater' ) ) {
			require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
		}
		$updater = new WP_Automatic_Updater();

		return (bool) strval( $updater->is_vcs_checkout( $context = ABSPATH ) );
	}

	/**
	 * Returns true if the site has file write access false otherwise.
	 *
	 * @return bool
	 **/
	public static function file_system_write_access() {
		if ( ! function_exists( 'get_filesystem_method' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		require_once ABSPATH . 'wp-admin/includes/template.php';

		$filesystem_method = get_filesystem_method();
		if ( 'direct' === $filesystem_method ) {
			return true;
		}

		ob_start();

		if ( ! function_exists( 'request_filesystem_credentials' ) ) {
			require_once ABSPATH . 'wp-admin/includes/file.php';
		}

		$filesystem_credentials_are_stored = request_filesystem_credentials( self_admin_url() );
		ob_end_clean();
		if ( $filesystem_credentials_are_stored ) {
			return true;
		}

		return false;
	}

	/**
	 * Helper function that is used when getting home or siteurl values. Decides
	 * whether to get the raw or filtered value.
	 *
	 * @return string
	 */
	public static function get_raw_or_filtered_url( $url_type ) {
		$url_function = ( 'home' == $url_type )
			? 'home_url'
			: 'site_url';

		if (
			! Jetpack_Constants::is_defined( 'JETPACK_SYNC_USE_RAW_URL' ) ||
			Jetpack_Constants::get_constant( 'JETPACK_SYNC_USE_RAW_URL' )
		) {
			$scheme = is_ssl() ? 'https' : 'http';
			$url    = self::get_raw_url( $url_type );
			$url    = set_url_scheme( $url, $scheme );
		} else {
			$url = self::normalize_www_in_url( $url_type, $url_function );
		}

		return self::get_protocol_normalized_url( $url_function, $url );
	}

	public static function home_url() {
		$url = self::get_raw_or_filtered_url( 'home' );

		/**
		 * Allows overriding of the home_url value that is synced back to WordPress.com.
		 *
		 * @since 5.2.0
		 *
		 * @param string $home_url
		 */
		return esc_url_raw( apply_filters( 'jetpack_sync_home_url', $url ) );
	}

	public static function site_url() {
		$url = self::get_raw_or_filtered_url( 'siteurl' );

		/**
		 * Allows overriding of the site_url value that is synced back to WordPress.com.
		 *
		 * @since 5.2.0
		 *
		 * @param string $site_url
		 */
		return esc_url_raw( apply_filters( 'jetpack_sync_site_url', $url ) );
	}

	public static function main_network_site_url() {
		return self::get_protocol_normalized_url( 'main_network_site_url', network_site_url() );
	}

	public static function get_protocol_normalized_url( $callable, $new_value ) {
		$option_key = self::HTTPS_CHECK_OPTION_PREFIX . $callable;

		$parsed_url = wp_parse_url( $new_value );
		if ( ! $parsed_url ) {
			return $new_value;
		}
		if ( array_key_exists( 'scheme', $parsed_url ) ) {
			$scheme = $parsed_url['scheme'];
		} else {
			$scheme = '';
		}
		$scheme_history   = get_option( $option_key, array() );
		$scheme_history[] = $scheme;

		// Limit length to self::HTTPS_CHECK_HISTORY
		$scheme_history = array_slice( $scheme_history, ( self::HTTPS_CHECK_HISTORY * -1 ) );

		update_option( $option_key, $scheme_history );

		$forced_scheme = in_array( 'https', $scheme_history ) ? 'https' : 'http';

		return set_url_scheme( $new_value, $forced_scheme );
	}

	public static function get_raw_url( $option_name ) {
		$value    = null;
		$constant = ( 'home' == $option_name )
			? 'WP_HOME'
			: 'WP_SITEURL';

		// Since we disregard the constant for multisites in ms-default-filters.php,
		// let's also use the db value if this is a multisite.
		if ( ! is_multisite() && Jetpack_Constants::is_defined( $constant ) ) {
			$value = Jetpack_Constants::get_constant( $constant );
		} else {
			// Let's get the option from the database so that we can bypass filters. This will help
			// ensure that we get more uniform values.
			$value = Jetpack_Options::get_raw_option( $option_name );
		}

		return $value;
	}

	public static function normalize_www_in_url( $option, $url_function ) {
		$url        = wp_parse_url( call_user_func( $url_function ) );
		$option_url = wp_parse_url( get_option( $option ) );

		if ( ! $option_url || ! $url ) {
			return $url;
		}

		if ( $url['host'] === "www.{$option_url[ 'host' ]}" ) {
			// remove www if not present in option URL
			$url['host'] = $option_url['host'];
		}
		if ( $option_url['host'] === "www.{$url[ 'host' ]}" ) {
			// add www if present in option URL
			$url['host'] = $option_url['host'];
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

	/**
	 * Get custom action link tags that the plugin is using
	 * Ref: https://codex.wordpress.org/Plugin_API/Filter_Reference/plugin_action_links_(plugin_file_name)
	 *
	 * @return array of plugin action links (key: link name value: url)
	 */
	public static function get_plugins_action_links( $plugin_file_singular = null ) {
		// Some sites may have DOM disabled in PHP fail early
		if ( ! class_exists( 'DOMDocument' ) ) {
			return array();
		}
		$plugins_action_links = get_option( 'jetpack_plugin_api_action_links', array() );
		if ( ! empty( $plugins_action_links ) ) {
			if ( is_null( $plugin_file_singular ) ) {
				return $plugins_action_links;
			}
			return ( isset( $plugins_action_links[ $plugin_file_singular ] ) ? $plugins_action_links[ $plugin_file_singular ] : null );
		}
		return array();
	}

	public static function wp_version() {
		global $wp_version;
		return $wp_version;
	}

	public static function site_icon_url( $size = 512 ) {
		$site_icon = get_site_icon_url( $size );
		return $site_icon ? $site_icon : get_option( 'jetpack_site_icon_url' );
	}

	public static function roles() {
		$wp_roles = wp_roles();
		return $wp_roles->roles;
	}

	/**
	 * Determine time zone from WordPress' options "timezone_string"
	 * and "gmt_offset".
	 *
	 * 1. Check if `timezone_string` is set and return it.
	 * 2. Check if `gmt_offset` is set, formats UTC-offset from it and return it.
	 * 3. Default to "UTC+0" if nothing is set.
	 *
	 * @return string
	 */
	public static function get_timezone() {
		$timezone_string = get_option( 'timezone_string' );

		if ( ! empty( $timezone_string ) ) {
			return str_replace( '_', ' ', $timezone_string );
		}

		$gmt_offset = get_option( 'gmt_offset', 0 );

		$formatted_gmt_offset = sprintf( '%+g', floatval( $gmt_offset ) );

		$formatted_gmt_offset = str_replace(
			array( '.25', '.5', '.75' ),
			array( ':15', ':30', ':45' ),
			(string) $formatted_gmt_offset
		);

		/* translators: %s is UTC offset, e.g. "+1" */
		return sprintf( __( 'UTC%s', 'jetpack' ), $formatted_gmt_offset );
	}
	// New in WP 5.1
	public static function get_paused_themes() {
		if ( function_exists( 'wp_paused_themes' ) ) {
			$paused_themes = wp_paused_themes();
			return $paused_themes->get_all();
		}
		return false;
	}
	// New in WP 5.1
	public static function get_paused_plugins() {
		if ( function_exists( 'wp_paused_plugins' ) ) {
			$paused_plugins = wp_paused_plugins();
			return $paused_plugins->get_all();
		}
		return false;
	}
}
