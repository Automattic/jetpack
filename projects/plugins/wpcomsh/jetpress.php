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

function jetpress_disable_premium_themes_editing( $allcaps, $required_cap, $args ) {
	$requested_cap = $args[0];

	if ( 'edit_themes' !== $requested_cap ) {
		return $allcaps;
	}

	// Bail out for users who can't delete themes.
	if (
		! isset( $allcaps['edit_themes'] ) ||
		! $allcaps['edit_themes']
	) {
		return $allcaps;
	}

	$active_theme_slug = get_template();

	// Bail out if the active theme is not a WPCom theme.
	if ( ! jetpress_is_maybe_wpcom_theme( $active_theme_slug ) ) {
		return $allcaps;
	}

	// Bail out if the active theme is not a WPCom premium one.
	if ( ! jetpress_is_wpcom_premium_theme( $active_theme_slug ) ) {
		return $allcaps;
	}

	$active_theme_obj = wp_get_theme();

	// Bail out if the active WPCom premium theme is made by Automattic.
	if ( 'Automattic' === $active_theme_obj->get( 'Author' ) ) {
		return $allcaps;
	}

	// Finally, if the active WPCom premium theme is not made by Automattic, disable editing it.
	$allcaps['edit_themes'] = false;

	return $allcaps;
}

function jetpress_filter_cap() {
	add_filter( 'user_has_cap', 'jetpress_disable_premium_themes_editing', 10, 3 );
}
add_action( 'admin_init', 'jetpress_filter_cap' );

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
