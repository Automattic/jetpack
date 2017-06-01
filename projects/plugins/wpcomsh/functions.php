<?php
/**
 * Whether the theme is a wpcom theme.
 *
 * @param string $theme_slug Theme slug.
 * @return bool
 */
function wpcomsh_is_wpcom_theme( $theme_slug ) {
	return wpcomsh_is_wpcom_premium_theme( $theme_slug ) ||
		   wpcomsh_is_wpcom_pub_theme( $theme_slug );
}

/**
 * Whether the theme is a premium wpcom theme.
 *
 * @param string $theme_slug Theme slug.
 * @return bool
 */
function wpcomsh_is_wpcom_premium_theme( $theme_slug ) {
	if (
		! defined( 'WPCOMSH_PREMIUM_THEMES_PATH' ) ||
		! file_exists( WPCOMSH_PREMIUM_THEMES_PATH )
	) {
		error_log(
			"WPComSH: WPCom premium themes folder couldn't be located. " .
			"Check whether the " . WPCOMSH_PREMIUM_THEMES_PATH . " constant points to the correct directory."
		);

		return false;
	}

	return file_exists(
		WPCOMSH_PREMIUM_THEMES_PATH . "/{$theme_slug}"
	);
}

/**
 * Whether the theme is a free wpcom theme.
 *
 * @param string $theme_slug Theme slug.
 * @return bool
 */
function wpcomsh_is_wpcom_pub_theme( $theme_slug ) {
	if (
		! defined( 'WPCOMSH_PUB_THEMES_PATH' ) ||
		! file_exists( WPCOMSH_PUB_THEMES_PATH )
	) {
		error_log(
			"WPComSH: WPCom pub themes folder couldn't be located. " .
			"Check whether the " . WPCOMSH_PUB_THEMES_PATH . " constant points to the correct directory."
		);

		return false;
	}

	return file_exists(
		WPCOMSH_PUB_THEMES_PATH . "/{$theme_slug}"
	);
}

/**
 * Symlinks a wpcom theme.
 *
 * @param string $theme_slug
 * @param string $theme_type
 * @return bool|WP_Error
 */
function wpcomsh_symlink_theme( $theme_slug, $theme_type ) {
	$themes_source_path = '';
	$storefront_theme = false;

	if ( WPCOMSH_PUB_THEME_TYPE === $theme_type ) {
		$themes_source_path = WPCOMSH_PUB_THEMES_SYMLINK;
	} elseif ( WPCOMSH_PREMIUM_THEME_TYPE === $theme_type ) {
		$themes_source_path = WPCOMSH_PREMIUM_THEMES_SYMLINK;
	} elseif ( WPCOMSH_STOREFRONT_THEME_TYPE === $theme_type ) {
		$themes_source_path = WPCOMSH_STOREFRONT_THEMES_SYMLINK;
		$storefront_theme = true;
	}

	$abs_theme_path = $themes_source_path . "/{$theme_slug}";
	$abs_theme_symlink_path = get_theme_root() . '/' . $theme_slug;

	if ( ! $storefront_theme && ! file_exists( $abs_theme_path ) ) {
		$error_message = "Source theme directory doesn't exists at: ${abs_theme_path}";

		error_log( 'WPComSH: ' . $error_message );

		return new WP_Error( 'error_symlinking_theme', $error_message );
	}

	if ( ! symlink( $abs_theme_path, $abs_theme_symlink_path ) ) {
		if ( WPCOMSH_STOREFRONT_THEME_TYPE === $theme_type ) {
			$theme_source_folder_path = WPCOMSH_STOREFRONT_THEMES_PATH;
		} else {
			$theme_source_folder_path = WPCOMSH_PUB_THEME_TYPE === $theme_type
				? WPCOMSH_PUB_THEMES_PATH
				: WPCOMSH_PREMIUM_THEMES_PATH;
		}

		$error_message = "Can't symlink theme with slug: ${theme_slug}." .
						 "Make sure it exists in the " . $theme_source_folder_path . " directory.";

		error_log( 'WPComSH: ' . $error_message );

		return new WP_Error( 'error_symlinking_theme', $error_message );
	}

	return true;
}

/**
 * Symlinks a storefront theme.
 *
 * @param string $theme_slug
 * @return bool|WP_Error
 */
function wpcomsh_symlink_storefront_theme( $theme_slug ) {
	return wpcomsh_symlink_theme( $theme_slug, WPCOMSH_STOREFRONT_THEME_TYPE );
}

/**
 * Deletes cache of the passed theme.
 *
 * @param string $theme_slug Optional. Slug of the theme to delete cache for.
 *                           Default: Current theme.
 */
