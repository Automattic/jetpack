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
		'cache_lock_down' => array(
			'get' => 'get_is_lock_down_enabled',
			'set' => 'set_lock_down',
		),
		'cache_next_gc' => array(
			'get' => 'get_next_gc',
			'set' => '',
		),
		'cache_gc_email_me' => array(
			'global' => 'cache_gc_email_me',
			'set' => 'set_time_setting',
		),
		'cache_path_url' => array(
			'get' => 'get_cache_path_url',
		),
		'cache_type' => array(
			'get' => 'get_cache_type',
			'set' => 'set_super_cache_enabled',
		),
		'is_preloading' => array(
			'get' => 'wpsc_is_preloading',
			'set' => '',
		),
		'post_count' => array(
			'get' => 'get_post_count',
			'set' => '',
		),
		'is_cache_enabled' => array(
			'global' => 'cache_enabled',
			'set'    => 'set_cache_enabled',
		),
		'is_super_cache_enabled' => array(
			'global' => 'super_cache_enabled',
			'set'    => 'set_super_cache_enabled',
		),
		'is_mobile_enabled' => array(
			'global' => 'wp_cache_mobile_enabled',
		),
		'is_mfunc_enabled' => array(
			'global' => 'wp_cache_mfunc_enabled',
		),
		'cache_list' => array(
			'global' => 'wp_supercache_cache_list',
		),
		'clear_cache_on_post_edit' => array(
			'global' => 'wp_cache_clear_on_post_edit',
		),
		'wpsc_save_headers' => array(
			'global' => 'wpsc_save_headers',
		),
		'cache_rebuild' => array(
			'global' => 'cache_rebuild_files',
		),
		'dont_cache_logged_in' => array(
			'global' => 'wp_cache_not_logged_in',
		),
		'make_known_anon' => array(
			'global' => 'wp_cache_make_known_anon',
		),
		'cache_path' => array(
			'global' => 'cache_path',
			'set'    => 'set_wp_cache_location',
		),
		'default_cache_path' => array(
			'get' => 'get_default_cache_path',
		),
		'use_object_cache' => array(
			'global' => 'wp_cache_object_cache',
		),
		'refresh_current_only_on_comments' => array(
			'global' => 'wp_cache_refresh_single_only',
		),
		'cache_compression' => array(
			'global' => 'cache_compression',
			'set'    => 'set_cache_compression',
		),
		'cache_mod_rewrite' => array(
			'global' => 'wp_cache_mod_rewrite',
		),
		'use_304_headers' => array(
			'global' => 'wp_supercache_304',
		),
		'cache_late_init' => array(
			'global' => 'wp_super_cache_late_init',
		),
		'front_page_checks' => array(
			'global' => 'wp_cache_front_page_checks',
		),
		'cache_page_secret' => array(
			'global' => 'cache_page_secret',
		),
		'disable_utf8' => array(
			'global' => 'wp_cache_disable_utf8',
		),
		'no_cache_for_get' => array(
			'global' => 'wp_cache_no_cache_for_get',
		),
		'cache_schedule_type' => array(
			'global' => 'cache_schedule_type',
			'set' => 'set_time_setting',
		),
		'cache_scheduled_time' => array(
			'global' => 'cache_scheduled_time',
			'set' => 'set_time_setting',
		),
		'cache_max_time' => array(
			'global' => 'cache_max_time',
			'set' => 'set_time_setting',
		),
		'cache_time_interval' => array(
			'global' => 'cache_time_interval',
			'set' => 'set_time_setting',
		),
		'shutdown_garbage_collector' => array(
			'global' => 'wp_cache_shutdown_gc',
		),
		'pages' => array(
			'global' => 'wp_cache_pages',
		),
		'minimum_preload_interval' => array(
			'get' => 'get_minimum_preload_interval',
		),
		'preload_interval' => array(
			'global' => 'wp_cache_preload_interval',
			'set' => 'set_preload_setting',
		),
		'preload_posts' => array(
			'global' => 'wp_cache_preload_posts',
			'set' => 'set_preload_setting',
		),
		'preload_on' => array(
			'global' => 'wp_cache_preload_on',
			'set' => 'set_preload_setting',
		),
		'preload_active' => array(
			'get' => 'get_is_preload_active',
		),
		'preload_taxonomies' => array(
			'global' => 'wp_cache_preload_taxonomies',
			'set' => 'set_preload_setting',
		),
		'preload_email_me' => array(
			'global' => 'wp_cache_preload_email_me',
			'set' => 'set_preload_setting',
		),
		'preload_email_volume' => array(
			'global' => 'wp_cache_preload_email_volume',
			'set' => 'set_preload_setting',
		),
		'cache_mobile_browsers' => array(
			'global' => 'wp_cache_mobile_browsers',
		),
		'cache_mobile_prefixes' => array(
			'global' => 'wp_cache_mobile_prefixes',
		),
		'cache_disable_locking' => array(
			'global' => 'wp_cache_mutex_disabled',
		),
		'cache_hello_world' => array(
			'global' => 'wp_cache_hello_world',
		),
		'cache_schedule_interval' => array(
			'global' => 'cache_schedule_interval',
			'set' => 'set_time_setting',
		),
		'cache_acceptable_files' => array(
			'global' => 'cache_acceptable_files',
		),
		'cache_rejected_uri' => array(
			'global' => 'cache_rejected_uri',
		),
		'cache_rejected_user_agent' => array(
			'global' => 'cache_rejected_user_agent',
		),
		'cache_direct_pages' => array(
			'global' => 'cached_direct_pages',
			'set'    => 'set_cache_direct_pages',
		),
		'new_direct_page' => array(
			'set' => 'new_direct_page',
		),
		'ossdl_cname' => array(
			'option' => 'ossdl_cname',
			'set'    => 'set_ossdl_cname',
		),
		'ossdl_https' => array(
			'option' => 'ossdl_https',
			'set'    => 'set_ossdl_https',
		),
		'ossdl_off_cdn_url' => array(
			'option' => 'ossdl_off_cdn_url',
			'set'    => 'set_ossdl_off_cdn_url',
		),
		'ossdl_off_blog_url' => array(
			'option' => 'ossdl_off_blog_url',
			'set'    => 'set_ossdl_off_blog_url',
		),
		'ossdl_off_exclude' => array(
			'option' => 'ossdl_off_exclude',
			'set'    => 'set_ossdl_off_exclude',
		),
		'ossdl_off_include_dirs' => array(
			'option' => 'ossdl_off_include_dirs',
			'set'    => 'set_ossdl_off_include_dirs',
		),
		'ossdlcdn' => array(
			'global' => 'ossdlcdn',
			'set'    => 'set_ossdlcdn',
		),
		'wp_super_cache_debug' => array(
			'global' => 'wp_super_cache_debug',
		),
		'wp_cache_debug_username' => array(
			'global' => 'wp_cache_debug_username',
		),
		'wp_cache_debug_log' => array(
			'global'    => 'wp_cache_debug_log',
		),
		'wp_cache_debug_ip' => array(
			'global' => 'wp_cache_debug_ip',
		),
		'wp_super_cache_comments' => array(
			'global' => 'wp_super_cache_comments',
		),
		'wp_super_cache_front_page_check' => array(
			'global' => 'wp_super_cache_front_page_check',
		),
		'wp_super_cache_front_page_clear' => array(
			'global' => 'wp_super_cache_front_page_clear',
		),
		'wp_super_cache_front_page_text' => array(
			'global' => 'wp_super_cache_front_page_text',
		),
		'wp_super_cache_front_page_notification' => array(
			'global' => 'wp_super_cache_front_page_notification',
		),
	);
}
