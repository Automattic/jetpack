<?php
/**
 * Atomic side of the once-per-user editor welcome guides: answers the shared hooks from a
 * per-site copy of the user's WordPress.com record, refreshed when an editor screen loads.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Connection\Client;

/**
 * User meta holding the copy of the record: `checked` timestamp and `dismissed` map.
 */
const WPCOM_EDITOR_WELCOME_GUIDES_CACHE_META = 'wpcom_editor_welcome_guides';

/**
 * How long the copy is served without asking WordPress.com again, even on editor screens.
 */
const WPCOM_EDITOR_WELCOME_GUIDES_CACHE_TTL = 5 * MINUTE_IN_SECONDS;

/**
 * Whether the request renders one of the editors. Only these page loads may wait for
 * WordPress.com; heartbeats, REST calls and other admin pages read the copy as it is.
 *
 * @return bool
 */
function wpcom_editor_welcome_guides_atomic_is_editor_page_load(): bool {
	global $pagenow;

	return in_array( $pagenow, array( 'post.php', 'post-new.php', 'site-editor.php', 'widgets.php', 'customize.php' ), true );
}

/**
 * The per-site copy of the user's record.
 *
 * @param int $user_id User ID.
 * @return array{checked: int, dismissed: array}
 */
function wpcom_editor_welcome_guides_atomic_get_cached( int $user_id ): array {
	$cached = get_user_meta( $user_id, WPCOM_EDITOR_WELCOME_GUIDES_CACHE_META, true );

	return array(
		'checked'   => (int) ( $cached['checked'] ?? 0 ),
		'dismissed' => is_array( $cached['dismissed'] ?? null ) ? $cached['dismissed'] : array(),
	);
}

/**
 * Stores the per-site copy and marks it as checked now.
 *
 * @param int   $user_id   User ID.
 * @param array $dismissed Map of preferences scope to guide keys.
 * @return void
 */
function wpcom_editor_welcome_guides_atomic_store( int $user_id, array $dismissed ): void {
	update_user_meta(
		$user_id,
		WPCOM_EDITOR_WELCOME_GUIDES_CACHE_META,
		array(
			'checked'   => time(),
			'dismissed' => $dismissed,
		)
	);
}

/**
 * Calls the `wpcom/v2/me/editor-welcome-guides` endpoint as the current user.
 *
 * @param string     $method HTTP method.
 * @param array|null $body   JSON body for a POST.
 * @return array|null The `dismissed` map from the response, or null when the call failed.
 */
function wpcom_editor_welcome_guides_atomic_request( string $method, ?array $body = null ): ?array {
	if ( ! class_exists( Client::class ) ) {
		return null;
	}

	$response = Client::wpcom_json_api_request_as_user(
		'/me/editor-welcome-guides',
		'2',
		array(
			'method'  => $method,
			'timeout' => 3,
		),
		$body
	);
	if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
		return null;
	}

	$data = json_decode( wp_remote_retrieve_body( $response ), true );

	return is_array( $data ) && is_array( $data['dismissed'] ?? null ) ? $data['dismissed'] : null;
}

/**
 * Answers the shared read hook from the per-site copy, refreshing it from WordPress.com
 * when an editor screen loads for the current user and the copy is missing or older than
 * the TTL. A failed refresh keeps the copy and also waits out the TTL, so the preferences
 * reads that follow in the same request and the next page loads do not retry.
 *
 * @param array $dismissed Map another provider supplied.
 * @param int   $user_id   User ID.
 * @return array Map of preferences scope to guide keys.
 */
function wpcom_editor_welcome_guides_atomic_get_dismissed( $dismissed, $user_id ): array {
	$user_id = (int) $user_id;
	$cached  = wpcom_editor_welcome_guides_atomic_get_cached( $user_id );
	if (
		time() - $cached['checked'] <= WPCOM_EDITOR_WELCOME_GUIDES_CACHE_TTL
		|| get_current_user_id() !== $user_id
		|| ! wpcom_editor_welcome_guides_atomic_is_editor_page_load()
	) {
		return $cached['dismissed'];
	}

	$dismissed = wpcom_editor_welcome_guides_atomic_request( 'GET' ) ?? $cached['dismissed'];
	wpcom_editor_welcome_guides_atomic_store( $user_id, $dismissed );

	return $dismissed;
}
add_filter( 'wpcom_editor_welcome_guides_dismissed', 'wpcom_editor_welcome_guides_atomic_get_dismissed', 10, 2 );

/**
 * Reports to WordPress.com the guides the per-site copy does not know yet, and keeps the
 * record it returns as the new copy.
 *
 * @param int   $user_id   User ID.
 * @param array $dismissed Map of preferences scope to guide keys just turned off.
 * @return void
 */
function wpcom_editor_welcome_guides_atomic_record_dismissed( $user_id, $dismissed ): void {
	$user_id = (int) $user_id;
	if ( get_current_user_id() !== $user_id ) {
		return;
	}

	$known = wpcom_editor_welcome_guides_atomic_get_cached( $user_id )['dismissed'];
	$new   = array();
	foreach ( $dismissed as $scope => $guides ) {
		$missing = array_values( array_diff( (array) $guides, (array) ( $known[ $scope ] ?? array() ) ) );
		if ( ! empty( $missing ) ) {
			$new[ $scope ] = $missing;
		}
	}
	if ( empty( $new ) ) {
		return;
	}

	$record = wpcom_editor_welcome_guides_atomic_request( 'POST', array( 'dismissed' => $new ) );
	if ( null !== $record ) {
		wpcom_editor_welcome_guides_atomic_store( $user_id, $record );
	}
}
add_action( 'wpcom_editor_welcome_guides_dismiss', 'wpcom_editor_welcome_guides_atomic_record_dismissed', 10, 2 );
