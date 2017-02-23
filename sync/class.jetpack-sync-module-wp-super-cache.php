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

	/**
	 * Using set_late_default to ensure constants module is already initialized, then add WP Super Cache constants to it for syncing via existing mechanism
	 */
	public function set_late_default() {
		$constants_module = Jetpack_Sync_Modules::get_module( 'constants' );
		$constants_module->add_constants( self::$wp_super_cache_constants);
	}
}
