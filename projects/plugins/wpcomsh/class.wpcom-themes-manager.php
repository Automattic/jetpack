<?php

class WPCom_Themes_Manager {
	static $instance = null;

	private function __construct() {
		$this->register_theme_hooks();
	}

	static function init() {
		if ( ! self::$instance ) {
			self::$instance = new WPCom_Themes_Manager();
		}

		return self::$instance;
	}

	private function register_theme_hooks() {
		error_log('registering hooks');
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

	static function is_wpcom_theme( $theme_slug ) {
		return self::is_wpcom_premium_theme( $theme_slug ) ||
		       self::is_wpcom_pub_theme( $theme_slug );
	}

	public function jetpack_wpcom_theme_delete_filter_handler( $result, $theme_slug ) {
		if (
			! self::is_wpcom_theme( $theme_slug ) ||
		    ! self::is_theme_symlinked( $theme_slug )
		) {
			return false;
		}

		$result = self::delete_symlinked_theme( $theme_slug );

		return $result;
	}

	static function get_parent_theme_slug( $theme_slug ) {
		$theme_obj = wp_get_theme( $theme_slug );

		if ( is_wp_error( $theme_obj ) ) {
			return $theme_obj;
		}

		return $theme_obj->parent();

	}

	static function symlink_theme( $theme_slug, $theme_type ) {
		$themes_source_path = '';

		if ( WPCOM_PUB_THEME_TYPE === $theme_type ) {
			$themes_source_path = WPCOM_PUB_THEMES_PATH;
		} elseif ( WPCOM_PREMIUM_THEME_TYPE === $theme_type ) {
			$themes_source_path = WPCOM_PREMIUM_THEMES_PATH;
		}

		$abs_theme_path = $themes_source_path . '/' . $theme_slug;
		$abs_theme_symlink_path = get_theme_root() . '/' . $theme_slug;

		if ( ! file_exists( $abs_theme_path ) ) {
			$error_message = "Source theme directory doesn't exists at: ${abs_theme_path}";

			error_log( 'AT Pressable: ' . $error_message );

			return new WP_Error( 'error_symlinking_theme', $error_message );
		}

		if ( ! symlink( $abs_theme_path, $abs_theme_symlink_path ) ) {
			$error_message = "Can't symlink theme with slug: ${theme_slug}." .
				"Make sure it exists in the " . WPCOM_PREMIUM_THEMES_PATH . " directory.";

			error_log( 'AT Pressable: ' . $error_message );

			return new WP_Error( 'error_symlinking_theme', $error_message );
		}

		return true;
	}

	static function delete_theme_cache( $theme_slug ) {
		$theme_obj = wp_get_theme( $theme_slug );

		if ( $theme_slug && ! is_wp_error( $theme_obj ) ) {
			$theme_obj->cache_delete();
		}
	}

	static function is_wpcom_premium_theme( $theme_slug ) {
		if (
			! defined( 'WPCOM_PREMIUM_THEMES_PATH' ) ||
			! file_exists( WPCOM_PREMIUM_THEMES_PATH )
		) {
			error_log(
				"AT_Pressable: WPCom premium themes folder couldn't be located. " .
				"Check whether the " . WPCOM_PREMIUM_THEMES_PATH . " constant points to the correct directory."
			);

			return false;
		}

		$theme_dir_path = WPCOM_PREMIUM_THEMES_PATH . "/${theme_slug}";

		return file_exists( $theme_dir_path );
	}

	static function is_wpcom_pub_theme( $theme_slug ) {
		if (
			! defined( 'WPCOM_PUB_THEMES_PATH' ) ||
			! file_exists( WPCOM_PUB_THEMES_PATH )
		) {
			error_log(
				"AT_Pressable: WPCom pub themes folder couldn't be located. " .
				"Check whether the " . WPCOM_PUB_THEMES_PATH . " constant points to the correct directory."
			);

			return false;
		}

		$theme_dir_path = WPCOM_PUB_THEMES_PATH . "/${theme_slug}";

		return file_exists( $theme_dir_path );
	}

	/**
	 * Checks whether a theme (by theme slug) is symlinked in the themes' directory.
	 *
	 * @param string $theme_slug the slug of a theme
	 *
	 * @return bool whether a theme is symlinked in the themes' directory
	 */
	static function is_theme_symlinked( $theme_slug ) {
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

	static function delete_symlinked_theme( $theme_slug ) {
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

	static function get_wpcom_theme_type( $theme_slug ) {
		if ( self::is_wpcom_premium_theme( $theme_slug ) ) {
			return WPCOM_PREMIUM_THEME_TYPE;
		} elseif ( self::is_wpcom_pub_theme( $theme_slug ) ) {
			return WPCOM_PUB_THEME_TYPE;
		}

		return false;
	}

	static function is_wpcom_child_theme( $theme_slug ) {
		$theme_obj = wp_get_theme( $theme_slug );

		return $theme_obj->parent();
	}

	static function symlink_parent_theme( $child_theme_slug ) {
		$child_theme_obj = wp_get_theme( $child_theme_slug );
		$parent_theme_obj = $child_theme_obj->parent();

		if ( ! $parent_theme_obj ) {
			error_log( "AT Pressable: Can't symlink parent theme. Current theme is not a child theme." );

			return false;
		}

		$parent_theme_slug = $parent_theme_obj->get_stylesheet();
		$parent_theme_type = self::get_wpcom_theme_type( $parent_theme_slug );

		return self::symlink_theme( $parent_theme_slug, $parent_theme_type );
	}

	function jetpack_wpcom_theme_skip_download_filter_handler( $result, $theme_slug ) {
		$theme_type = self::get_wpcom_theme_type( $theme_slug );

		// If we are dealing with a non WPCom theme, don't interfere.
		if ( ! $theme_type ) {
			return false;
		}

		if ( self::is_theme_symlinked( $theme_slug ) ) {
			return false;
		}

		error_log('after is theme symlinked');

		$was_theme_symlinked = self::symlink_theme( $theme_slug, $theme_type );

		if ( is_wp_error( $was_theme_symlinked ) ) {
			return $was_theme_symlinked;
		}

		self::delete_theme_cache( $theme_slug );

		// Skip the theme installation as we've "installed" (symlinked) it manually above.
		add_filter(
			'jetpack_wpcom_theme_install',
			function() use( $was_theme_symlinked ) {
				return $was_theme_symlinked;
			},
			10,
			2
		);

		error_log('got until child theme');


		// If the installed WPCom theme is a child theme, we need to symlink its parent theme
		// as well.
		if ( self::is_wpcom_child_theme( $theme_slug ) ) {
			$was_parent_theme_symlinked = self::symlink_parent_theme( $theme_slug );

			if ( ! $was_parent_theme_symlinked ) {
				return new WP_Error(
					'wpcom_theme_installation_falied',
					"Can't install specified WPCom theme. Check error log for more details."
				);
			}
		}

		return true;
	}
}
