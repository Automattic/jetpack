<?php

namespace AT_Pressable\Themes;

add_filter( 'wp_prepare_themes_for_js', __NAMESPACE__ . '\\remove_delete_btn', 10 );

function remove_delete_btn( $prepared_themes ) {
	foreach ( $prepared_themes as $theme_slug => $theme_data ) {
		if ( ! is_wpcom_theme_quick( $theme_slug ) ) {
			continue;
		}

		$prepared_themes[ $theme_slug ]['actions']['delete'] = '';
	}

	return $prepared_themes;
}

/**
 * Returns whether a theme is a WPCom one or not (ie installed/downloaded from wp.com).
 *
 * Note: it checks whether the theme slug ends in `-wpcom` and if yes, it assumes it's a WPCom theme.
 * However, if a custom (uploaded) theme also contains this prefix, a user won't be able to delete it.
 * We could use the `is_wpcom_theme` method from the `WPCom_Themes_Manager` which is more reliable but it's also much
 * slower. This would show especially for users with many installed themes.
 *
 * @param string $theme_slug slug of an installed theme
 *
 * @return bool              whether the passed in theme is a WPCom one
 */
function is_wpcom_theme_quick( $theme_slug ) {
	return substr( $theme_slug, -6 ) === '-wpcom';
}