function wpcomsh_delete_theme_cache( $theme_slug = null ) {
	$theme = wp_get_theme( $theme_slug );

	if ( $theme instanceof WP_Theme) {
		$theme->cache_delete();
	}
}

/**
 * Checks whether a theme (by theme slug) is symlinked in the themes' directory.
 *
 * @param string $theme_slug The slug of a theme.
 * @return bool Whether a theme is symlinked in the themes' directory.
 */
function wpcomsh_is_theme_symlinked( $theme_slug ) {
	$theme_root  = get_theme_root();
	$theme_dir   = "$theme_root/$theme_slug";
	$site_themes = scandir( $theme_root );

	return in_array( $theme_slug, $site_themes ) && is_link( $theme_dir );
}

/**
 * Deletes a symlinked theme.
 *
 * @param string $theme_slug The slug of a theme.
 * @return bool|WP_Error True on success, WP_Error on error.
 */
function wpcomsh_delete_symlinked_theme( $theme_slug ) {
	$theme_dir = get_theme_root() . "/$theme_slug";

	if ( file_exists( $theme_dir ) && is_link( $theme_dir ) ) {
		unlink( $theme_dir );

		return true;
	}

	error_log(
		"WPComSH: Can't delete the specified symlinked theme: the path or symlink doesn't exist."
	);

	return new WP_Error(
		'error_deleting_symlinked_theme',
		"Can't delete the specified symlinked theme: the path or symlink doesn't exist."
	);
}

/**
 * Returns a theme type.
 *
 * @param string $theme_slug The slug of a theme.
 * @return false|string Theme type or false if not a wpcom theme.
 */
function wpcomsh_get_wpcom_theme_type( $theme_slug ) {
	if ( wpcomsh_is_wpcom_premium_theme( $theme_slug ) ) {
		return WPCOMSH_PREMIUM_THEME_TYPE;
	} elseif ( wpcomsh_is_wpcom_pub_theme( $theme_slug ) ) {
		return WPCOMSH_PUB_THEME_TYPE;
	}

	return false;
}

/**
 * Returns whether the theme is a child theme.
 *
 * @param string $theme_slug Slug of the theme to check. Default: Active theme.
 * @return bool
 */
function wpcomsh_is_wpcom_child_theme( $theme_slug = null ) {
	$theme = wp_get_theme( $theme_slug );

	return $theme->get_stylesheet() !== $theme->get_template();
}

/**
 * Symlinks the theme's parent if it's a child theme.
 *
 * @param string $stylesheet Theme slug.
 * @return bool|WP_Error
 */
function wpcomsh_symlink_parent_theme( $stylesheet ) {
	$theme    = wp_get_theme( $stylesheet );
	$template = $theme->get_template();

	if ( $template === $stylesheet ) {
		error_log( "WPComSH: Can't symlink parent theme. Current theme is not a child theme." );

		return false;
	}

	error_log( 'WPComSH: Symlinking parent theme.' );

	return wpcomsh_symlink_theme( $template, wpcomsh_get_wpcom_theme_type( $template ) );
}

function wpcomsh_delete_symlinked_parent_theme( $stylesheet ) {
	$theme    = wp_get_theme( $stylesheet );
	$template = $theme->get_template();

	if ( $template === $stylesheet ) {
		error_log( "WPComSH: Can't unsymlink parent theme. $stylesheet is not a child theme." );

		return false;
	}

	error_log( 'WPComSH: Unsymlinking parent theme.' );

	return wpcomsh_delete_symlinked_theme( $template );
}

/**
 * Returns whether site administrator(s) can manage (install, update, activate, etc) plugins.
 *
 * @return bool
 */
function wpcomsh_can_manage_plugins() {
	if ( WPCOMSH_PLAN_BUSINESS === wpcomsh_get_site_plan_slug() ) {
		return true;
	}

	return false;
}

/**
 * Returns whether site administrator(s) can manage (install, update, activate, etc) themes.
 *
 * @return bool
 */
function wpcomsh_can_manage_themes() {
	if ( WPCOMSH_PLAN_BUSINESS === wpcomsh_get_site_plan_slug() ) {
		return true;
	}

	return false;
}

/**
 * Retrieves the list of AT options containing things like:
 * - plan_slug
 *
 * @return array AT options or an empty array
 */
function wpcomsh_get_at_options() {
	return get_option( 'at_options', array() );
}

/**
 * Returns the slug of the site's plan.
 *
 * @return string Returns the slug of the site's plan or WPCOMSH_PLAN_BUSINESS if not known.
 */
function wpcomsh_get_site_plan_slug() {
	$at_options = wpcomsh_get_at_options();

	if ( array_key_exists( 'plan_slug', $at_options ) ) {
		return $at_options['plan_slug'];
	}

	return WPCOMSH_PLAN_BUSINESS;
}
