<?php
/**
 * WordPress.com Theme Tracking
 *
 * Add Tracks events to the wp-admin theme screens.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
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
 * Work out which surface a theme install or switch started from.
 *
 * @return string One of marketplace-tab, add-themes, themes, customizer, api, cli or other.
 */
function wpcom_themes_tracks_get_origin() {
	if ( Constants::is_true( 'WP_CLI' ) ) {
		return 'cli';
	}

	if ( Constants::is_true( 'REST_API_REQUEST' ) ) {
		return 'api';
	}

	// This only labels the event and authorizes nothing, so nonces are not checked.
	// phpcs:disable WordPress.Security.NonceVerification,WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$marker      = $_REQUEST['wpcom_themes_origin'] ?? '';
	$post_action = $_POST['action'] ?? '';
	$customize   = $_POST['wp_customize'] ?? '';
	$get_action  = $_GET['action'] ?? '';
	// phpcs:enable WordPress.Security.NonceVerification,WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

	// An array arrives when `_wp_http_referer[]` is sent.
	$referer      = wp_get_raw_referer();
	$referer      = is_string( $referer ) ? $referer : '';
	$referer_path = (string) wp_parse_url( $referer, PHP_URL_PATH );
	wp_parse_str( (string) wp_parse_url( $referer, PHP_URL_QUERY ), $referer_query );

	// On Simple, Add Themes is WordPress.com's own screen on themes.php.
	$from_add_themes = substr( $referer_path, -strlen( 'theme-install.php' ) ) === 'theme-install.php'
		|| ( substr( $referer_path, -strlen( '/themes.php' ) ) === '/themes.php' && ( $referer_query['page'] ?? '' ) === 'wpcom-install-theme' );

	if ( $marker === 'marketplace-tab' ) {
		return 'marketplace-tab';
	}

	if ( $from_add_themes && ( $referer_query['browse'] ?? '' ) === 'wpcom' ) {
		return 'marketplace-tab';
	}

	if ( $post_action === 'customize_save' || $customize === 'on' ) {
		return 'customizer';
	}

	if ( $post_action === 'install-theme' ) {
		return 'add-themes';
	}

	if ( $get_action === 'activate' ) {
		if ( $from_add_themes ) {
			return 'add-themes';
		}

		if ( substr( $referer_path, -strlen( 'themes.php' ) ) === 'themes.php' ) {
			return 'themes';
		}
	}

	return 'other';
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
	if ( ! is_wpcom_user() ) {
		return;
	}

	$old_theme_props = wpcom_themes_tracks_get_theme_props( $old_theme, 'old' );
	$new_theme_props = wpcom_themes_tracks_get_theme_props( $new_theme, 'new' );

	$event_props = array_merge(
		array( 'blog_id' => get_wpcom_blog_id() ),
		$old_theme_props,
		$new_theme_props,
		array( 'origin' => wpcom_themes_tracks_get_origin() )
	);

	Common\wpcom_record_tracks_event( 'wpcom_theme_switch', $event_props );
}
add_action( 'switch_theme', 'wpcom_themes_tracks_switch_theme', 12, 3 );

/**
 * Work out the source and type of a theme install or update.
 *
 * @param string $hook_action The `action` from the upgrader hook data.
 * @return array{source: string, type: string}
 */
function wpcom_themes_tracks_install_source_and_type( $hook_action ) {
	$install_props = array(
		'source' => '', // Intentionally left empty for debugging purposes.
		'type'   => 'upload',
	);

	// Trying to distinguish between a manual upload vs a standard install or upgrade. It's not security sensitive.
	// phpcs:disable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
	$action    = $_GET['action'] ?? '';
	$overwrite = $_GET['overwrite'] ?? '';
	// phpcs:enable WordPress.Security.NonceVerification.Recommended,WordPress.Security.ValidatedSanitizedInput.MissingUnslash,WordPress.Security.ValidatedSanitizedInput.InputNotSanitized

	if ( $hook_action === 'install' && ! $action ) {
		// Install theme via wp-admin UI
		$install_props['source'] = 'wp-admin';
		$install_props['type']   = 'install';
	} elseif ( $hook_action === 'install' && $action === 'upload-theme' && ! $overwrite ) {
		// Upload a theme via wp-admin (new theme)
		$install_props['source'] = 'wp-admin';
		$install_props['type']   = 'upload';
	} elseif ( $hook_action === 'install' && $action === 'upload-theme' && $overwrite === 'update-theme' ) {
		// Upload a theme via wp-admin (existing theme)
		$install_props['source'] = 'wp-admin';
		$install_props['type']   = 'update';
	} elseif ( $hook_action === 'update' && $action === 'do-theme-upgrade' ) {
		// Update theme via update-core.php
		$install_props['source'] = 'wp-admin';
		$install_props['type']   = 'bulk-update';
	}

	return $install_props;
}

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

	if ( ! is_wpcom_user() ) {
		return;
	}

	$theme_slug = $upgrader->result['destination_name'] ?? '';

	if ( ! $theme_slug ) {
		return;
	}

	$theme       = wp_get_theme( $theme_slug );
	$theme_props = wpcom_themes_tracks_get_theme_props( $theme );

	$event_props = array_merge(
		array( 'blog_id' => get_wpcom_blog_id() ),
		$theme_props,
		wpcom_themes_tracks_install_source_and_type( $hook_extra['action'] ),
		array( 'origin' => wpcom_themes_tracks_get_origin() )
	);

	Common\wpcom_record_tracks_event( 'wpcom_theme_install', $event_props );
}
add_action( 'upgrader_process_complete', 'wpcom_themes_tracks_install_theme', 10, 2 );

/**
 * Record the install of a WP.com theme, which is symlinked instead of going through the upgrader.
 *
 * @param string $theme_slug Theme slug.
 * @return void
 */
function wpcom_themes_tracks_install_wpcom_theme( $theme_slug ) {
	if ( Constants::is_true( 'IS_WPCOM' ) || ! is_wpcom_user() ) {
		return;
	}

	$event_props = array_merge(
		array( 'blog_id' => get_wpcom_blog_id() ),
		wpcom_themes_tracks_get_theme_props( wp_get_theme( $theme_slug ) ),
		wpcom_themes_tracks_install_source_and_type( 'install' ),
		array( 'origin' => wpcom_themes_tracks_get_origin() )
	);

	Common\wpcom_record_tracks_event( 'wpcom_theme_install', $event_props );
}
add_action( 'wpcomsh_wpcom_theme_installed', 'wpcom_themes_tracks_install_wpcom_theme' );
