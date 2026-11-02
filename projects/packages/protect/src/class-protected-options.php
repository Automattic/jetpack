<?php
/**
 * Option names the Protect dashboard never deletes.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

/**
 * WordPress core's and Jetpack's options, which stay even when Scan flags them, because the site or Jetpack needs them.
 *
 * @since 0.4.0
 */
class Protected_Options {

	/**
	 * Core's options: the defaults from populate_options() in wp-admin/includes/schema.php, then those core adds later, such as wp_salt()'s keys.
	 *
	 * @var string[]
	 */
	const CORE = array(
		'active_plugins',
		'admin_email',
		'admin_email_lifespan',
		'auto_plugin_theme_update_emails',
		'auto_update_core_dev',
		'auto_update_core_major',
		'auto_update_core_minor',
		'avatar_default',
		'avatar_rating',
		'blog_charset',
		'blog_public',
		'blogdescription',
		'blogname',
		'category_base',
		'close_comments_days_old',
		'close_comments_for_old_posts',
		'comment_max_links',
		'comment_moderation',
		'comment_order',
		'comment_previously_approved',
		'comment_registration',
		'comments_notify',
		'comments_per_page',
		'date_format',
		'db_version',
		'default_category',
		'default_comment_status',
		'default_comments_page',
		'default_email_category',
		'default_link_category',
		'default_ping_status',
		'default_pingback_flag',
		'default_post_format',
		'default_role',
		'disallowed_keys',
		'finished_splitting_shared_terms',
		'gmt_offset',
		'hack_file',
		'home',
		'html_type',
		'image_default_align',
		'image_default_link_type',
		'image_default_size',
		'large_size_h',
		'large_size_w',
		'link_manager_enabled',
		'links_updated_date_format',
		'mailserver_login',
		'mailserver_pass',
		'mailserver_port',
		'mailserver_url',
		'medium_large_size_h',
		'medium_large_size_w',
		'medium_size_h',
		'medium_size_w',
		'moderation_keys',
		'moderation_notify',
		'page_comments',
		'page_for_posts',
		'page_on_front',
		'permalink_structure',
		'ping_sites',
		'posts_per_page',
		'posts_per_rss',
		'recently_edited',
		'require_name_email',
		'rewrite_rules',
		'rss_use_excerpt',
		'show_avatars',
		'show_comments_cookies_opt_in',
		'show_on_front',
		'site_icon',
		'siteurl',
		'start_of_week',
		'sticky_posts',
		'stylesheet',
		'tag_base',
		'template',
		'thread_comments',
		'thread_comments_depth',
		'thumbnail_crop',
		'thumbnail_size_h',
		'thumbnail_size_w',
		'time_format',
		'timezone_string',
		'uninstall_plugins',
		'upload_path',
		'upload_url_path',
		'uploads_use_yearmonth_folders',
		'use_balanceTags',
		'use_smilies',
		'use_trackback',
		'users_can_register',
		'wp_attachment_pages_enabled',
		'wp_force_deactivated_plugins',
		'wp_notes_notify',
		'wp_page_for_privacy_policy',
		'adminhash',
		'auth_key',
		'auth_salt',
		'auto_core_update_notified',
		'auto_update_plugins',
		'auto_update_themes',
		'can_compress_scripts',
		'category_children',
		'cron',
		'current_theme',
		'customize_stashed_theme_mods',
		'dashboard_widget_options',
		'db_upgraded',
		'finished_updating_comment_type',
		'fresh_site',
		'https_detection_errors',
		'initial_db_version',
		'logged_in_key',
		'logged_in_salt',
		'nav_menu_options',
		'new_admin_email',
		'nonce_key',
		'nonce_salt',
		'recently_activated',
		'recovery_keys',
		'recovery_mode_email_last_sent',
		'secret_key',
		'secure_auth_key',
		'secure_auth_salt',
		'sidebars_widgets',
		'site_logo',
		'stylesheet_root',
		'template_root',
		'theme_switched',
		'theme_switched_via_customizer',
		'user_count',
		'wp_calendar_block_has_published_posts',
		'WPLANG',
	);

	/**
	 * Jetpack's options that no prefix in PREFIXES covers.
	 *
	 * @var string[]
	 */
	const JETPACK = array(
		'carousel_enable_it',
		'disabled_likes',
		'disabled_reblogs',
		'do_activate',
		'enable_odyssey_stats',
		'gravatar_disable_hovercards',
		'highlander_comment_form_prompt',
		'site_icon_id',
		'sm_enabled',
		'stb_enabled',
		'stc_enabled',
		'subscription_options',
		'tiled_galleries',
		'trusted_ip_header',
		'verification_services_codes',
		'wpcc_options',
	);

	/**
	 * Prefixes of core's per-widget, per-theme and per-site options, and of Jetpack's.
	 *
	 * @var string[]
	 */
	const PREFIXES = array(
		'widget_',
		'theme_mods_',
		'jetpack',
		'jp_',
		'jpsq_',
		'monitor_receive_notifications',
		'odyssey_stats',
		'post_by_email_',
		'sharing-',
		'sharedaddy',
		'social_notifications_',
		'stats_',
		'videopress',
		'wordads_',
		'wp_mobile_',
		'wpcom_',
	);

	/**
	 * Whether an option belongs to WordPress core or Jetpack.
	 *
	 * @param string $name The option name.
	 * @return bool
	 */
	public static function is_protected( $name ) {
		// MySQL matches option names case-insensitively, and core trims them, so " SiteURL" is the siteurl row.
		$name = strtolower( trim( $name ) );
		if ( in_array( $name, array_map( 'strtolower', array_merge( self::CORE, self::JETPACK ) ), true ) ) {
			return true;
		}
		// Roles are stored per site, as "{prefix}user_roles".
		if ( str_ends_with( $name, 'user_roles' ) ) {
			return true;
		}
		foreach ( self::PREFIXES as $prefix ) {
			if ( str_starts_with( $name, $prefix ) ) {
				return true;
			}
		}
		return false;
	}
}
