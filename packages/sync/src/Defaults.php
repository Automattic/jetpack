<?php
/**
 * Jetpack Sync Defaults
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

require_once JETPACK__PLUGIN_DIR . 'modules/sso/class.jetpack-sso-helpers.php';

use Automattic\Jetpack\Status;
use Automattic\Jetpack\Sync\Functions;

/**
 * Just some defaults that we share with the server.
 */
class Defaults {

	/**
	 * Default Options.
	 *
	 * @var array
	 */
	public static $default_options_whitelist = array(
		'stylesheet',
		'blogname',
		'blogdescription',
		'blog_charset',
		'permalink_structure',
		'category_base',
		'tag_base',
		'sidebars_widgets',
		'comment_moderation',
		'default_comment_status',
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
		'jetpack_wga',
		'disabled_likes',
		'disabled_reblogs',
		'jetpack_comment_likes_enabled',
		'twitter_via',
		'jetpack-memberships-connected-account-id',
		'jetpack-twitter-cards-site-tag',
		'wpcom_publish_posts_with_markdown',
		'wpcom_publish_comments_with_markdown',
		'jetpack_activated',
		'jetpack_available_modules',
		'jetpack_allowed_xsite_search_ids',
		'jetpack_autoupdate_plugins',
		'jetpack_autoupdate_plugins_translations',
		'jetpack_autoupdate_themes',
		'jetpack_autoupdate_themes_translations',
		'jetpack_autoupdate_core',
		'jetpack_autoupdate_translations',
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
		'jetpack_mailchimp',
		'jetpack_protect_key',
		'jetpack_protect_global_whitelist',
		'jetpack_sso_require_two_step',
		'jetpack_sso_match_by_email',
		'jetpack_relatedposts',
		'verification_services_codes',
		'users_can_register',
		'active_plugins',
		'uninstall_plugins',
		'advanced_seo_front_page_description', // Jetpack_SEO_Utils::FRONT_PAGE_META_OPTION.
		'advanced_seo_title_formats', // Jetpack_SEO_Titles::TITLE_FORMATS_OPTION.
		'jetpack_api_cache_enabled',
		'start_of_week',
		'blacklist_keys',
		'posts_per_page',
		'posts_per_rss',
		'show_on_front',
		'ping_sites',
		'uploads_use_yearmonth_folders',
		'date_format',
		'time_format',
		'admin_email',
		'new_admin_email',
		'default_email_category',
		'default_role',
		'page_for_posts',
		'mailserver_url',
		'mailserver_login', // Not syncing contents, only the option name.
		'mailserver_pass', // Not syncing contents, only the option name.
		'mailserver_port',
		'wp_page_for_privacy_policy',
		'enable_header_ad',
		'wordads_second_belowpost',
		'wordads_display_front_page',
		'wordads_display_post',
		'wordads_display_page',
		'wordads_display_archive',
		'wordads_custom_adstxt',
		'site_segment',
		'site_user_type',
		'site_vertical',
		'jetpack_excluded_extensions',
	);

	/**
	 * Return options whitelist filtered.
	 *
	 * @return array Options whitelist.
	 */
	public static function get_options_whitelist() {
		/** This filter is already documented in json-endpoints/jetpack/class.wpcom-json-api-get-option-endpoint.php */
		$options_whitelist = apply_filters( 'jetpack_options_whitelist', self::$default_options_whitelist );
		/**
		 * Filter the list of WordPress options that are manageable via the JSON API.
		 *
		 * @module sync
		 *
		 * @since 4.8.0
		 *
		 * @param array The default list of options.
		 */
		return apply_filters( 'jetpack_sync_options_whitelist', $options_whitelist );
	}

	/**
	 * "Contentless" Options.
	 *
	 * Do not sync contents for these events, only the option name. Good for sensitive information that Sync does not need.
	 *
	 * @var array Options to sync name only.
	 */
	public static $default_options_contentless = array(
		'mailserver_login',
		'mailserver_pass',
	);

	/**
	 * Return contentless options.
	 *
	 * These are options that Sync only uses the option names, not the content of the option.
	 *
	 * @return array
	 */
	public static function get_options_contentless() {
		/**
		 * Filter the list of WordPress options that should be synced without content
		 *
		 * @module sync
		 *
		 * @since 6.1.0
		 *
		 * @param array The list of options synced without content.
		 */
		return apply_filters( 'jetpack_sync_options_contentless', self::$default_options_contentless );
	}

