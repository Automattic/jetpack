<?php
/**
 * WordPress.com Theme Tracking
 *
 * Add Tracks events to the wp-admin theme screens.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;

/**
 * Get theme properties for Tracks event.
 *
 * @param WP_Theme $theme  Theme object.
 * @param string   $prefix Prefix for the property keys.
 * @return array Associative array of theme properties.
 */
function wpcom_themes_tracks_get_theme_props( $theme, $prefix = '' ) {
	if ( ! function_exists( 'wpcomsh_get_wpcom_themes_service_instance' ) ) {
		return array();
	}

	$wpcom_themes_service = wpcomsh_get_wpcom_themes_service_instance();
	$theme_data           = $wpcom_themes_service->get_theme( $theme->stylesheet );

	if ( $prefix !== '' ) {
		$prefix .= '_';
	}

	$props = array();
	if ( $theme_data === null ) {
		$props[ $prefix . 'theme' ]                = $theme->get( 'Name' );
		$props[ $prefix . 'theme_stylesheet' ]     = $theme->get_stylesheet();
		$props[ $prefix . 'theme_tier' ]           = 'community';
		$props[ $prefix . 'theme_is_block_theme' ] = $theme->is_block_theme();
		$props[ $prefix . 'theme_is_retired' ]     = false;
	} else {
		$props[ $prefix . 'theme' ]                = $theme_data->name;
		$props[ $prefix . 'theme_stylesheet' ]     = $theme_data->slug;
		$props[ $prefix . 'theme_tier' ]           = $theme_data->theme_tier;
		$props[ $prefix . 'theme_is_block_theme' ] = $theme_data->block_theme;
		$props[ $prefix . 'theme_is_retired' ]     = $theme_data->is_retired;
	}

	return $props;
}

/**
 * Record a theme switch.
 *
 * @todo There is already a theme switch event for Simple sites. It should be removed in favor of this one.
 *
 * @param string   $new_theme_name New theme name.
 * @param WP_Theme $new_theme      New theme object.
 * @param WP_Theme $old_theme      Old theme object.
 */
function wpcom_themes_tracks_switch_theme( $new_theme_name, $new_theme, $old_theme ) {
	if ( ! function_exists( 'wpcomsh_get_wpcom_themes_service_instance' ) ) {
		return;
	}

	$old_theme_props = wpcom_themes_tracks_get_theme_props( $old_theme, 'old' );
	$new_theme_props = wpcom_themes_tracks_get_theme_props( $new_theme, 'new' );

	$event_props = array_merge(
		array( 'blog_id' => get_wpcom_blog_id() ),
		$old_theme_props,
		$new_theme_props
	);

	Common\wpcom_record_tracks_event( 'wpcom_theme_switch', $event_props );
}
add_action( 'switch_theme', 'wpcom_themes_tracks_switch_theme', 12, 3 );
