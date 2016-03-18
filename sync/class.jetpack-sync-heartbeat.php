<?php

class Jetpack_Sync_Heartbeat {

	static function init() {
		// add_action( 'jetpack_heartbeat',       array( __CLASS__, 'jetpack_sync_core_icon' ) );
	}

	/**
	 * Return stat data for WPCOM sync
	 */
	function get_stat_data() {
		$heartbeat_data = Jetpack_Heartbeat::generate_stats_array();
		$additional_data = $this->get_additional_stat_data();

		return json_encode( array_merge( $heartbeat_data, $additional_data ) );
	}

	/**
	 * Get additional stat data to sync to WPCOM
	 */
	function get_additional_stat_data( $prefix = '' ) {
		$return["{$prefix}themes"]         = Jetpack::get_parsed_theme_data();
		$return["{$prefix}plugins-extra"]  = Jetpack::get_parsed_plugin_data();
		$return["{$prefix}users"]          = count_users();
		$return["{$prefix}site-count"]     = 0;
		if ( function_exists( 'get_blog_count' ) ) {
			$return["{$prefix}site-count"] = get_blog_count();
		}
		return $return;
	}

}