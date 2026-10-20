<?php
/**
 * Once-per-user editor welcome guides: merges the guides WordPress.com records as dismissed
 * for the user into each site's editor preferences, and reports newly dismissed ones back.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

/**
 * Whether the feature is enabled for the current site.
 *
 * @return bool
 */
function wpcom_editor_welcome_guides_is_enabled(): bool {
	return wpcom_has_blog_sticker( 'editor-welcome-guides-per-user', get_wpcom_blog_id() );
}

/**
 * The current site's editor preferences meta key.
 *
 * @return string
 */
function wpcom_editor_welcome_guides_meta_key(): string {
	global $wpdb;

	return $wpdb->get_blog_prefix() . 'persisted_preferences';
}

/**
 * When the editor preferences are read, marks the guides the user already dismissed
 * on another site as dismissed on this one too.
 *
 * @param mixed  $value    Value another filter already supplied, or null.
 * @param int    $user_id  User ID.
 * @param string $meta_key Meta key being read.
 * @return mixed The adjusted preferences wrapped in an array, or `$value` unchanged.
 */
function wpcom_editor_welcome_guides_filter_preferences( $value, $user_id, $meta_key ) {
	static $is_reading = false;

	if ( null !== $value || $is_reading || wpcom_editor_welcome_guides_meta_key() !== $meta_key || ! wpcom_editor_welcome_guides_is_enabled() ) {
		return $value;
	}

	/**
	 * Filters the guides the user has dismissed on any site.
	 *
	 * @param array $dismissed Map of preferences scope to guide keys.
	 * @param int   $user_id   User ID.
	 */
	$dismissed = apply_filters( 'wpcom_editor_welcome_guides_dismissed', array(), $user_id );
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
			if ( false !== ( $preferences[ $scope ][ $guide ] ?? null ) ) {
				$preferences[ $scope ][ $guide ] = false;
				$changed                         = true;
			}
		}
	}

	if ( $changed ) {
		// Newer than the browser's localStorage copy, so the editor uses this one.
		$preferences['_modified'] = gmdate( 'Y-m-d\TH:i:s.v\Z' );
	}

	// get_user_meta( $user_id, $meta_key, true ) returns the first element of a filtered array,
	// so without this wrap the editor would get $preferences[0], which does not exist.
	return array( $preferences );
}
add_filter( 'get_user_metadata', 'wpcom_editor_welcome_guides_filter_preferences', 1, 3 );

/**
 * Reports the guides turned off in the editor preferences just saved.
 *
 * @param int    $meta_id  Meta ID.
 * @param int    $user_id  User ID.
 * @param string $meta_key Meta key.
 * @param mixed  $value    Meta value.
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
	 * Fires when the user has turned welcome guides off.
	 *
	 * @param int   $user_id   User ID.
	 * @param array $dismissed Map of preferences scope to guide keys.
	 */
	do_action( 'wpcom_editor_welcome_guides_dismiss', $user_id, $dismissed );
}
add_action( 'added_user_meta', 'wpcom_editor_welcome_guides_record_preferences', 10, 4 );
add_action( 'updated_user_meta', 'wpcom_editor_welcome_guides_record_preferences', 10, 4 );
