<?php
/**
 * Plugin Name: AT Pressable Themes
 * Plugin URI: https://github.com/Automattic/at-pressable-themes
 * Description: Manages WPCom themes on Pressable sites.
 * Version: 1.0
 * Author: Automattic
 * Author URI: http://automattic.com/
 */

function at_pressable_themes_init() {
	require_once( 'constants.php' );
	require_once( 'class.wpcom-themes-manager.php' );

	WPCom_Themes_Manager::init();
}
add_action( 'init', 'at_pressable_themes_init' );

function at_pressable_disable_premium_themes_editing( $allcaps, $required_cap, $args ) {
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
	if ( ! at_pressable_maybe_wpcom_theme( $active_theme_slug ) ) {
		return $allcaps;
	}

	// Bail out if the active theme is not a WPCom premium one.
	if ( ! WPCom_Themes_Manager::is_wpcom_premium_theme( $active_theme_slug ) ) {
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

function at_pressable_filter_cap() {
	add_filter( 'user_has_cap', 'at_pressable_disable_premium_themes_editing', 10, 3 );
}
add_action( 'admin_init', 'at_pressable_filter_cap' );

function at_pressable_remove_theme_delete_button( $prepared_themes ) {
	foreach ( $prepared_themes as $theme_slug => $theme_data ) {
		if ( at_pressable_maybe_wpcom_theme( $theme_slug ) ) {
			$prepared_themes[ $theme_slug ]['actions']['delete'] = '';
		}
	}

	return $prepared_themes;
}
add_filter( 'wp_prepare_themes_for_js', 'at_pressable_remove_delete_button', 10 );

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
function at_pressable_maybe_wpcom_theme( $theme_slug ) {
	return substr( $theme_slug, -6 ) === '-wpcom';
}
