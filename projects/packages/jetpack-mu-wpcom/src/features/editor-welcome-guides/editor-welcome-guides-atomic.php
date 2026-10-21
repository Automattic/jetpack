<?php
/**
 * On Atomic sites, fetches the welcome guides the user has dismissed on WordPress.com, caches
 * them in user meta, and reports new dismissals back.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

use Automattic\Jetpack\Connection\Client;

/**
 * User meta key for the cached guides: when they were last fetched and which ones are dismissed.
 */
const WPCOM_EDITOR_WELCOME_GUIDES_CACHE_META = 'wpcom_editor_welcome_guides';

/**
 * How long the copy is served before an editor screen asks WordPress.com again.
 */
const WPCOM_EDITOR_WELCOME_GUIDES_CACHE_TTL = 5 * MINUTE_IN_SECONDS;

/**
 * Whether the page being loaded is an editor screen.
 * Only editor screens fetch from WordPress.com; every other page uses the cached guides.
 *
 * @return bool
 */
function wpcom_editor_welcome_guides_atomic_is_editor_page_load(): bool {
	global $pagenow;

	return in_array( $pagenow, array( 'post.php', 'post-new.php', 'site-editor.php', 'widgets.php', 'customize.php' ), true );
}

/**
 * The cached guides for the user, or an empty cache when nothing is stored yet.
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
 * Caches the dismissed guides for the user and records the time.
 *
 * @param int   $user_id   User ID.
 * @param array $dismissed Map of preferences scope to dismissed guide keys.
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
 * @return array|null The dismissed guides from the response, or null when the call failed.
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
 * Supplies the guides the user has dismissed, from the cache, fetching from WordPress.com
 * first when an editor screen loads for the current user and the cache is missing or stale.
 * A failed fetch keeps the cache and still records the time, so nothing retries until the TTL passes.
 *
 * @param array $dismissed Value passed into the filter, not used: the cached guides replace it.
 * @param int   $user_id   User ID.
 * @return array Map of preferences scope to dismissed guide keys.
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

	$record = wpcom_editor_welcome_guides_atomic_request( 'GET' ) ?? $cached['dismissed'];
	wpcom_editor_welcome_guides_atomic_store( $user_id, $record );

	return $record;
}
add_filter( 'wpcom_editor_welcome_guides_dismissed', 'wpcom_editor_welcome_guides_atomic_get_dismissed', 10, 2 );

/**
 * Sends the guides the cache does not know yet to WordPress.com, and caches the full list it returns.
 *
 * @param int   $user_id   User ID.
 * @param array $dismissed Map of preferences scope to guide keys just dismissed.
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
