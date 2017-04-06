<?php

class WP_Super_Cache_Rest_Get_Settings extends WP_REST_Controller {

	/**
	 * Get the settings.
	 *
	 * @param WP_REST_Request $request Full data about the request.
	 * @return WP_Error|WP_REST_Response
	 */
	public function callback( $request ) {
		$settings_names = array(
			'cache_enabled',
			'super_cache_enabled',
			'wp_cache_mobile_enabled',
			'wp_cache_mfunc_enabled',
			'wp_supercache_cache_list',
			'wp_cache_config_file',
			'wp_cache_hello_world',
			'wp_cache_clear_on_post_edit',
			'cache_rebuild_files',
			'wp_cache_mutex_disabled',
			'wp_cache_not_logged_in',
			'wp_cache_make_known_anon',
			'cache_path',
			'wp_cache_object_cache',
			'_wp_using_ext_object_cache',
			'wp_cache_refresh_single_only',
			'cache_compression',
			'wp_cache_mod_rewrite',
			'wp_supercache_304',
			'wp_super_cache_late_init',
			'wp_cache_front_page_checks',
			'cache_page_secret',
			'wp_cache_disable_utf8',
			'wp_cache_no_cache_for_get',
			'cache_schedule_type',
			'cache_scheduled_time',
			'cache_max_time',
			'cache_time_interval',
			'wp_cache_shutdown_gc',
			'wp_cache_pages',
			'wp_cache_preload_interval',
			'wp_cache_preload_posts',
			'wp_cache_preload_on',
			'wp_cache_preload_taxonomies',
			'wp_cache_preload_email_me',
			'wp_cache_preload_email_volume',
		);

		$settings = array();
		foreach( $settings_names as $name ) {
			global ${$name};
			$value = $$name;
			$settings[ $name ] = $value;
		}

		$settings['submit_enabled'] = $this->is_submit_enabled();
		$settings['preload_enabled'] = $this->is_preload_enabled();

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
			if ( is_array( $value ) ) {
				array_walk( $value, array( $this, 'make_array_bool' ) );

			} elseif ( $value == 0 || $value == 1 ) {
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
	protected function is_submit_enabled() {
		global $wp_cache_config_file;
		return ! is_writeable_ACLSafe( $wp_cache_config_file );
	}

	/**
	 * @return bool
	 */
	protected function is_preload_enabled() {
		return false === defined( 'DISABLESUPERCACHEPRELOADING' );
	}
}