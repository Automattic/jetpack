<?php

class WP_Super_Cache_Rest_Get_Settings extends WP_REST_Controller {

	public static $settings_map = array(
		// Local method gets
		'get_is_submit_enabled'         => 'is_submit_enabled',
		'get_is_preload_enabled'        => 'is_preload_enabled',
		'get_is_lock_down_enabled'      => 'lock_down',
		'get_next_gc'                   => 'cache_next_gc',

		// Globals
		'cache_enabled'                 => 'is_cache_enabled',
		'super_cache_enabled'           => 'is_super_cache_enabled',
		'wp_cache_mobile_enabled'       => 'is_mobile_enabled',
		'wp_cache_mfunc_enabled'        => 'is_mfunc_enabled',
		'wp_supercache_cache_list'      => 'cache_list',
		'wp_cache_config_file'          => 'config_file',
		'wp_cache_clear_on_post_edit'   => 'clear_cache_on_post_edit',
		'cache_rebuild_files'           => 'cache_rebuild',
		'wp_cache_not_logged_in'        => 'dont_cache_logged_in',
		'wp_cache_make_known_anon'      => 'make_known_anon',
		'cache_path'                    => 'cache_path',
		'wp_cache_refresh_single_only'  => 'refresh_current_only_on_comments',
		'cache_compression'             => 'cache_compression',
		'wp_cache_mod_rewrite'          => 'cache_mod_rewrite',
		'wp_supercache_304'             => 'use_304_headers',
		'wp_super_cache_late_init'      => 'cache_late_init',
		'wp_cache_front_page_checks'    => 'front_page_checks',
		'cache_page_secret'             => 'cache_page_secret',
		'wp_cache_disable_utf8'         => 'disable_utf8',
		'wp_cache_no_cache_for_get'     => 'no_cache_for_get',
		'cache_schedule_type'           => 'cache_schedule_type',
		'cache_scheduled_time'          => 'cache_scheduled_time',
		'cache_max_time'                => 'cache_max_time',
		'cache_time_interval'           => 'cache_time_interval',
		'wp_cache_shutdown_gc'          => 'shutdown_garbage_collector',
		'wp_cache_pages'                => 'pages',
		'wp_cache_preload_interval'     => 'preload_interval',
		'wp_cache_preload_posts'        => 'preload_posts',
		'wp_cache_preload_on'           => 'preload_on',
		'wp_cache_preload_taxonomies'   => 'preload_taxonomies',
		'wp_cache_preload_email_volume' => 'preload_email_volume',
		'wp_cache_mobile_browsers'      => 'cache_mobile_browsers',
		'wp_cache_mobile_prefixes'      => 'cache_mobile_prefixes',
		'wp_cache_mutex_disabled'       => 'cache_disable_locking',
		'wp_cache_hello_world'          => 'cache_hello_world',
		'wp_cache_gzencode'             => 'cache_gzencode',
		'cache_schedule_interval'       => 'cache_schedule_interval',
		'cache_acceptable_files'        => 'cache_acceptable_files',
		'cache_rejected_uri'            => 'cache_rejected_uri',
		'cache_rejected_user_agent'     => 'cache_rejected_user_agent',
		'cached_direct_pages'           => 'cache_direct_pages',
		'ossdl_cname'                   => 'ossdl_cname',
		'ossdl_https'                   => 'ossdl_https',
		'ossdl_off_cdn_url'             => 'ossdl_off_cdn_url',
		'ossdl_off_exclude'             => 'ossdl_off_exclude',
		'ossdl_off_include_dirs'        => 'ossdl_off_include_dirs',
		'ossdlcdn'                      => 'ossdlcdn',
		'cache_gzencode'                => 'cache_gzencode',
		'cache_disable_locking'         => 'cache_disable_locking',
		'cache_readonly'                => 'cache_readonly',
		'cache_writable'                => 'cache_writable',
		'cache_mobile_browsers'         => 'cache_mobile_browsers',
		'cache_mobile_prefixes'         => 'cache_mobile_prefixes',
		'cache_mutex_disabled'          => 'cache_mutex_disabled',
		'cache_hello_world'             => 'cache_hello_world',
	);

	/**
	 * Get the settings.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {
		$settings = array();


		$settings['is_submit_enabled']        = $this->get_is_submit_enabled();
		$settings['is_preload_enabled']       = $this->get_is_preload_enabled();
		$settings['minimum_preload_interval'] = $this->get_minimum_preload_interval();
		$settings['cache_stats']              = get_option( 'supercache_stats' );
		$settings['is_preloading']            = wpsc_is_preloading();
		$settings['post_count']               = $this->get_post_count();

		if ( false == is_array( $settings['cache_stats'] ) ) {
			$settings['cache_stats'] = wp_cache_regenerate_cache_file_stats();
		}

		foreach ( self::$settings_map as $var => $name ) {
			if ( method_exists( $this, $name ) ) {
				$settings[ $name ] = $this->$var();

			} else {
				global ${$var};
				$settings[ $name ] = $$var;
			}
		}

		return $this->prepare_item_for_response( $settings, $request );
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

		foreach( $item as $key => $value ) {
			if ( is_array( $value ) && $key != 'cache_stats' ) {
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