	/**
	 * Array of defaulted constants whitelisted.
	 *
	 * @var array Default constants whitelist
	 */
	public static $default_constants_whitelist = array(
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
		'DISABLE_WP_CRON',
		'ALTERNATE_WP_CRON',
		'WP_CRON_LOCK_TIMEOUT',
		'PHP_VERSION',
		'WP_MEMORY_LIMIT',
		'WP_MAX_MEMORY_LIMIT',
		'WP_DEBUG',
	);

	/**
	 * Get constants whitelisted by Sync.
	 *
	 * @return array Constants accessible via sync.
	 */
	public static function get_constants_whitelist() {
		/**
		 * Filter the list of PHP constants that are manageable via the JSON API.
		 *
		 * @module sync
		 *
		 * @since 4.8.0
		 *
		 * @param array The default list of constants options.
		 */
		return apply_filters( 'jetpack_sync_constants_whitelist', self::$default_constants_whitelist );
	}

	/**
	 * Callables able to be managed via JSON API.
	 *
	 * @var array Default whitelist of callables.
	 */
	public static $default_callable_whitelist = array(
		'wp_max_upload_size'               => 'wp_max_upload_size',
		'is_main_network'                  => array( __CLASS__, 'is_multi_network' ),
		'is_multi_site'                    => 'is_multisite',
		'main_network_site'                => array( 'Automattic\\Jetpack\\Sync\\Functions', 'main_network_site_url' ),
		'site_url'                         => array( 'Automattic\\Jetpack\\Sync\\Functions', 'site_url' ),
		'home_url'                         => array( 'Automattic\\Jetpack\\Sync\\Functions', 'home_url' ),
		'single_user_site'                 => array( 'Jetpack', 'is_single_user_site' ),
		'updates'                          => array( 'Jetpack', 'get_updates' ),
		'has_file_system_write_access'     => array( 'Automattic\\Jetpack\\Sync\\Functions', 'file_system_write_access' ),
		'is_version_controlled'            => array( 'Automattic\\Jetpack\\Sync\\Functions', 'is_version_controlled' ),
		'taxonomies'                       => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_taxonomies' ),
		'post_types'                       => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_post_types' ),
		'post_type_features'               => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_post_type_features' ),
		'shortcodes'                       => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_shortcodes' ),
		'rest_api_allowed_post_types'      => array( 'Automattic\\Jetpack\\Sync\\Functions', 'rest_api_allowed_post_types' ),
		'rest_api_allowed_public_metadata' => array( 'Automattic\\Jetpack\\Sync\\Functions', 'rest_api_allowed_public_metadata' ),
		'sso_is_two_step_required'         => array( 'Jetpack_SSO_Helpers', 'is_two_step_required' ),
		'sso_should_hide_login_form'       => array( 'Jetpack_SSO_Helpers', 'should_hide_login_form' ),
		'sso_match_by_email'               => array( 'Jetpack_SSO_Helpers', 'match_by_email' ),
		'sso_new_user_override'            => array( 'Jetpack_SSO_Helpers', 'new_user_override' ),
		'sso_bypass_default_login_form'    => array( 'Jetpack_SSO_Helpers', 'bypass_login_forward_wpcom' ),
		'wp_version'                       => array( 'Automattic\\Jetpack\\Sync\\Functions', 'wp_version' ),
		'get_plugins'                      => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_plugins' ),
		'get_plugins_action_links'         => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_plugins_action_links' ),
		'active_modules'                   => array( 'Jetpack', 'get_active_modules' ),
		'hosting_provider'                 => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_hosting_provider' ),
		'locale'                           => 'get_locale',
		'site_icon_url'                    => array( 'Automattic\\Jetpack\\Sync\\Functions', 'site_icon_url' ),
		'roles'                            => array( 'Automattic\\Jetpack\\Sync\\Functions', 'roles' ),
		'timezone'                         => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_timezone' ),
		'available_jetpack_blocks'         => array( 'Jetpack_Gutenberg', 'get_availability' ), // Includes both Gutenberg blocks *and* plugins.
		'paused_themes'                    => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_themes' ),
		'paused_plugins'                   => array( 'Automattic\\Jetpack\\Sync\\Functions', 'get_paused_plugins' ),
	);


