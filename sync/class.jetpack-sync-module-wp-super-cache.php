<?php

class Jetpack_Sync_Module_WP_Super_Cache extends Jetpack_Sync_Module {

	public function name() {
		return 'wp-super-cache';
	}

	public function init_listeners( $callable ) {
		add_action( 'jetpack_sync_wp_super_cache', $callable, 10, 1 );
	}

	public function init_full_sync_listeners( $callable ) {
		add_action('jetpack_sync_wp_super_cache', $callable, 10, 1);
	}

	public function init_before_send() {
		add_action( 'jetpack_sync_before_send_queue_sync', array( $this, 'trigger_enqueue' ) );

		// full sync
		add_filter( 'jetpack_sync_before_send_jetpack_full_sync_constants', array( $this, 'trigger_enqueue' ) );
	}

	public function trigger_enqueue() {
		$values = array(); //array of values containing WP Super Cache variables and constants

/*
		$wp_cache_mod_rewrite, $cache_enabled, $super_cache_enabled, $ossdlcdn, $cache_rebuild_files, $wp_cache_mobile, $wp_super_cache_late_init, $wp_cache_anon_only, $wp_cache_not_logged_in, $wp_cache_clear_on_post_edit, $wp_cache_mobile_enabled, $wp_super_cache_debug, $cache_max_time, $wp_cache_refresh_single_only, $wp_cache_mfunc_enabled, $wp_supercache_304, $wp_cache_no_cache_for_get, $wp_cache_mutex_disabled, $cache_jetpack, $cache_domain_mapping

Constants:
WPLOCKDOWN, WPSC_DISABLE_COMPRESSION, WPSC_DISABLE_LOCKING, WPSC_DISABLE_HTACCESS_UPDATE, ADVANCEDCACHEPROBLEM
*/
		do_action('jetpack_sync_wp_super_cache', $values);
	}

}
