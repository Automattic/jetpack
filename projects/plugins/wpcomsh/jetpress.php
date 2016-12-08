<?php
/**
 * Plugin Name: Jetpress
 * Plugin URI: https://github.com/Automattic/at-pressable-themes
 * Description: Like Jetpack for WPCom sites transferred to Pressable.
 * Version: 1.0
 * Author: Automattic
 * Author URI: http://automattic.com/
 */

require_once( 'constants.php' );
require_once( 'functions.php' );

function jetpress_register_theme_hooks() {
	add_filter(
		'jetpack_wpcom_theme_skip_download',
		'jetpress_jetpack_wpcom_theme_skip_download',
		10,
		2
	);

	add_filter(
		'jetpack_wpcom_theme_delete',
		'jetpress_jetpack_wpcom_theme_delete',
		10,
		2
	);
}
add_action( 'init', 'jetpress_register_theme_hooks' );

/**
 * Filters a user's capabilities depending on specific context and/or privilege.
 *
 * @param array  $required_caps Returns the user's actual capabilities.
 * @param string $cap           Capability name.
 * @return array Primitive caps.
 */
function jetpress_map_caps( $required_caps, $cap ) {

	switch ( $cap ) {
		case 'edit_themes':
			$theme = wp_get_theme();
			if ( jetpress_is_wpcom_premium_theme( $theme->get_stylesheet() ) && 'Automattic' !== $theme->get( 'Author' ) ) {
				$required_caps[] = 'do_not_allow';
			}
			break;
	}

	return $required_caps;
}
add_action( 'map_meta_cap', 'jetpress_map_caps', 10, 2 );

function jetpress_remove_theme_delete_button( $prepared_themes ) {
	foreach ( $prepared_themes as $theme_slug => $theme_data ) {
		if ( jetpress_is_maybe_wpcom_theme( $theme_slug ) ) {
			$prepared_themes[ $theme_slug ]['actions']['delete'] = '';
		}
	}

	return $prepared_themes;
}
add_filter( 'wp_prepare_themes_for_js', 'jetpress_remove_theme_delete_button' );


function jetpress_jetpack_wpcom_theme_skip_download( $result, $theme_slug ) {
	$theme_type = jetpress_get_wpcom_theme_type( $theme_slug );

	// If we are dealing with a non WPCom theme, don't interfere.
	if ( ! $theme_type ) {
		return false;
	}

	if ( jetpress_is_theme_symlinked( $theme_slug ) ) {
		return false;
	}

	$was_theme_symlinked = jetpress_symlink_theme( $theme_slug, $theme_type );

	if ( is_wp_error( $was_theme_symlinked ) ) {
		return $was_theme_symlinked;
	}

	jetpress_delete_theme_cache( $theme_slug );

	// Skip the theme installation as we've "installed" (symlinked) it manually above.
	add_filter(
		'jetpack_wpcom_theme_install',
		function() use( $was_theme_symlinked ) {
			return $was_theme_symlinked;
		},
		10,
		2
	);

	// If the installed WPCom theme is a child theme, we need to symlink its parent theme
	// as well.
	if ( jetpress_is_wpcom_child_theme( $theme_slug ) ) {
		$was_parent_theme_symlinked = jetpress_symlink_parent_theme( $theme_slug );

		if ( ! $was_parent_theme_symlinked ) {
			return new WP_Error(
				'wpcom_theme_installation_falied',
				"Can't install specified WPCom theme. Check error log for more details."
			);
		}
	}

	return true;
}

function jetpress_jetpack_wpcom_theme_delete( $result, $theme_slug ) {
	if (
		! jetpress_is_wpcom_theme( $theme_slug ) ||
		! jetpress_is_theme_symlinked( $theme_slug )
	) {
		return false;
	}

	$result = jetpress_delete_symlinked_theme( $theme_slug );

	return $result;
}
