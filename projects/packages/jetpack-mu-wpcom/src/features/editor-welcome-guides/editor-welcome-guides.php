<?php
/**
 * Once-per-user editor welcome guides.
 *
 * WordPress keeps the welcome guide flags in the blog-prefixed `persisted_preferences`
 * user meta, so every guide returns on every new site. On WordPress.com a user has one
 * global record of dismissed guides instead. This feature merges that record into the
 * per-site preferences when they are read, and reports newly dismissed guides when they
 * are saved. The record itself is provided through two hooks:
 *
 * - `wpcom_editor_welcome_guides_dismissed` (filter): returns the user's dismissed
 *   guides as a map of `core/preferences` scope to guide keys.
 * - `wpcom_editor_welcome_guides_dismiss` (action): records newly dismissed guides.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

require_once __DIR__ . '/../../utils.php';

/**
 * Whether the feature is enabled for the current site.
 *
 * @return bool
 */
function wpcom_editor_welcome_guides_is_enabled(): bool {
	return wpcom_has_blog_sticker( 'editor-welcome-guides-per-user', get_wpcom_blog_id() );
}

/**
 * The user meta key core stores the editor preferences of the current site under.
 *
 * @return string
 */
function wpcom_editor_welcome_guides_meta_key(): string {
	global $wpdb;

	return $wpdb->get_blog_prefix() . 'persisted_preferences';
}

/**
 * `get_user_metadata` filter: turns the user's globally dismissed guides off in the
 * per-site editor preferences.
 *
 * @param mixed  $value    The value `get_metadata()` should return, or null to continue.
 * @param int    $user_id  User ID.
 * @param string $meta_key Meta key.
 * @return mixed
 */
function wpcom_editor_welcome_guides_filter_preferences( $value, $user_id, $meta_key ) {
	static $is_reading = false;

	if ( null !== $value || $is_reading || wpcom_editor_welcome_guides_meta_key() !== $meta_key || ! wpcom_editor_welcome_guides_is_enabled() ) {
		return $value;
	}

	/**
	 * Filters the guides the user has dismissed on any of their sites.
	 *
	 * @param array $dismissed Map of `core/preferences` scope to a list of guide keys.
	 * @param int   $user_id   User ID.
	 */
	$dismissed = apply_filters( 'wpcom_editor_welcome_guides_dismissed', array(), (int) $user_id );
	if ( empty( $dismissed ) || ! is_array( $dismissed ) ) {
		return $value;
	}

	$is_reading  = true;
	$preferences = get_user_meta( $user_id, $meta_key, true );
	$is_reading  = false;

	if ( ! is_array( $preferences ) ) {
		$preferences = array();
	}

	$changed = false;
	foreach ( $dismissed as $scope => $guides ) {
		foreach ( (array) $guides as $guide ) {
			if ( ! isset( $preferences[ $scope ][ $guide ] ) || false !== $preferences[ $scope ][ $guide ] ) {
				$preferences[ $scope ][ $guide ] = false;
				$changed                         = true;
			}
		}
	}

	if ( $changed ) {
		// Newer than the browser's localStorage copy, so the editor uses this one.
		$preferences['_modified'] = gmdate( 'Y-m-d\TH:i:s.v\Z' );
	}

	// get_metadata_raw() returns the first element for single reads.
	return array( $preferences );
}
add_filter( 'get_user_metadata', 'wpcom_editor_welcome_guides_filter_preferences', 1, 3 );

/**
 * `added_user_meta` and `updated_user_meta` action: reports the guides that are turned
 * off in the editor preferences just saved for the current site.
 *
 * @param int    $meta_id  Meta ID.
 * @param int    $user_id  User ID.
 * @param string $meta_key Meta key.
 * @param mixed  $value    The meta value just saved.
 * @return void
 */
function wpcom_editor_welcome_guides_record_preferences( $meta_id, $user_id, $meta_key, $value ) {
	if ( wpcom_editor_welcome_guides_meta_key() !== $meta_key || ! is_array( $value ) || ! wpcom_editor_welcome_guides_is_enabled() ) {
		return;
	}

	$dismissed = array();
	foreach ( $value as $scope => $preferences ) {
		if ( ! is_string( $scope ) || ! str_starts_with( $scope, 'core/' ) || ! is_array( $preferences ) ) {
			continue;
		}

		foreach ( $preferences as $key => $preference ) {
			if ( is_string( $key ) && str_starts_with( $key, 'welcomeGuide' ) && false === $preference ) {
				$dismissed[ $scope ][] = $key;
			}
		}
	}

	if ( empty( $dismissed ) ) {
		return;
	}

	/**
	 * Fires when the user has turned welcome guides off in the editor preferences.
	 *
	 * @param int   $user_id   User ID.
	 * @param array $dismissed Map of `core/preferences` scope to a list of guide keys.
	 */
	do_action( 'wpcom_editor_welcome_guides_dismiss', (int) $user_id, $dismissed );
}
add_action( 'added_user_meta', 'wpcom_editor_welcome_guides_record_preferences', 10, 4 );
add_action( 'updated_user_meta', 'wpcom_editor_welcome_guides_record_preferences', 10, 4 );
