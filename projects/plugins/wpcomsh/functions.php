<?php

/**
 * Returns whether a theme is a WPCom one or not (ie installed/downloaded from wp.com).
 *
 * Note: it checks whether the theme slug ends in `-wpcom` and if yes, it assumes it's a WPCom theme.
 * However, if a custom (uploaded) theme also contains this suffix, a user won't be able to delete it.
 * We could use the `is_wpcom_theme` method from the `WPCom_Themes_Manager` which is more reliable but it's also much
 * slower. This would show especially for users with many installed themes.
 *
 * @param string $theme_slug Slug of an installed theme.
 * @return bool              Whether the passed in theme is a WPCom one.
 */
function jetpress_is_maybe_wpcom_theme( $theme_slug ) {
	return substr( $theme_slug, -6 ) === '-wpcom';
}

function jetpress_is_wpcom_theme( $theme_slug ) {
	return jetpress_is_wpcom_premium_theme( $theme_slug ) ||
		   jetpress_is_wpcom_pub_theme( $theme_slug );
}

function jetpress_is_wpcom_premium_theme( $theme_slug ) {
	if (
		! defined( 'JETPRESS_WPCOM_PREMIUM_THEMES_PATH' ) ||
		! file_exists( JETPRESS_WPCOM_PREMIUM_THEMES_PATH )
	) {
		error_log(
			"Jetpress: WPCom premium themes folder couldn't be located. " .
			"Check whether the " . JETPRESS_WPCOM_PREMIUM_THEMES_PATH . " constant points to the correct directory."
		);

		return false;
	}

	$theme_dir_path = JETPRESS_WPCOM_PREMIUM_THEMES_PATH . "/${theme_slug}";

	return file_exists( $theme_dir_path );
}

function jetpress_is_wpcom_pub_theme( $theme_slug ) {
	if (
		! defined( 'JETPRESS_WPCOM_PUB_THEMES_PATH' ) ||
		! file_exists( JETPRESS_WPCOM_PUB_THEMES_PATH )
	) {
		error_log(
			"Jetpress: WPCom pub themes folder couldn't be located. " .
			"Check whether the " . JETPRESS_WPCOM_PUB_THEMES_PATH . " constant points to the correct directory."
		);

		return false;
	}

	$theme_dir_path = JETPRESS_WPCOM_PUB_THEMES_PATH . "/${theme_slug}";

	return file_exists( $theme_dir_path );
}

function jetpress_get_parent_theme_slug( $theme_slug ) {
	$theme_obj = wp_get_theme( $theme_slug );

	if ( is_wp_error( $theme_obj ) ) {
		return $theme_obj;
	}

	return $theme_obj->parent();

}

function jetpress_symlink_theme( $theme_slug, $theme_type ) {
	$themes_source_path = '';

	if ( JETPRESS_WPCOM_PUB_THEME_TYPE === $theme_type ) {
		$themes_source_path = JETPRESS_WPCOM_PUB_THEMES_PATH;
	} elseif ( JETPRESS_WPCOM_PREMIUM_THEME_TYPE === $theme_type ) {
		$themes_source_path = JETPRESS_WPCOM_PREMIUM_THEMES_PATH;
	}

	$abs_theme_path = $themes_source_path . '/' . $theme_slug;
	$abs_theme_symlink_path = get_theme_root() . '/' . $theme_slug;

	if ( ! file_exists( $abs_theme_path ) ) {
		$error_message = "Source theme directory doesn't exists at: ${abs_theme_path}";

		error_log( 'Jetpress: ' . $error_message );

		return new WP_Error( 'error_symlinking_theme', $error_message );
	}

	if ( ! symlink( $abs_theme_path, $abs_theme_symlink_path ) ) {
		$error_message = "Can't symlink theme with slug: ${theme_slug}." .
						 "Make sure it exists in the " . JETPRESS_WPCOM_PREMIUM_THEMES_PATH . " directory.";

		error_log( 'Jetpress: ' . $error_message );

		return new WP_Error( 'error_symlinking_theme', $error_message );
	}

	return true;
}

function jetpress_delete_theme_cache( $theme_slug ) {
	$theme_obj = wp_get_theme( $theme_slug );

	if ( $theme_slug && ! is_wp_error( $theme_obj ) ) {
		$theme_obj->cache_delete();
	}
}

/**
 * Checks whether a theme (by theme slug) is symlinked in the themes' directory.
 *
 * @param string $theme_slug the slug of a theme
 *
 * @return bool whether a theme is symlinked in the themes' directory
 */
function jetpress_is_theme_symlinked( $theme_slug ) {
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

function jetpress_delete_symlinked_theme( $theme_slug ) {
	$site_themes_dir_path = get_theme_root();

	$symlinked_theme_path = $site_themes_dir_path . '/' . $theme_slug;

	if ( file_exists( $symlinked_theme_path ) && is_link( $symlinked_theme_path ) ) {
		unlink( $symlinked_theme_path );

		return true;
	}

	error_log(
		"Jetpress: Can't delete the specified symlinked theme: the path or symlink doesn't exist."
	);

	return new WP_Error(
		'error_deleting_symlinked_theme',
		"Can't delete the specified symlinked theme: the path or symlink doesn't exist."
	);
}

function jetpress_get_wpcom_theme_type( $theme_slug ) {
	if ( jetpress_is_wpcom_premium_theme( $theme_slug ) ) {
		return JETPRESS_WPCOM_PREMIUM_THEME_TYPE;
	} elseif ( jetpress_is_wpcom_pub_theme( $theme_slug ) ) {
		return JETPRESS_WPCOM_PUB_THEME_TYPE;
	}

	return false;
}

function jetpress_is_wpcom_child_theme( $theme_slug ) {
	$theme_obj = wp_get_theme( $theme_slug );

	return $theme_obj->parent();
}

function jetpress_symlink_parent_theme( $child_theme_slug ) {
	$child_theme_obj = wp_get_theme( $child_theme_slug );
	$parent_theme_obj = $child_theme_obj->parent();

	if ( ! $parent_theme_obj ) {
		error_log( "Jetpress: Can't symlink parent theme. Current theme is not a child theme." );

		return false;
	}

	$parent_theme_slug = $parent_theme_obj->get_stylesheet();
	$parent_theme_type = jetpress_get_wpcom_theme_type( $parent_theme_slug );

	return jetpress_symlink_theme( $parent_theme_slug, $parent_theme_type );
}
