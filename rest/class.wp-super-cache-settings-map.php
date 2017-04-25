<?php

class WP_Super_Cache_Settings_Map {
	/**
	 * A map describing how settings transform from their external names
	 * into internal methods and globals.
	 *
	 * Key definitions:
	 *
	 * - get: A getter method or function that will be called to return the var
	 * - set: A setter method or function that will be called to set the var
	 * - option: An option name that will be used to get or set the var
	 * - global: A name of a global that can GET
	 *
	 * @var array
	 */
	public static $map = array(
		'is_submit_enabled' => array(
			'get' => 'get_is_submit_enabled',
			'set' => '',
		),
		'is_preload_enabled' => array(
			'get' => 'get_is_preload_enabled',
			'set' => '',
		),
		'is_lock_down_enabled' => array(
			'get' => 'get_lock_down',
			'set' => '',
		),
		'cache_next_gc' => array(
			'get' => 'get_next_gc',
			'set' => '',
		),
		'is_cache_enabled' => array(
			'global' => 'cache_enabled',
			'set' => '',
		),
		'is_super_cache_enabled' => array(
			'global' => 'super_cache_enabled',
			'set' => '',
		),
		'is_mobile_enabled' => array(
			'global' => 'wp_cache_mobile_enabled',
			'set' => '',
		),
		'is_mfunc_enabled' => array(
			'global' => 'wp_cache_mfunc_enabled',
			'set' => '',
		),
		'cache_list' => array(
			'global' => 'wp_cache_config_file',
			'set' => '',
		),
		'clear_cache_on_post_edit' => array(
			'global' => 'wp_cache_clear_on_post_edit',
			'set' => '',
		),
		'cache_rebuild' => array(
			'global' => 'cache_rebuild_files',
			'set' => '',
		),
		'dont_cache_logged_in' => array(
			'global' => 'wp_cache_not_logged_in',
			'set' => '',
		),
		'make_known_anon' => array(
			'global' => 'wp_cache_make_known_anon',
			'set' => '',
		),
		'cache_path' => array(
			'global' => 'cache_path',
			'set' => '',
		),
		'use_object_cache' => array(
			'global' => 'wp_cache_object_cache',
			'set' => '',
		),
		'refresh_current_only_on_comments' => array(
			'global' => 'wp_cache_refresh_single_only',
			'set' => '',
		),
		'cache_compression' => array(
			'global' => 'cache_compression',
			'set' => '',
		),
		'cache_mod_rewrite' => array(
			'global' => 'wp_cache_mod_rewrite',
			'set' => '',
		),
		'304_headers_enabled' => array(
			'global' => 'wp_supercache_304',
			'set' => '',
		),
		'cache_late_init' => array(
			'global' => 'wp_super_cache_late_init',
			'set' => '',
		),
		'front_page_checks' => array(
			'global' => 'wp_cache_front_page_checks',
			'set' => '',
		),
		'cache_page_secret' => array(
			'global' => 'cache_page_secret',
			'set' => '',
		),
		'disable_utf8' => array(
			'global' => 'wp_cache_disable_utf8',
			'set' => '',
		),
		'no_cache_for_get' => array(
			'global' => 'wp_cache_no_cache_for_get',
			'set' => '',
		),
		'cache_schedule_type' => array(
			'global' => 'cache_schedule_type',
			'set' => '',
		),
		'cache_scheduled_time' => array(
			'global' => 'cache_scheduled_time',
			'set' => '',
		),
		'cache_max_time' => array(
			'global' => 'cache_max_time',
			'set' => '',
		),
		'cache_time_interval' => array(
			'global' => 'cache_time_interval',
			'set' => '',
		),
		'shutdown_garbage_collector' => array(
			'global' => 'wp_cache_shutdown_gc',
			'set' => '',
		),
		'pages' => array(
			'global' => 'wp_cache_pages',
			'set' => '',
		),
		'preload_interval' => array(
			'global' => 'wp_cache_preload_interval',
			'set' => '',
		),
		'preload_posts' => array(
			'global' => 'wp_cache_preload_posts',
			'set' => '',
		),
		'preload_on' => array(
			'global' => 'wp_cache_preload_on',
			'set' => '',
		),
		'preload_taxonomies' => array(
			'global' => 'wp_cache_preload_taxonomies',
			'set' => '',
		),
		'preload_email_me' => array(
			'global' => 'wp_cache_preload_email_me',
			'set' => '',
		),
		'preload_email_volume' => array(
			'global' => 'wp_cache_preload_email_volume',
			'set' => '',
		),
		'cache_mobile_browsers' => array(
			'global' => 'wp_cache_mobile_browsers',
			'set' => '',
		),
		'cache_mobile_prefixes' => array(
			'global' => 'wp_cache_mobile_prefixes',
			'set' => '',
		),
		'cache_disable_locking' => array(
			'global' => 'wp_cache_mutex_disabled',
			'set' => '',
		),
		'cache_hello_world' => array(
			'global' => 'wp_cache_hello_world',
			'set' => '',
		),
		'cache_gzencode' => array(
			'global' => 'wp_cache_gzencode',
			'set' => '',
		),
		'cache_schedule_interval' => array(
			'global' => 'cache_schedule_interval',
			'set' => '',
		),
		'cache_acceptable_files' => array(
			'global' => 'cache_acceptable_files',
			'set' => '',
		),
		'cache_rejected_uri' => array(
			'global' => 'cache_rejected_uri',
			'set' => '',
		),
		'cache_rejected_user_agent' => array(
			'global' => 'cache_rejected_user_agent',
			'set' => '',
		),
		'cache_direct_pages' => array(
			'global' => 'cached_direct_pages',
			'set' => '',
		),
		'cache_stats' => array(
			'get' => 'get_cache_states',
		),
		'is_preloading' => array(
			'get' => 'wpsc_is_preloading',
		),
		'post_count' => array(
			'get' => 'get_post_count',
		),
		'ossdl_cname' => array(
			'option' => 'ossdl_cname',
		),
		'ossdl_https' => array(
			'option' => 'ossdl_https',
		),
		'ossdl_off_cdn_url' => array(
			'option' => 'ossdl_off_cdn_url',
		),
		'ossdl_off_exclude' => array(
			'option' => 'ossdl_off_exclude',
		),
		'ossdl_off_include_dirs' => array(
			'option' => 'ossdl_off_include_dirs',
		),
		'ossdlcdn' => array(
			'option' => 'ossdlcdn',
		),
	);
}