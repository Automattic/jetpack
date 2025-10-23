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
	if ( $prefix !== '' ) {
		$prefix .= '_';
	}

	$props = array(
		$prefix . 'theme'                => $theme->get( 'Name' ),
		$prefix . 'theme_stylesheet'     => $theme->get_stylesheet(),
		$prefix . 'theme_tier'           => null,
		$prefix . 'theme_is_block_theme' => $theme->is_block_theme(),
		$prefix . 'theme_is_retired'     => false,
	);

	// Simple sites
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM && class_exists( 'WPCom_Themes' ) ) {
		// @phan-suppress-next-line PhanUndeclaredClassMethod
		$props[ $prefix . 'theme_tier' ] = WPCom_Themes::get_theme_tier( $theme->get_stylesheet() );
		// @phan-suppress-next-line PhanUndeclaredClassMethod
		$props[ $prefix . 'theme_is_retired' ] = WPCom_Themes::is_retired( $theme->get_stylesheet() );

		return $props;
	}

	// Atomic sites
	$props[ $prefix . 'theme_tier' ] = 'community';

	if ( function_exists( 'wpcomsh_get_wpcom_themes_service_instance' ) ) {
		$wpcom_themes_service = wpcomsh_get_wpcom_themes_service_instance();
		$theme_data           = $wpcom_themes_service->get_theme( $theme->get_stylesheet() );

		if ( $theme_data !== null ) {
			$props[ $prefix . 'theme_tier' ]       = $theme_data->theme_tier ?? null;
			$props[ $prefix . 'theme_is_retired' ] = $theme_data->is_retired ?? false;
		}
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

/**
 * Record a theme upload via wp-admin.
 *
 * @param Theme_Upgrader $upgrader Upgrader instance.
 * @param array          $options  Array of upgrade options.
 * @return void
 */
function wpcom_themes_tracks_upload_theme( $upgrader, $options ) {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		// Simple sites can't upload themes with wp-admin so should never reach here,
		// but just in case, we exit early.
		return;
	}

	if ( $options['type'] === 'theme' && $options['action'] === 'install' ) {
		// Trying to distinguish between an upload and a standard install, not security sensitive.
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['action'] ) && $_GET['action'] === 'upload-theme' ) {
			$theme_slug = isset( $upgrader->result['destination_name'] )
				? $upgrader->result['destination_name']
				: '';

			if ( $theme_slug ) {
				$theme = wp_get_theme( $theme_slug );

				$theme_props            = wpcom_themes_tracks_get_theme_props( $theme );
				$theme_props['blog_id'] = get_wpcom_blog_id();
				$theme_props['source']  = 'wp-admin';
				Common\wpcom_record_tracks_event( 'wpcom_theme_upload', $theme_props );
			}
		}
	}
}
add_action( 'upgrader_process_complete', 'wpcom_themes_tracks_upload_theme', 10, 2 );
