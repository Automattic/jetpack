<?php
/**
 * Plugin Name: AT Pressable disable premium theme editing
 * Plugin URI: http://wordpress.com
 * Description: Disable editing WPCom third-party premium themes.
 * Version: 1.0
 * Author: Automattic
 * Author URI: http://automattic.com/
 */

namespace AT_Pressable\Themes;

use \WP_Error;

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
			[ $this, 'jetpack_wpcom_theme_skip_download_filter_handler' ],
			10,
			2
		);

		add_filter(
			'jetpack_wpcom_theme_delete',
			[ $this, 'jetpack_wpcom_theme_delete_filter_handler' ],
			10,
			2
		);
	}

	public function jetpack_wpcom_theme_delete_filter_handler( $result, $theme_slug ) {
		if (
			! $this->is_wpcom_premium_theme( $theme_slug ) ||
			! $this->is_theme_symlinked( $theme_slug )
		) {
			return false;
		}

		$result = $this->delete_symlinked_theme( $theme_slug );

		return $result;
	}

	function symlink_theme( $theme_slug ) {
		$theme_slug_without_wpcom_suffix = $this->strip_wpcom_theme_slug_suffix( $theme_slug );

		$abs_theme_path = WPCOM_PREMIUM_THEMES_PATH . '/' . $theme_slug_without_wpcom_suffix;
		$abs_theme_symlink_path = get_theme_root() . '/' . $theme_slug;

		if ( ! symlink( $abs_theme_path, $abs_theme_symlink_path ) ) {
			$error_message = "Can't symlink theme with slug: ${theme_slug}." .
				"Make sure it exists in the " . WPCOM_PREMIUM_THEMES_PATH . " directory.";

			error_log( 'AT Pressable: ' . $error_message );

			return new WP_Error( 'error_symlinking_theme', $error_message );
		}

		return true;
	}

	private function delete_theme_cache( $theme_slug ) {
		$theme_obj = wp_get_theme( $theme_slug );

		if ( $theme_slug && ! is_wp_error( $theme_obj ) ) {
			$theme_obj->cache_delete();
		}
	}

	/**
	 * WPCom themes (both pub and premium) have a `-wpcom` suffix
	 *
	 * @param string $theme_slug theme's slug with or without the `-wpcom` suffix
	 *
	 * @return string            theme's slug without the `-wpcom` suffix
	 */
	private function strip_wpcom_theme_slug_suffix( $theme_slug ) {
		return preg_replace( '/-wpcom$/', '', $theme_slug );
	}

	private function is_wpcom_premium_theme( $theme_slug ) {
		// If the theme comes from WPCom, its name will be suffixed with "-wpcom".
		// However, the WPCom premium themes are not stored with this suffix. Let's strip it.
		$theme_slug = $this->strip_wpcom_theme_slug_suffix( $theme_slug );

		$all_wpcom_themes = scandir( WPCOM_PREMIUM_THEMES_PATH );

		if ( ! $all_wpcom_themes ) {
			error_log(
				"AT_Pressable: WPCom premium themes folder couldn't be located. " .
				"Check whether the AT_PRESSABLE_THEMES_PATH constant points to the correct directory."
			);

			return false;
		}

		$theme_dir_path = WPCOM_PREMIUM_THEMES_PATH . "/${theme_slug}";

		if ( ! file_exists( $theme_dir_path ) ) {
			error_log(
				"AT_Pressable: Theme with slug: {$theme_slug} doesn't exist in the WPCom premium themes folder " .
			    WPCOM_PREMIUM_THEMES_PATH
			);

			return false;
		}

		return in_array( $theme_slug, $all_wpcom_themes );
	}

	/**
	 * Checks whether a theme (by theme slug) is symlinked in the themes' directory.
	 *
	 * @param string $theme_slug the slug of a theme
	 *
	 * @return bool whether a theme is symlinked in the themes' directory
	 */
	private function is_theme_symlinked( $theme_slug ) {
		$site_themes_dir_path = get_theme_root();
		$symlinked_theme_dir_path = $site_themes_dir_path . "/{$theme_slug}";

		$site_themes = scandir( $site_themes_dir_path );

		if (
			! in_array( $theme_slug, $site_themes ) ||
		    ! is_link( $symlinked_theme_dir_path )
		) {
			return false;
		}

		return true;
	}

	private function delete_symlinked_theme( $theme_slug ) {
		$site_themes_dir_path = get_theme_root();

		$symlinked_theme_path = $site_themes_dir_path . '/' . $theme_slug;

		if ( file_exists( $symlinked_theme_path ) && is_link( $symlinked_theme_path ) ) {
			unlink( $symlinked_theme_path );

			return true;
		}

		error_log(
			"AT_Pressable: Can't delete the specified symlinked theme: the path or symlink doesn't exist."
		);

		return new WP_Error(
			'error_deleting_symlinked_theme',
			"Can't delete the specified symlinked theme: the path or symlink doesn't exist."
		);
	}

	function jetpack_wpcom_theme_skip_download_filter_handler( $result, $theme_slug ) {
		// If we are dealing with a WPCom non-premium (ie free) theme, don't interfere.
		if ( ! $this->is_wpcom_premium_theme( $theme_slug ) ) {
			return false;
		}

		if ( ! $this->is_theme_symlinked( $theme_slug ) ) {
			$result = $this->symlink_theme( $theme_slug );

			$this->delete_theme_cache( $theme_slug );

			// Skip the theme installation as we've "installed" (symlinked) it manually above.
			add_filter(
				'jetpack_wpcom_theme_install',
				function() use( $result ) {
					return $result;
				},
				10,
				2
			);

			return true;
		}

		return false;
	}
}

add_action( 'init', __NAMESPACE__ . '\\at_pressable_themes_init' );

function at_pressable_themes_init() {
	AT_Pressable_Themes::init();
}