	/**
	 * Array of post type attributes synced.
	 *
	 * @var array Default post type attributes.
	 */
	public static $default_post_type_attributes = array(
		'name'                => '',
		'label'               => '',
		'labels'              => array(),
		'description'         => '',
		'public'              => false,
		'hierarchical'        => false,
		'exclude_from_search' => true,
		'publicly_queryable'  => null,
		'show_ui'             => false,
		'show_in_menu'        => null,
		'show_in_nav_menus'   => null,
		'show_in_admin_bar'   => false,
		'menu_position'       => null,
		'menu_icon'           => null,
		'supports'            => array(),
		'capability_type'     => 'post',
		'capabilities'        => array(),
		'cap'                 => array(),
		'map_meta_cap'        => true,
		'taxonomies'          => array(),
		'has_archive'         => false,
		'rewrite'             => true,
		'query_var'           => true,
		'can_export'          => true,
		'delete_with_user'    => null,
		'show_in_rest'        => false,
		'rest_base'           => false,
		'_builtin'            => false,
		'_edit_link'          => 'post.php?post=%d',
	);

	/**
	 * Get the whitelist of callables allowed to be managed via the JSON API.
	 *
	 * @return array Whitelist of callables allowed to be managed via the JSON API.
	 */
	public static function get_callable_whitelist() {
		/**
		 * Filter the list of callables that are manageable via the JSON API.
		 *
		 * @module sync
		 *
		 * @since 4.8.0
		 *
		 * @param array The default list of callables.
		 */
		return apply_filters( 'jetpack_sync_callable_whitelist', self::$default_callable_whitelist );
	}

	/**
	 * Post types that will not be synced.
	 *
	 * These are usually automated post types (sitemaps, logs, etc).
	 *
	 * @var array Blacklisted post types.
	 */
	public static $blacklisted_post_types = array(
		'ai1ec_event',
		'bwg_album',
		'bwg_gallery',
		'customize_changeset', // WP built-in post type for Customizer changesets.
		'dn_wp_yt_log',
		'http',
		'idx_page',
		'jetpack_migration',
		'jp_img_sitemap',
		'jp_img_sitemap_index',
		'jp_sitemap',
		'jp_sitemap_index',
		'jp_sitemap_master',
		'jp_vid_sitemap',
		'jp_vid_sitemap_index',
		'postman_sent_mail',
		'rssap-feed',
		'rssmi_feed_item',
		'scheduled-action', // Action Scheduler - Job Queue for WordPress https://github.com/woocommerce/woocommerce/tree/e7762627c37ec1f7590e6cac4218ba0c6a20024d/includes/libraries/action-scheduler .
		'secupress_log_action',
		'sg_optimizer_jobs',
		'snitch',
		'vip-legacy-redirect',
		'wp_automatic',
		'wpephpcompat_jobs',
		'wprss_feed_item',
	);

