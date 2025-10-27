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
 * @return void
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
 * Record a theme install via wp-admin.
 *
 * @param Theme_Upgrader $upgrader   Upgrader instance.
 * @param array          $hook_extra Upgrade data.
 * @return void
 */
function wpcom_themes_tracks_install_theme( $upgrader, $hook_extra ) {
	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		// Simple sites can't install themes with wp-admin so should never reach here,
		// but just in case, we exit early.
		return;
	}

	if ( ! isset( $hook_extra['type'] ) || $hook_extra['type'] !== 'theme' || ! isset( $hook_extra['action'] ) ) {
		return;
	}

	$theme_slug = $upgrader->result['destination_name'] ?? '';

	if ( ! $theme_slug ) {
		return;
	}

	$theme         = wp_get_theme( $theme_slug );
	$theme_props   = wpcom_themes_tracks_get_theme_props( $theme );
	$install_props = array(
		'source' => '', // Intentionally left empty for debugging purposes.
		'type'   => 'upload',
	);

	// Trying to distinguish between a manual upload vs a standard install or upgrade. It's not security sensitive.
	// phpcs:disable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$action    = $_GET['action'] ?? '';
	$overwrite = $_GET['overwrite'] ?? '';
	// phpcs:enable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

	if ( $hook_extra['action'] === 'install' && ! $action ) {
		// Install theme via wp-admin UI
		$install_props['source'] = 'wp-admin';
		$install_props['type']   = 'install';
	} elseif ( $hook_extra['action'] === 'install' && $action === 'upload-theme' && ! $overwrite ) {
		// Upload a theme via wp-admin (new theme)
		$install_props['source'] = 'wp-admin';
		$install_props['type']   = 'upload';
	} elseif ( $hook_extra['action'] === 'install' && $action === 'upload-theme' && $overwrite === 'update-theme' ) {
		// Upload a theme via wp-admin (existing theme)
		$install_props['source'] = 'wp-admin';
		$install_props['type']   = 'update';
	} elseif ( $hook_extra['action'] === 'update' && $action === 'do-theme-upgrade' ) {
		// Update theme via update-core.php
		$install_props['source'] = 'wp-admin';
		$install_props['type']   = 'bulk-update';
	}

	$event_props = array_merge(
		array( 'blog_id' => get_wpcom_blog_id() ),
		$theme_props,
		$install_props
	);

	Common\wpcom_record_tracks_event( 'wpcom_theme_install', $event_props );
}
add_action( 'upgrader_process_complete', 'wpcom_themes_tracks_install_theme', 10, 2 );
