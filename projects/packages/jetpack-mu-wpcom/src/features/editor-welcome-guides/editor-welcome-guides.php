<?php
/**
 * Once-per-user editor welcome guides: merges the guides WordPress.com records as dismissed
 * for the user into each site's editor preferences, and reports newly dismissed ones back.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

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
 * The preferences scope of the editor screen being loaded.
 *
 * @return string|null The scope, or null when the request is not an editor screen.
 */
function wpcom_editor_welcome_guides_current_editor_scope(): ?string {
	global $pagenow;

	$scopes = array(
		'post.php'        => 'core/edit-post',
		'post-new.php'    => 'core/edit-post',
		'site-editor.php' => 'core/edit-site',
		'widgets.php'     => 'core/edit-widgets',
		'customize.php'   => 'core/customize-widgets',
	);

	return is_string( $pagenow ) ? $scopes[ $pagenow ] ?? null : null;
}

/**
 * Records that a guide was kept from opening because the user dismissed it on another site.
 *
 * @param string $scope Preferences scope.
 * @param string $guide Guide key.
 * @return void
 */
function wpcom_editor_welcome_guides_record_suppressed( string $scope, string $guide ): void {
	// The preferences are read several times per request; count each guide once.
	static $recorded = array();

	if ( isset( $recorded[ "$scope/$guide" ] ) ) {
		return;
	}
	$recorded[ "$scope/$guide" ] = true;

	Automattic\Jetpack\Jetpack_Mu_Wpcom\Common\wpcom_record_tracks_event(
		'wpcom_editor_welcome_guide_suppressed',
		array(
			'scope'    => $scope,
			'guide'    => $guide,
			'platform' => ( new Automattic\Jetpack\Status\Host() )->is_wpcom_simple() ? 'simple' : 'atomic',
		)
	);
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

	if ( null !== $value || $is_reading || wpcom_editor_welcome_guides_meta_key() !== $meta_key ) {
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

	// Only a guide of the editor being loaded, for the user loading it, would have opened.
	$editor_scope = (int) $user_id === get_current_user_id() ? wpcom_editor_welcome_guides_current_editor_scope() : null;

	$changed = false;
	foreach ( $dismissed as $scope => $guides ) {
		foreach ( (array) $guides as $guide ) {
			if ( false !== ( $preferences[ $scope ][ $guide ] ?? null ) ) {
				$preferences[ $scope ][ $guide ] = false;
				$changed                         = true;

				if ( $scope === $editor_scope ) {
					wpcom_editor_welcome_guides_record_suppressed( $scope, (string) $guide );
				}
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
	if ( wpcom_editor_welcome_guides_meta_key() !== $meta_key || ! is_array( $value ) ) {
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