	/**
	 * Taxonomies that we're not syncing by default.
	 *
	 * The list is compiled by auditing the dynamic filters and actions that contain taxonomy slugs
	 * and could conflict with other existing filters/actions in WP core, Jetpack and WooCommerce.
	 *
	 * @var array
	 */
	public static $blacklisted_taxonomies = array(
		'ancestors',
		'archives_link',
		'attached_file',
		'attached_media',
		'attached_media_args',
		'attachment',
		'available_languages',
		'avatar',
		'avatar_comment_types',
		'avatar_data',
		'avatar_url',
		'bloginfo_rss',
		'blogs_of_user',
		'bookmark_link',
		'bookmarks',
		'calendar',
		'canonical_url',
		'categories_per_page',
		'categories_taxonomy',
		'category_form',
		'category_form_fields',
		'category_form_pre',
		'comment',
		'comment_author',
		'comment_author_email',
		'comment_author_IP',
		'comment_author_link',
		'comment_author_url',
		'comment_author_url_link',
		'comment_date',
		'comment_excerpt',
		'comment_ID',
		'comment_link',
		'comment_misc_actions',
		'comment_text',
		'comment_time',
		'comment_type',
		'comments_link',
		'comments_number',
		'comments_pagenum_link',
		'custom_logo',
		'date_sql',
		'default_comment_status',
		'delete_post_link',
		'edit_bookmark_link',
		'edit_comment_link',
		'edit_post_link',
		'edit_tag_link',
		'edit_term_link',
		'edit_user_link',
		'enclosed',
		'feed_build_date',
		'form_advanced',
		'form_after_editor',
		'form_after_title',
		'form_before_permalink',
		'form_top',
		'handle_product_cat',
		'header_image_tag',
		'header_video_url',
		'image_tag',
		'image_tag_class',
		'lastpostdate',
		'lastpostmodified',
		'link',
		'link_category_form',
		'link_category_form_fields',
		'link_category_form_pre',
		'main_network_id',
		'media',
		'media_item_args',
		'ms_user',
		'network',
		'object_terms',
		'option',
		'page',
		'page_form',
		'page_of_comment',
		'page_uri',
		'pagenum_link',
		'pages',
		'plugin',
		'post',
		'post_galleries',
		'post_gallery',
		'post_link',
		'post_modified_time',
		'post_status',
		'post_time',
		'postmeta',
		'posts_per_page',
		'product_cat',
		'product_search_form',
		'profile_url',
		'pung',
		'role_list',
		'sample_permalink',
		'sample_permalink_html',
		'schedule',
		'search_form',
		'search_query',
		'shortlink',
		'site',
		'site_email_content',
		'site_icon_url',
		'site_option',
		'space_allowed',
		'tag',
		'tag_form',
		'tag_form_fields',
		'tag_form_pre',
		'tag_link',
		'tags',
		'tags_per_page',
		'term',
		'term_link',
		'term_relationships',
		'term_taxonomies',
		'term_taxonomy',
		'terms',
		'terms_args',
		'terms_defaults',
		'terms_fields',
		'terms_orderby',
		'the_archive_description',
		'the_archive_title',
		'the_categories',
		'the_date',
		'the_excerpt',
		'the_guid',
		'the_modified_date',
		'the_modified_time',
		'the_post_type_description',
		'the_tags',
		'the_terms',
		'the_time',
		'theme_starter_content',
		'to_ping',
		'user',
		'user_created_user',
		'user_form',
		'user_profile',
		'user_profile_update',
		'usermeta',
		'usernumposts',
		'users_drafts',
		'webhook',
		'widget',
		'woocommerce_archive',
		'wp_title_rss',
	);

	/**
	 * Default array of post table columns.
	 *
	 * @var array Post table columns.
	 */
	public static $default_post_checksum_columns = array(
		'ID',
		'post_modified',
	);

	/**
	 * Default array of post meta table columns.
	 *
	 * @var array Post meta table columns.
	 */
	public static $default_post_meta_checksum_columns = array(
		'meta_id',
		'meta_value',
	);

	/**
	 * Default array of comment table columns.
	 *
	 * @var array Default comment table columns.
	 */
	public static $default_comment_checksum_columns = array(
		'comment_ID',
		'comment_content',
	);

	/**
	 * Default array of comment meta columns.
	 *
	 * @var array Comment meta table columns.
	 */
	public static $default_comment_meta_checksum_columns = array(
		'meta_id',
		'meta_value',
	);

	/**
	 * Default array of option table columns.
	 *
	 * @var array Default array of option columns.
	 */
	public static $default_option_checksum_columns = array(
		'option_name',
		'option_value',
	);

	/**
	 * Default array of term columns.
	 *
	 * @var array array of term columns.
	 */
	public static $default_term_checksum_columns = array(
		'term_id',
		'name',
		'slug',
	);

	/**
	 * Default array of term taxonomy columns.
	 *
	 * @var array Array of term taxonomy columns.
	 */
	public static $default_term_taxonomy_checksum_columns = array(
		'term_taxonomy_id',
		'term_id',
		'taxonomy',
		'parent',
		'count',
	);

	/**
	 * Default term relationship columns.
	 *
	 * @var array Array of term relationship columns.
	 */
	public static $default_term_relationships_checksum_columns = array(
		'object_id',
		'term_taxonomy_id',
		'term_order',
	);

	/**
	 * Default multisite callables able to be managed via JSON API.
	 *
	 * @var array multsite callables whitelisted
	 */
	public static $default_multisite_callable_whitelist = array(
		'network_name'                        => array( 'Jetpack', 'network_name' ),
		'network_allow_new_registrations'     => array( 'Jetpack', 'network_allow_new_registrations' ),
		'network_add_new_users'               => array( 'Jetpack', 'network_add_new_users' ),
		'network_site_upload_space'           => array( 'Jetpack', 'network_site_upload_space' ),
		'network_upload_file_types'           => array( 'Jetpack', 'network_upload_file_types' ),
		'network_enable_administration_menus' => array( 'Jetpack', 'network_enable_administration_menus' ),
	);

