<?php

require_once( dirname( __FILE__ ) . '/class.wp-super-cache-settings-map.php' );

class WP_Super_Cache_Rest_Get_Settings extends WP_REST_Controller {

	/**
	 * Get the settings.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {
		$settings = array();

		global $wp_cache_config_file;

		if ( defined( 'WPLOCKDOWN' ) ) {
			$config_file = file_get_contents( $wp_cache_config_file );
			if ( false === strpos( $config_file, "defined( 'WPLOCKDOWN' )" ) ) {
				wp_cache_replace_line( '^.*WPLOCKDOWN', "if ( ! defined( 'WPLOCKDOWN' ) ) define( 'WPLOCKDOWN', " . $this->get_is_lock_down_enabled() . " );", $wp_cache_config_file );
			}
		}

		if ( function_exists( "opcache_invalidate" ) ) {
			opcache_invalidate( $wp_cache_config_file );
		}
		include( $wp_cache_config_file );

		foreach ( WP_Super_Cache_Settings_Map::$map as $name => $map ) {
			if ( isset ( $map['get'] ) ) {
				$get_method = $map['get'];

				if ( method_exists( $this, $get_method ) ) {
					$settings[ $name ] = $this->$get_method();

				} elseif ( function_exists( $get_method ) ) {
					$settings[ $name ] = $get_method();
				}

			} else if ( isset ( $map['option'] ) ) {
				$settings[ $name ] = get_option( $map['option'] );

			} elseif ( isset( $map['global'] ) ) {
				$global_var = $map['global'];
				if ( false == isset( $$global_var ) ) {
					$settings[ $name ] = false;
				} else {
					$settings[ $name ] = $$global_var;
				}
			}
		}

		return $this->prepare_item_for_response( $settings, $request );
	}

	/**
	 * @return string
	 */
	public function get_ossdl_off_blog_url() {
		$url = get_option( 'ossdl_off_blog_url' );
		if ( ! $url )
			$url = apply_filters( 'ossdl_off_blog_url', untrailingslashit( get_option( 'siteurl' ) ) );
		return $url;
	}

	/**
	 * @return string
	 */
	public function get_cache_path_url() {
		global $cache_path;

		return site_url( str_replace( ABSPATH, '', "{$cache_path}" ) );
	}

	/**
	 * @return string
	 */
	public function get_cache_type() {
		global $wp_cache_config_file;
		if ( function_exists( "opcache_invalidate" ) ) {
			opcache_invalidate( $wp_cache_config_file );
		}
		include( $wp_cache_config_file );

		if ( $wp_cache_mod_rewrite == 1 ) {
			return 'mod_rewrite';
		} else {
			return 'PHP';
		}
	}

	/**
	 * Prepare the item for the REST response
	 *
	 * @param mixed $item WordPress representation of the item.
	 * @param WP_REST_Request $request Request object.
	 * @return mixed
	 */
	public function prepare_item_for_response( $item, $request ) {
		$settings = array();

		$integers = array( 'cache_max_time', 'preload_interval' );
		$string_arrays = array( 'cache_stats', 'cache_acceptable_files', 'cache_rejected_uri', 'cache_rejected_user_agent',
			'cache_direct_pages' );
		foreach( $item as $key => $value ) {
			if ( is_array( $value ) && false == in_array( $key, $string_arrays ) ) {
				array_walk( $value, array( $this, 'make_array_bool' ) );

			} elseif ( ( $value === 0 || $value === 1 ) && false == in_array( $key, $integers ) ) {
				$value = (bool)$value;
			}

			$settings[ $key ] = $value;
		}

		$strings_to_bool = array( 'ossdl_https', 'refresh_current_only_on_comments' );
		foreach( $strings_to_bool as $key ) {
			if ( isset( $settings[ $key ] ) ) {
				$settings[ $key ] = (bool)$settings[ $key ];
			}
		}

		return rest_ensure_response( $settings );
	}

	/**
	 * @param mixed $value
	 * @param string $key
	 */
	public function make_array_bool( &$value, $key ) {
		if ( $value == 0 || $value == 1 ) {
			$value = (bool) $value;
		}
	}

	/**
	 * @return bool
	 */
	protected function get_is_submit_enabled() {
		global $wp_cache_config_file;
		return is_writeable_ACLSafe( $wp_cache_config_file );
	}

	/**
	 * @return bool
	 */
	protected function get_is_preload_enabled() {
		return false === defined( 'DISABLESUPERCACHEPRELOADING' );
	}

	/**
	 * @return false|int
	 */
	protected function get_next_gc() {
		return wp_next_scheduled( 'wp_cache_gc' );
	}

	/**
	 * @return int
	 */
	protected function get_is_preload_active() {
		if ( wp_next_scheduled( 'wp_cache_preload_hook' ) || wp_next_scheduled( 'wp_cache_full_preload_hook' ) ) { 
			return true;
		} else {
			return false;
		}
	}

	/**
	 * @return int
	 */
	protected function get_minimum_preload_interval() {
		global $wpdb;
		$count = $this->get_post_count();
		if ( $count > 1000 ) {
			$min_refresh_interval = 720;
		} else {
			$min_refresh_interval = 30;
		}

		return $min_refresh_interval;
	}

	/**
	 * @return int
	 */
	protected function get_is_lock_down_enabled() {
		if ( defined( 'WPLOCKDOWN' ) ) {
			return constant( 'WPLOCKDOWN' ) ? 1 : 0;
		}

		return 0;
	}

	/**
	 * @return int
	 */
	protected function get_post_count() {
		return wpsc_post_count();
	}

	/**
	 * @return string
	 */
	protected function get_default_cache_path() {
		return WP_CONTENT_DIR . '/wp-cache/';
	}
}
