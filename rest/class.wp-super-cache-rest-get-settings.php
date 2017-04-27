<?php

require_once __DIR__ . '/class.wp-super-cache-settings-map.php';

class WP_Super_Cache_Rest_Get_Settings extends WP_REST_Controller {

	/**
	 * Get the settings.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {
		$settings = array();

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
				global ${$global_var};
				$settings[ $name ] = $$global_var;
			}
		}

		return $this->prepare_item_for_response( $settings, $request );
	}

	/**
	 * @return array
	 */
	public function get_cache_stats() {
		$cache_stats = get_option( 'supercache_stats' );

		// If stats are empty, let's generate them.
		if ( false == is_array( $cache_stats ) ) {
			$cache_stats = wp_cache_regenerate_cache_file_stats();
		}

		return $cache_stats;
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

		$string_arrays = array( 'cache_stats', 'cache_acceptable_files', 'cache_rejected_uri', 'cache_rejected_user_agent' );
		foreach( $item as $key => $value ) {
			if ( is_array( $value ) && false == in_array( $key, $string_arrays ) ) {
				array_walk( $value, array( $this, 'make_array_bool' ) );

			} elseif ( ( $value === 0 || $value === 1 ) && $key != 'preload_interval' ) {
				$value = (bool)$value;
			}

			$settings[ $key ] = $value;
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
	protected function get_minimum_preload_interval() {
		global $wpdb;
		$count = $wpdb->get_var( "SELECT count(ID) FROM {$wpdb->posts} WHERE post_status = 'publish'" );
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

	protected function get_post_count() {
		$posts_count = wp_count_posts();
		return $posts_count->publish;
	}
}
