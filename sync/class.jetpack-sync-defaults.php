<?php

/**
 * Just some defaults that we share with the server
 */

class Jetpack_Sync_Defaults {
	static $default_options_whitelist = array(
		'stylesheet',
		'blogname',
		'home',
		'siteurl',
		'blogdescription',
		'blog_charset',
		'permalink_structure',
		'category_base',
		'tag_base',
		'comment_moderation',
		'default_comment_status',
		'thread_comments',
		'thread_comments_depth',
		'jetpack_site_icon_url',
		'social_notifications_like',
		'page_on_front',
		'rss_use_excerpt',
		'subscription_options',
		'stb_enabled',
		'stc_enabled',
		'comment_registration',
		'require_name_email',
		'show_avatars',
		'avatar_default',
		'avatar_rating',
		'highlander_comment_form_prompt',
		'jetpack_comment_form_color_scheme',
		'stats_options',
		'gmt_offset',
		'timezone_string',
		'jetpack_sync_non_public_post_stati',
		'jetpack_options',
		'site_icon', // (int) - ID of core's Site Icon attachment ID
		'default_post_format',
		'default_category',
		'large_size_w',
		'large_size_h',
		'thumbnail_size_w',
		'thumbnail_size_h',
		'medium_size_w',
		'medium_size_h',
		'thumbnail_crop',
		'image_default_link_type',
		'site_logo',
		'sharing-options',
		'sharing-services',
		'post_count',
		'default_ping_status',
		'sticky_posts',
		'disabled_likes',
		'blog_public',
		'default_pingback_flag',
		'require_name_email',
		'close_comments_for_old_posts',
		'close_comments_days_old',
		'thread_comments',
		'thread_comments_depth',
		'page_comments',
		'comments_per_page',
		'default_comments_page',
		'comment_order',
		'comments_notify',
		'moderation_notify',
		'social_notifications_like',
		'social_notifications_reblog',
		'social_notifications_subscribe',
		'comment_whitelist',
		'comment_max_links',
		'moderation_keys',
		'blacklist_keys',
		'lang_id',
		'wga',
		'disabled_likes',
		'disabled_reblogs',
		'jetpack_comment_likes_enabled',
		'twitter_via',
		'twitter-cards-site-tag'
	);

	static $default_constants_whitelist = array(
		'EMPTY_TRASH_DAYS',
		'WP_POST_REVISIONS',
		'AUTOMATIC_UPDATER_DISABLED',
		'ABSPATH',
		'WP_CONTENT_DIR',
		'FS_METHOD',
		'DISALLOW_FILE_EDIT',
		'DISALLOW_FILE_MODS',
		'WP_AUTO_UPDATE_CORE',
		'WP_HTTP_BLOCK_EXTERNAL',
		'WP_ACCESSIBLE_HOSTS',
		'JETPACK__VERSION'
	);

	static $default_callable_whitelist = array(
		'wp_max_upload_size'           => 'wp_max_upload_size',
		'is_main_network'              => array( 'Jetpack', 'is_multi_network' ),
		'is_multi_site'                => 'is_multisite',
		'main_network_site'            => 'network_site_url',
		'single_user_site'             => array( 'Jetpack', 'is_single_user_site' ),
		'has_file_system_write_access' => array( 'Jetpack_Sync_Functions', 'file_system_write_access' ),
		'is_version_controlled'        => array( 'Jetpack_Sync_Functions', 'is_version_controlled' ),
		'modules'                      => array( 'Jetpack_Sync_Functions', 'get_modules' ),
		'taxonomies'                   => array( 'Jetpack_Sync_Functions', 'get_taxonomies' ),
		'post_types'                   => array( 'Jetpack_Sync_Functions', 'get_post_types' ),
	);

	static $blacklisted_post_types = array(
		'revision', // "don't ever sync revisions, they overwrite post meta for the parent post."
		'ai1ec_event' // https://irc.automattic.com/chanlog.php?channel=jetpack&day=2014-05-29&sort=asc#m71850
	);

	// returns escapted SQL that can be injected into a WHERE clause
	static function get_blacklisted_post_types_sql() {
		return 'post_type NOT IN (\'' . join( '\', \'', array_map( 'esc_sql', self::$blacklisted_post_types ) ) .'\')';
	}

	static $default_multisite_callable_whitelist = array(
		'network_name'                        => array( 'Jetpack', 'network_name' ),
		'network_allow_new_registrations'     => array( 'Jetpack', 'network_allow_new_registrations' ),
		'network_add_new_users'               => array( 'Jetpack', 'network_add_new_users' ),
		'network_site_upload_space'           => array( 'Jetpack', 'network_site_upload_space' ),
		'network_upload_file_types'           => array( 'Jetpack', 'network_upload_file_types' ),
		'network_enable_administration_menus' => array( 'Jetpack', 'network_enable_administration_menus' ),
	);

	static $default_whitelist_meta_keys = array(
		'_wp_attachment_metadata',
		'_thumbnail_id',
	);

	// TODO: move this to server? - these are theme support values
	// that should be synced as jetpack_current_theme_supports_foo option values
	static $default_theme_support_whitelist = array(
		'post-thumbnails',
		'post-formats',
		'custom-header',
		'custom-background',
		'custom-logo',
		'menus',
		'automatic-feed-links',
		'editor-style',
		'widgets',
		'html5',
		'title-tag',
		'jetpack-social-menu',
		'jetpack-responsive-videos',
		'infinite-scroll',
		'site-logo',
	);

	static $default_network_options_whitelist = array( 'site_name' );
	static $default_taxonomy_whitelist = array();	
	static $default_send_buffer_memory_size = 500000; // very conservative value, 1/2 MB
}

