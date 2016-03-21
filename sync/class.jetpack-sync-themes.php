<?php

class Jetpack_Sync_Themes {

	static $check_sum_id = 'function_check_sum';
	static $sync = false;

	static function init() {
		add_action( 'switch_theme', array( __CLASS__, 'refresh_theme_data' ) );
	}

	/**
	 * Triggers a sync of information specific to the current theme.
	 */
	static function sync_theme_data() {

	}

	static function refresh_theme_data() {
		self::$sync = true;
	}

	static function get_sync() {
		if ( self::$sync ) {
			return self::get_all();
		}
		return array();
	}

	static function get_all() {
		return array(
			'featured_images_enabled'                          => Jetpack::featured_images_enabled(),
			'content_width'                                    => Jetpack::get_content_width(),
			'current_theme_supports_post-thumbnails'           => current_theme_supports( 'post-thumbnails' ),
			'current_theme_supports_post-formats'              => current_theme_supports( 'post-formats' ),
			'current_theme_supports_custom-header'             => current_theme_supports( 'custom-header' ),
			'current_theme_supports_custom-background'         => current_theme_supports( 'custom-background' ),
			'current_theme_supports_custom-logo'               => current_theme_supports( 'custom-logo' ),
			'current_theme_supports_menus'                     => current_theme_supports( 'menus' ),
			'current_theme_supports_automatic-feed-links'      => current_theme_supports( 'automatic-feed-links' ),
			'current_theme_supports_editor-style'              => current_theme_supports( 'editor-style' ),
			'current_theme_supports_widgets'                   => current_theme_supports( 'widgets' ),
			'current_theme_supports_html5'                     => current_theme_supports( 'html5' ),
			'current_theme_supports_title-tag'                 => current_theme_supports( 'title-tag' ),
			'current_theme_supports_jetpack-social-menu'       => current_theme_supports( 'jetpack-social-menu' ),
			'current_theme_supports_jetpack-responsive-videos' => current_theme_supports( 'jetpack-responsive-videos' ),
			'current_theme_supports_infinite-scroll'           => current_theme_supports( 'infinite-scroll' ),
			'current_theme_supports_site-logo'                 => current_theme_supports( 'site-logo' ),
		);
	}
}