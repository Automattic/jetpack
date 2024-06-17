<?php
/**
 * Managed themes file.
 *
 * @package wpcomsh
 */

/**
 * Filters a user's capabilities depending on specific context and/or privilege.
 *
 * @param string[] $caps Primitive capabilities required of the user.
 * @param string   $cap  Capability being checked.
 * @return string[]
 */
function wpcomsh_map_caps( $caps, $cap ) {
	if ( 'edit_themes' === $cap ) {
		$theme = wp_get_theme();

		if ( wpcomsh_is_wpcom_premium_theme( $theme->get_stylesheet() ) && 'Automattic' !== $theme->get( 'Author' ) ) {
			$caps[] = 'do_not_allow';
		}
	}

	return $caps;
}
add_action( 'map_meta_cap', 'wpcomsh_map_caps', 10, 2 );

/**
 * Removes theme delete button.
 *
 * @param array $prepared_themes Prepared themes.
 *
 * @return array
 */
function wpcomsh_remove_theme_delete_button( $prepared_themes ) {
	foreach ( $prepared_themes as $theme_slug => $theme_data ) {
		if ( wpcomsh_is_symlinked_storefront_theme( $theme_slug ) ) {
			$prepared_themes[ $theme_slug ]['actions']['delete'] = '';
		}
	}

	return $prepared_themes;
}
add_filter( 'wp_prepare_themes_for_js', 'wpcomsh_remove_theme_delete_button' );

/**
 * Returns the value for the `at_wpcom_premium_theme` option, which
 * makes sure a stylesheet is returned only if the current theme has been
 * symlinked and is a WP.com premium theme.
 *
 * @return string|bool The WP.com premium theme stylesheet or false if theme is not linked or a not premium theme.
 */
function wpcomsh_handle_atomic_premium_theme_option() {
	$stylesheet = wp_get_theme()->get_stylesheet();

	if ( wpcomsh_is_theme_symlinked( $stylesheet ) && wpcomsh_is_wpcom_premium_theme( $stylesheet ) ) {
		return sprintf( 'premium/%s', $stylesheet );
	}

	return false;
}
add_filter( 'pre_option_at_wpcom_premium_theme', 'wpcomsh_handle_atomic_premium_theme_option' );

/**
 * Symlinks WP.com themes instead of downloading them.
 *
 * @param bool   $skip_download_filter_result Whether to skip the standard method of downloading and validating a WP.com theme.
 * @param string $theme_slug                  Theme slug. If it is a WP.com theme it should be suffixed with `-wpcom`.
 *
 * @return bool|\WP_Error
 */
function wpcomsh_jetpack_wpcom_theme_skip_download( $skip_download_filter_result, $theme_slug ) {
	$theme_type = wpcomsh_get_wpcom_theme_type( $theme_slug );

	// If we are dealing with a non WPCom theme, don't interfere.
	if ( ! $theme_type ) {
		return false;
	}

	if ( wpcomsh_is_theme_symlinked( $theme_slug ) ) {
		error_log( "WPComSH: WP.com theme with slug: {$theme_slug} is already installed/symlinked." ); //phpcs:ignore

		return new WP_Error( 'wpcom_theme_already_installed', 'The WP.com theme is already installed/symlinked.' );
	}

	$was_theme_symlinked = wpcomsh_symlink_theme( $theme_slug, $theme_type );

	if ( is_wp_error( $was_theme_symlinked ) ) {
		return $was_theme_symlinked;
	}

	wpcomsh_delete_theme_cache( $theme_slug );

	// Skip the theme installation as we've "installed" (symlinked) it manually above.
	add_filter(
		'jetpack_wpcom_theme_install',
		function () use ( $was_theme_symlinked ) {
			return $was_theme_symlinked;
		},
		10,
		2
	);

	// If the installed WPCom theme is a child theme, we need to symlink its parent theme as well.
	if (
		wpcomsh_is_wpcom_child_theme( $theme_slug ) &&
		! wpcomsh_is_theme_symlinked( wp_get_theme( $theme_slug )->get_template() )
	) {
		$was_parent_theme_symlinked = wpcomsh_symlink_parent_theme( $theme_slug );

		if ( ! $was_parent_theme_symlinked ) {
			return new WP_Error( 'wpcom_theme_installation_failed', "Can't install specified WP.com theme. Check error log for more details." );
		}
	}

	return true;
}
add_filter( 'jetpack_wpcom_theme_skip_download', 'wpcomsh_jetpack_wpcom_theme_skip_download', 10, 2 );

/**
 * Un-symlinks WP.com themes instead of deleting them.
 *
 * @param bool   $use_alternative_delete_method Whether to use the alternative method of deleting a WP.com theme.
 * @param string $theme_slug                    Theme slug. If it is a WP.com theme it should be suffixed with `-wpcom`.
 *
 * @return bool
 */
