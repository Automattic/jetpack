<?php

class Jetpack_Sync_Module_WP_Super_Cache extends Jetpack_Sync_Module {

	static $wp_super_cache_constants = array(
		'WPLOCKDOWN',
		'WPSC_DISABLE_COMPRESSION',
		'WPSC_DISABLE_LOCKING',
		'WPSC_DISABLE_HTACCESS_UPDATE',
		'ADVANCEDCACHEPROBLEM',
	);

	public function name() {
		return 'wp-super-cache';
	}

	public function get_wp_super_cache_globals() {
		global $wp_cache_mod_rewrite;
		global $cache_enabled;
		global $super_cache_enabled;
		global $ossdlcdn;
		global $cache_rebuild_files;
		global $wp_cache_mobile;
		global $wp_super_cache_late_init;
		global $wp_cache_anon_only;
		global $wp_cache_not_logged_in;
		global $wp_cache_clear_on_post_edit;
		global $wp_cache_mobile_enabled;
		global $wp_super_cache_debug;
		global $cache_max_time;
		global $wp_cache_refresh_single_only;
		global $wp_cache_mfunc_enabled;
		global $wp_supercache_304;
		global $wp_cache_no_cache_for_get;
		global $wp_cache_mutex_disabled;
		global $cache_jetpack;
		global $cache_domain_mapping;

		return array (
			'wp_cache_mod_rewrite' => $wp_cache_mod_rewrite,
			'cache_enabled' => $cache_enabled,
			'super_cache_enabled' => $super_cache_enabled,
			'ossdlcdn' => $ossdlcdn,
			'cache_rebuild_files' => $cache_rebuild_files,
			'wp_cache_mobile' => $wp_cache_mobile,
			'wp_super_cache_late_init' => $wp_super_cache_late_init,
			'wp_cache_anon_only' => $wp_cache_anon_only,
			'wp_cache_not_logged_in' => $wp_cache_not_logged_in,
			'wp_cache_clear_on_post_edit' => $wp_cache_clear_on_post_edit,
			'wp_cache_mobile_enabled' => $wp_cache_mobile_enabled,
			'wp_super_cache_debug' => $wp_super_cache_debug,
			'cache_max_time' => $cache_max_time,
			'wp_cache_refresh_single_only' => $wp_cache_refresh_single_only,
			'wp_cache_mfunc_enabled' => $wp_cache_mfunc_enabled,
			'wp_supercache_304' => $wp_supercache_304,
			'wp_cache_no_cache_for_get' => $wp_cache_no_cache_for_get,
			'wp_cache_mutex_disabled' => $wp_cache_mutex_disabled,
			'cache_jetpack' => $cache_jetpack,
			'cache_domain_mapping' => $cache_domain_mapping,
		);
	}

	/**
	 * Using set_late_default to ensure constants module is already initialized, then add WP Super Cache constants to it for syncing via existing mechanism
	 */
	public function set_late_default() {
		$constants_module = Jetpack_Sync_Modules::get_module( 'constants' );
		$constants = array_merge( $constants_module->get_constants_whitelist(), self::$wp_super_cache_constants);
		$constants_module->set_constants_whitelist( $constants );

		$callables_module = Jetpack_Sync_Modules::get_module( 'functions' );
		$callables = array_merge( $callables_module->get_callable_whitelist(),
			array(
				'wp_super_cache_globals' => array( 'Jetpack_Sync_Module_WP_Super_Cache', 'get_wp_super_cache_globals' ),
			)
		);
		$callables_module->set_callable_whitelist( $callables );
	}
}