	/**
	 * Get array of multisite callables whitelisted.
	 *
	 * @return array Multisite callables managable via JSON API.
	 */
	public static function get_multisite_callable_whitelist() {
		/**
		 * Filter the list of multisite callables that are manageable via the JSON API.
		 *
		 * @module sync
		 *
		 * @since 4.8.0
		 *
		 * @param array The default list of multisite callables.
		 */
		return apply_filters( 'jetpack_sync_multisite_callable_whitelist', self::$default_multisite_callable_whitelist );
	}

	/**
	 * Array of post meta keys whitelisted.
	 *
	 * @var array Post meta whitelist.
	 */
	public static $post_meta_whitelist = array(
		'_feedback_akismet_values',
		'_feedback_email',
		'_feedback_extra_fields',
		'_g_feedback_shortcode',
		'_jetpack_post_thumbnail',
		'_menu_item_classes',
		'_menu_item_menu_item_parent',
		'_menu_item_object',
		'_menu_item_object_id',
		'_menu_item_orphaned',
		'_menu_item_type',
		'_menu_item_xfn',
		'_publicize_facebook_user',
		'_publicize_twitter_user',
		'_thumbnail_id',
		'_wp_attached_file',
		'_wp_attachment_backup_sizes',
		'_wp_attachment_context',
		'_wp_attachment_image_alt',
		'_wp_attachment_is_custom_background',
		'_wp_attachment_is_custom_header',
		'_wp_attachment_metadata',
		'_wp_page_template',
		'_wp_trash_meta_comments_status',
		'_wpas_mess',
		'content_width',
		'custom_css_add',
		'custom_css_preprocessor',
		'enclosure',
		'imagedata',
		'nova_price',
		'publicize_results',
		'sharing_disabled',
		'switch_like_status',
		'videopress_guid',
		'vimeo_poster_image',
		'advanced_seo_description', // Jetpack_SEO_Posts::DESCRIPTION_META_KEY.
	);

	/**
	 * Get the post meta key whitelist.
	 *
	 * @return array Post meta whitelist.
	 */
	public static function get_post_meta_whitelist() {
		/**
		 * Filter the list of post meta data that are manageable via the JSON API.
		 *
		 * @module sync
		 *
		 * @since 4.8.0
		 *
		 * @param array The default list of meta data keys.
		 */
		return apply_filters( 'jetpack_sync_post_meta_whitelist', self::$post_meta_whitelist );
	}

	/**
	 * Comment meta whitelist.
	 *
	 * @var array Comment meta whitelist.
	 */
	public static $comment_meta_whitelist = array(
		'hc_avatar',
		'hc_post_as',
		'hc_wpcom_id_sig',
		'hc_foreign_user_id',
	);

	/**
	 * Get the comment meta whitelist.
	 *
	 * @return array
	 */
	public static function get_comment_meta_whitelist() {
		/**
		 * Filter the list of comment meta data that are manageable via the JSON API.
		 *
		 * @module sync
		 *
		 * @since 5.7.0
		 *
		 * @param array The default list of comment meta data keys.
		 */
		return apply_filters( 'jetpack_sync_comment_meta_whitelist', self::$comment_meta_whitelist );
	}

