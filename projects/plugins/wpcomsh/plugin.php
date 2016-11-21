<?php
/**
 * Plugin Name: AT Pressable disable premium theme editing
 * Plugin URI: http://wordpress.com
 * Description: Disable editing WPCom third-party premium themes.
 * Version: 1.0
 * Author: Automattic
 * Author URI: http://automattic.com/
 */

require_once( 'constants.php' );

class AT_Pressable_Themes {
	static $instance = null;

	private function __construct() {
		$this->register_theme_hooks();
	}

	static function init() {
		if ( ! self::$instance ) {
			self::$instance = new AT_Pressable_Themes();
		}

		return self::$instance;
	}

	private function register_theme_hooks() {
		add_filter(
			'jetpack_wpcom_theme_skip_download',
			[ $this, 'should_theme_skip_download_filter_handler' ],
			10,
			2
		);

		add_filter( 'jetpack_wpcom_theme_install', [ $this, 'symlink_theme' ], 10, 2 );
	}

	function symlink_theme( $is_theme_installed, $theme_slug ) {
		$theme_slug_without_wpcom_suffix = preg_replace( '/-wpcom$/', '', $theme_slug );

		error_log('theme slug: ' . $theme_slug);

		$abs_theme_path = AT_PRESSABLE_THEMES_PATH . '/' . $theme_slug_without_wpcom_suffix;
		$abs_theme_symlink_path = get_theme_root() . '/' . $theme_slug;

		symlink( $abs_theme_path, $abs_theme_symlink_path );

		return true;

	}

	private function is_premium_theme( $theme_slug ) {
		// If the theme comes from WPCom, its name will be suffixed with "-wpcom".
		// However, the WPCom premium themes are not stored with this suffix. Let's strip it.
		$theme_slug = preg_replace( '/-wpcom$/', '', $theme_slug );

		$all_wpcom_themes = scandir( AT_PRESSABLE_THEMES_PATH );

		if ( ! $all_wpcom_themes ) {
			error_log(
				"AT_Pressable: WPCom premium themes folder couldn't be located. " .
				"Check whether the AT_PRESSABLE_THEMES_PATH constant points to the correct directory."
			);

			return false;
		}

		return in_array( $theme_slug, $all_wpcom_themes );
	}

	private function is_theme_symlinked( $theme_slug ) {
		$site_themes_dir = get_theme_root();

		$site_themes = scandir( $site_themes_dir );

		if ( ! in_array( $theme_slug, $site_themes ) ) {
			return false;
		}

		return true;
	}

	function should_theme_skip_download_filter_handler( $is_theme_installed, $theme_slug ) {
		if (
			! $is_theme_installed &&
			// If we are dealing with a WPCom non-premium (ie free) theme, don't interfere.
			! $this->is_premium_theme( $theme_slug )
		) {
			return false;
		}

		return ! $this->is_theme_symlinked( $theme_slug );
	}
}

add_action( 'init', 'at_pressable_themes_init' );

function at_pressable_themes_init() {
	AT_Pressable_Themes::init();
}




add_action( 'admin_init', 'at_pressable_add_filter_for_edit_themes_capability' );

function at_pressable_add_filter_for_edit_themes_capability() {
	add_filter( 'user_has_cap', 'at_pressable_disable_premium_theme_editing', 10, 3 );
}

function at_pressable_disable_premium_theme_editing( $allcaps ) {
	$list_of_third_party_premium_themes = [
		'Carbon',
		'Eris',
		'Label',
		'Pena'
		// TODO: If we decide for this approach, list all third-party WPCom premium themes here
	];

	$currently_active_theme = get_template();

	if ( $currently_active_theme && in_array( $currently_active_theme, $list_of_third_party_premium_themes ) ) {
		$allcaps['edit_themes'] = false;
	}

	return $allcaps;
}
