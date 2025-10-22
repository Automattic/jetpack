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

	$wpcom_themes_service = wpcomsh_get_wpcom_themes_service_instance();

	$old = $wpcom_themes_service->get_theme( $old_theme->stylesheet );
	$new = $wpcom_themes_service->get_theme( $new_theme->stylesheet );

	$event_props = array(
		'blog_id'                  => get_wpcom_blog_id(),
		'new_theme'                => $new->name,
		'new_theme_stylesheet'     => $new->slug,
		'new_theme_tier'           => $new->theme_tier,
		'new_theme_is_block_theme' => $new->block_theme,
		'old_theme'                => $old->name,
		'old_theme_stylesheet'     => $old->slug,
		'old_theme_tier'           => $old->theme_tier,
		'old_theme_is_block_theme' => $old->block_theme,
	);

	Common\wpcom_record_tracks_event( 'wpcom_theme_switch', $event_props );
}
add_action( 'switch_theme', 'wpcom_themes_tracks_switch_theme', 12, 3 );