	/**
	 * Default theme support whitelist.
	 *
	 * @todo move this to server? - these are theme support values
	 * that should be synced as jetpack_current_theme_supports_foo option values
	 *
	 * @var array Default theme support whitelist.
	 */
	public static $default_theme_support_whitelist = array(
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

	/**
	 * Is an option whitelisted?
	 *
	 * @param string $option Option name.
	 * @return bool If option is on the whitelist.
	 */
	public static function is_whitelisted_option( $option ) {
		$whitelisted_options = self::get_options_whitelist();
		foreach ( $whitelisted_options as $whitelisted_option ) {
			if ( '/' === $whitelisted_option[0] && preg_match( $whitelisted_option, $option ) ) {
				return true;
			} elseif ( $whitelisted_option === $option ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Default whitelist of capabilities to sync.
	 *
	 * @var array Array of WordPress capabilities.
	 */
	public static $default_capabilities_whitelist = array(
		'switch_themes',
		'edit_themes',
		'edit_theme_options',
		'install_themes',
		'activate_plugins',
		'edit_plugins',
		'install_plugins',
		'edit_users',
		'edit_files',
		'manage_options',
		'moderate_comments',
		'manage_categories',
		'manage_links',
		'upload_files',
		'import',
		'unfiltered_html',
		'edit_posts',
		'edit_others_posts',
		'edit_published_posts',
		'publish_posts',
		'edit_pages',
		'read',
		'publish_pages',
		'edit_others_pages',
		'edit_published_pages',
		'delete_pages',
		'delete_others_pages',
		'delete_published_pages',
		'delete_posts',
		'delete_others_posts',
		'delete_published_posts',
		'delete_private_posts',
		'edit_private_posts',
		'read_private_posts',
		'delete_private_pages',
		'edit_private_pages',
		'read_private_pages',
		'delete_users',
		'create_users',
		'unfiltered_upload',
		'edit_dashboard',
		'customize',
		'delete_site',
		'update_plugins',
		'delete_plugins',
		'update_themes',
		'update_core',
		'list_users',
		'remove_users',
		'add_users',
		'promote_users',
		'delete_themes',
		'export',
		'edit_comment',
		'upload_plugins',
		'upload_themes',
	);

	/**
	 * Get default capabilities whitelist.
	 *
	 * @return array
	 */
	public static function get_capabilities_whitelist() {
		/**
		 * Filter the list of capabilities that we care about
		 *
		 * @module sync
		 *
		 * @since 5.5.0
		 *
		 * @param array The default list of capabilities.
		 */
		return apply_filters( 'jetpack_sync_capabilities_whitelist', self::$default_capabilities_whitelist );
	}

	/**
	 * Get max execution sync time.
	 *
	 * @return float Number of seconds.
	 */
	public static function get_max_sync_execution_time() {
		$max_exec_time = intval( ini_get( 'max_execution_time' ) );
		if ( 0 === $max_exec_time ) {
			// 0 actually means "unlimited", but let's not treat it that way.
			$max_exec_time = 60;
		}
		return floor( $max_exec_time / 3 );
	}

	/**
	 * Get default for a given setting.
	 *
	 * @param string $setting Setting to get.
	 * @return mixed Value will be a string, int, array, based on the particular setting requested.
	 */
	public static function get_default_setting( $setting ) {
		$default_name = "default_$setting"; // e.g. default_dequeue_max_bytes.
		return self::$$default_name;
	}

	/**
	 * Default list of network options.
	 *
	 * @var array network options
	 */
	public static $default_network_options_whitelist = array(
		'site_name',
		'jetpack_protect_key',
		'jetpack_protect_global_whitelist',
		'active_sitewide_plugins',
	);

	/**
	 * A mapping of known importers to friendly names.
	 *
	 * Keys are the class name of the known importer.
	 * Values are the friendly name.
	 *
	 * @since 7.3.0
	 *
	 * @var array
	 */
	public static $default_known_importers = array(
		'Blogger_Importer'     => 'blogger',
		'LJ_API_Import'        => 'livejournal',
		'MT_Import'            => 'mt',
		'RSS_Import'           => 'rss',
		'WC_Tax_Rate_Importer' => 'woo-tax-rate',
		'WP_Import'            => 'wordpress',
	);

	/**
	 * Returns a list of known importers.
	 *
	 * @since 7.3.0
	 *
	 * @return array Known importers with importer class names as keys and friendly names as values.
	 */
	public static function get_known_importers() {
		/**
		 * Filter the list of known importers.
		 *
		 * @module sync
		 *
		 * @since 7.3.0
		 *
		 * @param array The default list of known importers.
		 */
		return apply_filters( 'jetpack_sync_known_importers', self::$default_known_importers );
	}

	/**
	 * Whether this is a system with a multiple networks.
	 * We currently need this static wrapper because we statically define our default list of callables.
	 *
	 * @since 7.6.0
	 *
	 * @uses Automattic\Jetpack\Status::is_multi_network
	 *
	 * @return boolean
	 */
	public static function is_multi_network() {
		$status = new Status();
		return $status->is_multi_network();
	}

	/**
	 * Default bytes to dequeue.
	 *
	 * @var int Bytes.
	 */
	public static $default_dequeue_max_bytes = 500000; // very conservative value, 1/2 MB.

	/**
	 * Default upload bytes.
	 *
	 * This value is a little bigger than the upload limit to account for serialization.
	 *
	 * @var int Bytes.
	 */
	public static $default_upload_max_bytes = 600000;

	/**
	 * Default number of rows uploaded.
	 *
	 * @var int Number of rows.
	 */
	public static $default_upload_max_rows = 500;

	/**
	 * Default sync wait time.
	 *
	 * @var int Number of seconds.
	 */
	public static $default_sync_wait_time = 10; // seconds, between syncs.

	/**
	 * Only wait before next send if the current send took more than this number of seconds.
	 *
	 * @var int Number of seconds.
	 */
	public static $default_sync_wait_threshold = 5;

	/**
	 * Default wait between attempting to continue a full sync via requests.
	 *
	 * @var int Number of seconds.
	 */
	public static $default_enqueue_wait_time = 10;

	/**
	 * Maximum queue size.
	 *
	 * Each item is represented with a new row in the wp_options table.
	 *
	 * @var int Number of queue items.
	 */
	public static $default_max_queue_size = 1000;

	/**
	 * Default maximum lag allowed in the queue.
	 *
	 * @var int Number of seconds
	 */
	public static $default_max_queue_lag = 900; // 15 minutes.

	/**
	 * Default for default writes per sec.
	 *
	 * @var int Rows per second.
	 */
	public static $default_queue_max_writes_sec = 100; // 100 rows a second.

	/**
	 * Default for post types blacklist.
	 *
	 * @var array Empty array.
	 */
	public static $default_post_types_blacklist = array();

	/**
	 * Default for taxonomies blacklist.
	 *
	 * @var array Empty array.
	 */
	public static $default_taxonomies_blacklist = array();

	/**
	 * Default for taxonomies whitelist.
	 *
	 * @var array Empty array.
	 */
	public static $default_taxonomy_whitelist = array();

	/**
	 * Default for post meta whitelist.
	 *
	 * @var array Empty array.
	 */
	public static $default_post_meta_whitelist = array();

	/**
	 * Default for comment meta whitelist.
	 *
	 * @var array Empty array.
	 */
	public static $default_comment_meta_whitelist = array();

	/**
	 * Default for disabling sync across the site.
	 *
	 * @var int Bool-ish. Default to 0.
	 */
	public static $default_disable = 0; // completely disable sending data to wpcom.

	/**
	 * Default for disabling sync across the entire network on multisite.
	 *
	 * @var int Bool-ish. Default 0.
	 */
	public static $default_network_disable = 0;

	/**
	 * Should Sync use cron?
	 *
	 * @var int Bool-ish value. Default 1.
	 */
	public static $default_sync_via_cron = 1;

	/**
	 * Default if Sync should render content.
	 *
	 * @var int Bool-ish value. Default is 0.
	 */
	public static $default_render_filtered_content = 0;

	/**
	 * Default number of items to enqueue at a time when running full sync.
	 *
	 * @var int Number of items.
	 */
	public static $default_max_enqueue_full_sync = 100;

	/**
	 * Default for maximum queue size during a full sync.
	 *
	 * Each item will represent a value in the wp_options table.
	 *
	 * @var int Number of items.
	 */
	public static $default_max_queue_size_full_sync = 1000; // max number of total items in the full sync queue.

	/**
	 * Defaul for time between syncing callables.
	 *
	 * @var int Number of seconds.
	 */
	public static $default_sync_callables_wait_time = MINUTE_IN_SECONDS; // seconds before sending callables again.

	/**
	 * Default for time between syncing constants.
	 *
	 * @var int Number of seconds.
	 */
	public static $default_sync_constants_wait_time = HOUR_IN_SECONDS; // seconds before sending constants again.
	/**
	 * Default for sync queue lock timeout time.
	 *
	 * @var int Number of seconds.
	 */
	public static $default_sync_queue_lock_timeout = 120; // 2 minutes.

	/**
	 * Default for cron sync time limit.
	 *
	 * @var int Number of seconds.
	 */
	public static $default_cron_sync_time_limit = 30; // 30 seconds.

	/**
	 * Default for number of term relationship items sent in an full sync item.
	 *
	 * @var int Number of items.
	 */
	public static $default_term_relationships_full_sync_item_size = 100;

	/**
	 * Default for enabling incremental sync.
	 *
	 * @var int 1 for true.
	 */
	public static $default_sync_sender_enabled = 1; // Should send incremental sync items.

	/**
	 * Default for enabling Full Sync.
	 *
	 * @var int 1 for true.
	 */
	public static $default_full_sync_sender_enabled = 1; // Should send full sync items.
}
