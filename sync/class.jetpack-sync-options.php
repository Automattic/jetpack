<?php


class Jetpack_Sync_Options {

	static $options = array(
		'blogname',
		'home',
		'siteurl',
		'blogdescription',
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
		'twitter-cards-site-tag',
	);

	static $check_sum_id = 'options_check_sum';

	static $sync = array();
	static $delete = array();

	static private $init = false;

	static function init() {
		foreach ( self::get_options() as $option ) {
			self::register( $option );
		}
	}

	static function get_options() {
		if ( ! self::$init ) {
			$theme_slug =  get_option( 'stylesheet' );
			self::$options[] = "theme_mods_{$theme_slug}";

			foreach( Jetpack_Options::get_option_names( 'non-compact' ) as $option ) {
				self::$options[] = 'jetpack_' . $option;
			}
		}
		self::$init = true;
		return self::$options;
	}

	static function register( $option ) {
		add_action( "add_option_{$option}",    array( __CLASS__, 'add_option'   ) );
		add_action( "update_option_{$option}", array( __CLASS__, 'update_option' ) );
		add_action( "delete_option_{$option}", array( __CLASS__, 'delete_option' ) );
	}

	static function add_option( $option ) {
		self::$sync[] = $option;
	}

	static function update_option() {
		$prefix = 'update_option_';
		$option = substr( current_filter(), strlen( $prefix ) );
		if ( current_filter() === $option ) {
			return;
		}
		self::$sync[] = $option;
	}

	static function delete_option( $option ) {
		self::$delete[] = $option;
	}

	static function get_all() {
		return array_combine( self::$options, array_map( 'get_option', self::$options ) );
	}

	static function get_to_sync() {
		self::$sync = array_unique( self::$sync );
		if ( empty( self::$sync ) ) {
			return null;
		}
		return array_combine( self::$sync, array_map( 'get_option', self::$sync ) );
	}

	static function get_to_delete() {
		return array_unique( self::$delete );
	}

}