function wpcomsh_jetpack_wpcom_theme_delete( $use_alternative_delete_method, $theme_slug ) {
	if ( ! wpcomsh_is_wpcom_theme( $theme_slug ) || ! wpcomsh_is_theme_symlinked( $theme_slug ) ) {
		return false;
	}

	$theme = wp_get_theme( $theme_slug );
	if ( ! $theme->exists() ) {
		return false;
	}

	$num_child_themes = wpcomsh_count_child_themes( $theme->get_stylesheet() );
	if ( $num_child_themes > 0 ) {
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions
		error_log( 'WPComSH: Cannot remove parent theme. It still has installed child themes.' );
		return false;
	}

	$is_child_theme = wpcomsh_is_wpcom_child_theme( $theme_slug );

	/*
	 * Remember how many child themes there are before we delete this one.
	 * That way, we have the same count later, whether the previous themes list was cached or not.
	 */
	$num_themes_with_same_parent = 0;
	if ( $is_child_theme ) {
		$num_themes_with_same_parent = wpcomsh_count_child_themes( $theme->get_template() );
	}

	$was_theme_unsymlinked = wpcomsh_delete_symlinked_theme( $theme_slug );
	if ( is_wp_error( $was_theme_unsymlinked ) ) {
		return $was_theme_unsymlinked;
	}

	// If the theme was an only child, we need to unsymlink the parent theme as well.
	if ( $is_child_theme && $num_themes_with_same_parent === 1 ) {
		$parent_theme = $theme->get_template();
		if ( wpcomsh_is_wpcom_theme( $parent_theme ) ) {
			// phpcs:ignore WordPress.PHP.DevelopmentFunctions
			error_log( 'WPComSH: Unsymlinking parent theme.' );

			/*
			 * Ignore result because the child theme is already removed,
			 * and any problem should be logged by the deletion function.
			 */
			wpcomsh_delete_symlinked_theme( $parent_theme );
		}
	}

	return true;
}
add_filter( 'jetpack_wpcom_theme_delete', 'wpcomsh_jetpack_wpcom_theme_delete', 10, 2 );

/**
 * When a request is made to Jetpack Themes API, we need to distinguish between a WP.com theme
 * and a WP.org theme in the response. This function adds/modifies the `theme_uri` field of a theme
 * changing it to `https://wordpress.com/theme/{$theme_slug}` if a theme is a WP.com one.
 *
 * @param array $formatted_theme Array containing the Jetpack Themes API data to be sent to WP.com.
 *
 * @return array The original or modified theme info array.
 */
function wpcomsh_add_wpcom_suffix_to_theme_endpoint_response( $formatted_theme ) {
	if ( empty( $formatted_theme['id'] ) ) {
		return $formatted_theme;
	}

	$theme_slug    = $formatted_theme['id'];
	$is_storefront = 'storefront' === $theme_slug;

	if ( wpcomsh_is_theme_symlinked( $theme_slug ) && ! $is_storefront ) {
		$formatted_theme['theme_uri'] = "https://wordpress.com/theme/{$theme_slug}";
	}

	return $formatted_theme;
}
add_filter( 'jetpack_format_theme_details', 'wpcomsh_add_wpcom_suffix_to_theme_endpoint_response' );

/**
 * Load a WordPress.com theme compat file, if it exists.
 */
function wpcomsh_load_theme_compat_file() {
	if ( defined( 'WP_INSTALLING' ) && 'wp-activate.php' !== $GLOBALS['pagenow'] ) {
		return;
	}

	// Many wpcom.php files call $themecolors directly. Ease the pain.
	global $themecolors; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- included files might need the global.

	$template_path   = get_template_directory();
	$stylesheet_path = get_stylesheet_directory();
	$file            = '/inc/wpcom.php';

	// Look also in /includes as alternate location, since premium theme partners may use that convention.
	if ( ! file_exists( $template_path . $file ) && ! file_exists( $stylesheet_path . $file ) ) {
		$file = '/includes/wpcom.php';
	}

	// Include 'em. Child themes first, just like core.
	if ( $template_path !== $stylesheet_path && file_exists( $stylesheet_path . $file ) ) {
		include_once $stylesheet_path . $file;
	}

	if ( file_exists( $template_path . $file ) ) {
		include_once $template_path . $file;
	}
}
add_action( 'after_setup_theme', 'wpcomsh_load_theme_compat_file', 0 ); // Hook early so that after_setup_theme can still be used at default priority.

/**
 * Provides a favicon fallback in case it's undefined.
 *
 * @param string $url Site Icon URL.
 * @return string Site Icon URL.
 */
function wpcomsh_site_icon_url( $url ) {
	if ( empty( $url ) ) {
		$url = 'https://s0.wp.com/i/webclip.png';
	}

	return $url;
}
add_filter( 'get_site_icon_url', 'wpcomsh_site_icon_url' );
