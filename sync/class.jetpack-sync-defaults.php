<?php
require_once( JETPACK__PLUGIN_DIR . 'modules/sso/class.jetpack-sso-helpers.php' );

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
		'jetpack_site_icon_url',
		'page_on_front',
		'rss_use_excerpt',
		'subscription_options',
		'stb_enabled',
		'stc_enabled',
		'comment_registration',
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
		'wga',
		'disabled_likes',
		'disabled_reblogs',
		'jetpack_comment_likes_enabled',
		'twitter_via',
		'jetpack-twitter-cards-site-tag',
		'wpcom_publish_posts_with_markdown',
		'wpcom_publish_comments_with_markdown',
		'jetpack_activated',
		'jetpack_available_modules',
		'jetpack_autoupdate_plugins',
		'jetpack_autoupdate_themes',
		'jetpack_autoupdate_core',
		'carousel_background_color',
		'carousel_display_exif',
		'jetpack_portfolio',
		'jetpack_portfolio_posts_per_page',
		'jetpack_testimonial',
		'jetpack_testimonial_posts_per_page',
		'tiled_galleries',
		'gravatar_disable_hovercards',
		'infinite_scroll',
		'infinite_scroll_google_analytics',
		'wp_mobile_excerpt',
		'wp_mobile_featured_images',
		'wp_mobile_app_promos',
		'monitor_receive_notifications',
		'post_by_email_address',
		'jetpack_protect_key',
		'jetpack_protect_global_whitelist',
		'sharing_services',
		'jetpack_sso_require_two_step',
		'jetpack_relatedposts',
		'verification_services_codes',
		'users_can_register',
		'active_plugins',
		'uninstall_plugins',
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
		'JETPACK__VERSION',
		'IS_PRESSABLE',
	);

	static $default_callable_whitelist = array(
		'wp_max_upload_size'               => 'wp_max_upload_size',
		'is_main_network'                  => array( 'Jetpack', 'is_multi_network' ),
		'is_multi_site'                    => 'is_multisite',
		'main_network_site'                => array( 'Jetpack_Sync_Functions', 'main_network_site_url' ),
		'site_url'                         => array( 'Jetpack_Sync_Functions', 'site_url' ),
		'home_url'                         => array( 'Jetpack_Sync_Functions', 'home_url' ),
		'single_user_site'                 => array( 'Jetpack', 'is_single_user_site' ),
		'updates'                          => array( 'Jetpack', 'get_updates' ),
		'has_file_system_write_access'     => array( 'Jetpack_Sync_Functions', 'file_system_write_access' ),
		'is_version_controlled'            => array( 'Jetpack_Sync_Functions', 'is_version_controlled' ),
		'taxonomies'                       => array( 'Jetpack_Sync_Functions', 'get_taxonomies' ),
		'post_types'                       => array( 'Jetpack_Sync_Functions', 'get_post_types' ),
		'post_type_features'               => array( 'Jetpack_Sync_Functions', 'get_post_type_features' ),
		'rest_api_allowed_post_types'      => array( 'Jetpack_Sync_Functions', 'rest_api_allowed_post_types' ),
		'rest_api_allowed_public_metadata' => array( 'Jetpack_Sync_Functions', 'rest_api_allowed_public_metadata' ),
		'sso_is_two_step_required'         => array( 'Jetpack_SSO_Helpers', 'is_two_step_required' ),
		'sso_should_hide_login_form'       => array( 'Jetpack_SSO_Helpers', 'should_hide_login_form' ),
		'sso_match_by_email'               => array( 'Jetpack_SSO_Helpers', 'match_by_email' ),
		'sso_new_user_override'            => array( 'Jetpack_SSO_Helpers', 'new_user_override' ),
		'sso_bypass_default_login_form'    => array( 'Jetpack_SSO_Helpers', 'bypass_login_forward_wpcom' ),
		'wp_version'                       => array( 'Jetpack_Sync_Functions', 'wp_version' ),
		'get_plugins'                      => array( 'Jetpack_Sync_Functions', 'get_plugins' ),
		'active_modules'                   => array( 'Jetpack', 'get_active_modules' ),
		'hosting_provider'                 => array( 'Jetpack_Sync_Functions', 'get_hosting_provider' ),
		'locale'                           => 'get_locale',
	);

	static $blacklisted_post_types = array(
		'ai1ec_event',
		'snitch',
	);

	static $default_post_checksum_columns = array(
		'ID',
		'post_modified',
	); 

	static $default_comment_checksum_columns = array(
		'comment_ID',
		'comment_content',
	); 

	static $default_option_checksum_columns = array(
		'option_name',
		'option_value',
	);

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
		'_wpas_mess',
		'_wpas_skip_',
		'_g_feedback_shortcode',
		'_feedback_extra_fields',
		'_feedback_akismet_values',
		'_publicize_facebook_user',
		'_wp_attachment_image_alt',
		'_jetpack_post_thumbnail',
		'_thumbnail_id',
		'_wp_attachment_metadata',
		'_wp_page_template',
		'_publicize_twitter_user',
		'_wp_trash_meta_comments_status',
		'_wp_attached_file',
	);

	static $default_blacklist_meta_keys = array(
		'post_views_count',
		'Views',
		'tve_leads_impressions',
		'views',
		'scc_share_count_crawldate',
		'wprss_last_update',
		'wprss_feed_is_updating',
		'snapFB',
		'syndication_item_hash',
		'phonenumber_spellings',
		'tmac_last_id',
		'opanda_imperessions',
		'administer_stats',
		'spec_ads_views',
		'snp_views',
		'mip_post_views_count',
		'esml_socialcount_LAST_UPDATED',
		'wprss_last_update_items',
		'wp_automatic_cache',
		'snapTW',
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

	static function is_whitelisted_option( $option ) {
		foreach ( self::$default_options_whitelist as $whitelisted_option ) {
			if ( $whitelisted_option[0] === '/' && preg_match( $whitelisted_option, $option ) ) {
				return true;
			} elseif ( $whitelisted_option === $option ) {
				return true;
			}
		}

		return false;
	}

	static $default_network_options_whitelist = array(
		'site_name',
		'jetpack_protect_key',
		'jetpack_protect_global_whitelist',
		'active_sitewide_plugins',
	);
	static $default_taxonomy_whitelist = array();
	static $default_dequeue_max_bytes = 500000; // very conservative value, 1/2 MB
	static $default_upload_max_bytes = 600000; // a little bigger than the upload limit to account for serialization
	static $default_upload_max_rows = 500;
	static $default_sync_wait_time = 10; // seconds, between syncs
	static $default_sync_wait_threshold = 5; // only wait before next send if the current send took more than X seconds
	static $default_max_queue_size = 1000;
	static $default_max_queue_lag = 900; // 15 minutes
	static $default_queue_max_writes_sec = 100; // 100 rows a second
	static $default_post_types_blacklist = array();
	static $default_meta_blacklist = array();
	static $default_disable = 0; // completely disable sending data to wpcom
	static $default_sync_callables_wait_time = MINUTE_IN_SECONDS; // seconds before sending callables again
	static $default_sync_constants_wait_time = HOUR_IN_SECONDS; // seconds before sending constants again
}
