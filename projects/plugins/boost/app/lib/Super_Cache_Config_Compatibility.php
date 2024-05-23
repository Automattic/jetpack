<?php

namespace Automattic\Jetpack_Boost\Lib;

class Super_Cache_Config_Compatibility {
	public static function is_compatible() {
		if ( ! self::include_supercache_config() ) {
			\l( 'WPSC config file not found.' );
			return true;
		}

		if ( self::is_mobile_enabled() ) {
			\l( 'WPSC mobile enabled.' );
			return false;
		}

		if ( self::is_late_init_enabled() ) {
			\l( 'WPSC late init enabled.' );
			return false;
		}

		if ( self::is_rejected_cookies_configured() ) {
			\l( 'WPSC rejected cookies configured.' );
			return false;
		}

		if ( self::is_cache_restrictions_configured() ) {
			\l( 'WPSC cache restrictions configured.' );
			return false;
		}

		if ( self::is_preload_enabled() ) {
			\l( 'WPSC preload enabled.' );
			return false;
		}

		if ( self::is_no_cache_for_get_enabled() ) {
			\l( 'Exclude cache for get parameters enabled.' );
			return false;
		}

		if ( self::is_save_headers_enabled() ) {
			\l( 'WPSC save HTTP headers enabled.' );
			return false;
		}

		if ( self::is_make_known_anon_enabled() ) {
			\l( 'WPSC make known users anonymous enabled.' );
			return false;
		}

		if ( self::is_dynamic_cache_enabled() ) {
			\l( 'WPSC dynamic cache enabled.' );
			return false;
		}

		if ( self::is_clear_on_post_edit_enabled() ) {
			\l( 'WPSC clear cache on post edit enabled.' );
			return false;
		}

		if ( self::is_front_page_checks_enabled() ) {
			\l( 'WPSC extra homepage checks enabled.' );
			return false;
		}

		if ( self::is_extra_pages_enabled() ) {
			\l( 'WPSC extra pages enabled.' );
			return false;
		}

		if ( self::is_extra_acceptable_files_enabled() ) {
			\l( 'WPSC extra acceptable files enabled.' );
			return false;
		}

		if ( self::is_extra_rejected_uris_enabled() ) {
			\l( 'WPSC extra rejected URIs enabled.' );
			return false;
		}

		if ( self::is_extra_rejected_user_agents_enabled() ) {
			\l( 'WPSC extra rejected user agents enabled.' );
			return false;
		}

		return true;
	}

	private static function include_supercache_config() {
		return include WPCACHECONFIGPATH . '/wp-cache-config.php';
	}

	private static function is_mobile_enabled() {
		return ! empty( $GLOBALS['wp_cache_mobile_enabled'] );
	}

	private static function is_late_init_enabled() {
		return ! empty( $GLOBALS['wp_super_cache_late_init'] );
	}

	private static function is_rejected_cookies_configured() {
		return ! empty( $GLOBALS['wpsc_rejected_cookies'] );
	}

	private static function is_cache_restrictions_configured() {
		return isset( $GLOBALS['wp_cache_not_logged_in'] ) && $GLOBALS['wp_cache_not_logged_in'] !== 2;
	}

	private static function is_preload_enabled() {
		return ! empty( $GLOBALS['wp_cache_preload_on'] );
	}

	private static function is_no_cache_for_get_enabled() {
		return ! empty( $GLOBALS['wp_cache_no_cache_for_get'] );
	}

	private static function is_save_headers_enabled() {
		return ! empty( $GLOBALS['wpsc_save_headers'] );
	}

	private static function is_make_known_anon_enabled() {
		return ! empty( $GLOBALS['wp_cache_make_known_anon'] );
	}

	private static function is_dynamic_cache_enabled() {
		return ! empty( $GLOBALS['wp_cache_mfunc_enabled'] );
	}

	private static function is_clear_on_post_edit_enabled() {
		return ! empty( $GLOBALS['wp_cache_clear_on_post_edit'] );
	}

	private static function is_front_page_checks_enabled() {
		return ! empty( $GLOBALS['wp_cache_front_page_checks'] );
	}

	private static function is_extra_pages_enabled() {
		return is_array( $GLOBALS['wp_cache_pages'] ) && array_sum( $GLOBALS['wp_cache_pages'] );
	}

	private static function is_extra_acceptable_files_enabled() {
		$default_cache_acceptable_files = array( 'wp-comments-popup.php', 'wp-links-opml.php', 'wp-locations.php' );
		return self::is_array_value_changed( $default_cache_acceptable_files, $GLOBALS['cache_acceptable_files'] );
	}

	private static function is_extra_rejected_uris_enabled() {
		$default_cache_rejected_uri = array( 'wp-.*\\.php', 'index\\.php' );
		return self::is_array_value_changed( $default_cache_rejected_uri, $GLOBALS['cache_rejected_uri'] );
	}

	private static function is_extra_rejected_user_agents_enabled() {
		return self::is_array_value_changed( array( '' ), $GLOBALS['cache_rejected_user_agent'] );
	}

	private static function is_array_value_changed( $default, $current ) {
		return is_array( $current ) && array_diff( $current, $default );
	}
}
